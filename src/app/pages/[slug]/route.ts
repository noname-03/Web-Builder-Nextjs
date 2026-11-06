import { renderHtml } from "@/features/export/render-html";
import { getPublishedPageForRender } from "@/server/services/page-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_PUBLIC_SLUG_LENGTH = 120;

const NOT_FOUND_MESSAGE = "Halaman tidak ditemukan.";
const INVALID_MESSAGE = "Alamat halaman tidak valid.";
const ERROR_MESSAGE = "Terjadi kesalahan saat memuat halaman.";

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;

  if (
    typeof slug !== "string" ||
    slug.length === 0 ||
    slug.length > MAX_PUBLIC_SLUG_LENGTH ||
    !PUBLIC_SLUG_PATTERN.test(slug)
  ) {
    return textResponse(INVALID_MESSAGE, 400);
  }

  try {
    const page = await getPublishedPageForRender(slug);

    // Draft dan halaman tidak ada sama-sama 404 supaya keberadaan draft tidak bocor.
    if (!page) return textResponse(NOT_FOUND_MESSAGE, 404);

    const html = renderHtml(page.document);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  } catch (error) {
    console.error("[publicPageRoute]", error);
    return textResponse(ERROR_MESSAGE, 500);
  }
}
