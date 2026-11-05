import { NextResponse } from "next/server";
import { isAppError } from "@/lib/errors";
import { requireUser } from "@/server/auth/guards";
import { preparePageExport, recordPageExport } from "@/server/services/export-service";
import { pageIdSchema } from "@/features/pages/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  REVISION_CONFLICT: 409,
  RATE_LIMITED: 429,
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ pageId: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const { pageId } = await context.params;
    const parsed = pageIdSchema.safeParse(pageId);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "ID halaman tidak valid." } },
        { status: 400 },
      );
    }

    const { page, html, sizeBytes } = await preparePageExport({
      pageId: parsed.data,
      userId: user.id,
    });

    await recordPageExport({
      pageId: page.id,
      userId: user.id,
      revision: page.revision,
      content: page.content,
      sizeBytes,
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${page.slug}.html"`,
        "Content-Length": String(sizeBytes),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: STATUS_BY_CODE[error.code] ?? 500 },
      );
    }

    console.error("[exportRoute]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Terjadi kesalahan saat export." } },
      { status: 500 },
    );
  }
}
