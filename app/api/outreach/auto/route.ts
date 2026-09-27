import { NextResponse } from "next/server";
import { processOutreachQueue } from "@/lib/whatsapp/queue";

export async function POST() {
  try {
    const result = await processOutreachQueue();
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  // Podrška za Vercel Cron ili ručni GET trigger
  return POST();
}
