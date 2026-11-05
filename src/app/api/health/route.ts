import { NextResponse } from "next/server";
import { pingDatabase } from "@/server/repositories/system-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await pingDatabase();
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "down" }, { status: 503 });
  }
}
