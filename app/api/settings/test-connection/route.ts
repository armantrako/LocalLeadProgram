import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/storage/store";

export async function POST(req: NextRequest) {
  try {
    const { service, apiKey, accessToken, phoneNumberId } = await req.json();
    const settings = getSettings();

    if (service === "google") {
      const keyToTest = apiKey || settings.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
      if (!keyToTest) {
        return NextResponse.json({
          success: false,
          error: "Google Maps API ključ nije unesen niti pronađen u okruženju.",
        });
      }

      const startTime = Date.now();
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": keyToTest,
          "X-Goog-FieldMask": "places.id",
        },
        body: JSON.stringify({ textQuery: "Visoko" }),
      });

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        return NextResponse.json({
          success: true,
          message: `Google Places API (New) uspješno povezan! (Odziv: ${latencyMs}ms)`,
        });
      }

      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Greška: HTTP ${res.status}`;
      return NextResponse.json({
        success: false,
        error: errMsg,
      });
    }

    if (service === "whatsapp") {
      const token = accessToken || settings.whatsappAccessToken || process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneId = phoneNumberId || settings.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!token) {
        return NextResponse.json({
          success: false,
          error: "WhatsApp Access Token nije unesen.",
        });
      }

      if (!phoneId) {
        return NextResponse.json({
          success: false,
          error: "WhatsApp Phone Number ID nije unesen.",
        });
      }

      const startTime = Date.now();
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return NextResponse.json({
          success: true,
          message: `Meta WhatsApp Cloud API uspješno verifikovan! Broj: ${data.display_phone_number || phoneId} (${data.verified_name || "Verifikovan"}). (Odziv: ${latencyMs}ms)`,
          details: data,
        });
      }

      const errMsg = data.error?.message || `Meta API greška: HTTP ${res.status}`;
      return NextResponse.json({
        success: false,
        error: errMsg,
      });
    }

    if (service === "openai") {
      const keyToTest = apiKey || settings.openaiApiKey || process.env.OPENAI_API_KEY;
      if (!keyToTest) {
        return NextResponse.json({
          success: false,
          error: "OpenAI API ključ nije unesen.",
        });
      }

      const startTime = Date.now();
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${keyToTest}`,
        },
      });

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        return NextResponse.json({
          success: true,
          message: `OpenAI API uspješno povezan! (Odziv: ${latencyMs}ms)`,
        });
      }

      const errData = await res.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errData.error?.message || `Greška: HTTP ${res.status}`,
      });
    }

    return NextResponse.json({ success: false, error: "Nepoznat servis za testiranje." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
