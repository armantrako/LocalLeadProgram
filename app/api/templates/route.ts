import { NextRequest, NextResponse } from "next/server";
import { getTemplates, saveTemplate } from "@/lib/storage/store";

export async function GET() {
  try {
    const templates = getTemplates();
    return NextResponse.json(templates);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.body) {
      return NextResponse.json(
        { error: "Naziv i tekst template-a su obavezni." },
        { status: 400 }
      );
    }

    const saved = saveTemplate(body);
    return NextResponse.json({ success: true, template: saved });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
