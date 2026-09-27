import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/storage/store";

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") || 100);
    const logs = getAuditLogs(limit);
    return NextResponse.json({ logs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
