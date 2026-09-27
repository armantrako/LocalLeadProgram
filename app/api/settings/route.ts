import { NextRequest, NextResponse } from "next/server";
import { getSettings, logAuditEvent, updateSettings } from "@/lib/storage/store";

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateSettings(body);

    logAuditEvent({
      leadId: "system",
      businessName: "Postavke sistema",
      action: "STATUS_CHANGED",
      status: "info",
      channel: "system",
      source: "manual",
      details: "Ažurirane postavke sistema i AI prodajnog konteksta",
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
