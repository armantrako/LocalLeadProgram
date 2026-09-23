import { NextRequest, NextResponse } from "next/server";
import { generateMockLeads } from "@/lib/mockData";
import { fetchLeadsFromGoogle } from "@/lib/googlePlaces";
import type { SearchParamsInput, WebsiteFilter } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const city = sp.get("city")?.trim() || "";
  const category = sp.get("category")?.trim() || "Restaurants";
  const minRating = Number(sp.get("minRating") ?? 0);
  const minReviews = Number(sp.get("minReviews") ?? 0);
  const websiteFilter = (sp.get("websiteFilter") as WebsiteFilter) || "any";
  const pageToken = sp.get("pageToken")?.trim() || undefined;

  if (!city) {
    return NextResponse.json(
      { error: "Unos grada je obavezan." },
      { status: 400 }
    );
  }

  const params: SearchParamsInput = {
    city,
    category,
    minRating,
    minReviews,
    websiteFilter,
    pageToken,
  };

  // Production default: STVARNI Google Places API podaci.
  // MOCK_MODE=true se koristi isključivo za lokalni demo bez API ključa.
  const mockMode = process.env.MOCK_MODE === "true";

  try {
    if (mockMode) {
      const leads = generateMockLeads(params);
      return NextResponse.json({
        leads,
        mockMode: true,
        nextPageToken: null,
        resolvedCity: { name: city, radiusKm: 6.0 },
      });
    }

    const result = await fetchLeadsFromGoogle(params);
    return NextResponse.json({
      leads: result.leads,
      mockMode: false,
      nextPageToken: result.nextPageToken,
      resolvedCity: result.resolvedCity,
      totalBeforeFilter: result.totalBeforeFilter,
      totalAfterGeoFilter: result.totalAfterGeoFilter,
    });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    console.error(`[API /api/leads] Greška za grad "${city}", kategorija "${category}":`, rawMessage);

    // Prilagođene, sigurne poruke za klijenta (bez otkrivanja ključeva)
    if (rawMessage.includes("403") || rawMessage.toLowerCase().includes("permission denied") || rawMessage.toLowerCase().includes("api key")) {
      return NextResponse.json(
        {
          error:
            "Google Places API greška (403): Pristup odbijen. Provjerite da li je GOOGLE_MAPS_API_KEY ispravan i da li je 'Places API (New)' omogućen na Google Cloud Console.",
        },
        { status: 403 }
      );
    }

    if (rawMessage.includes("429") || rawMessage.toLowerCase().includes("quota")) {
      return NextResponse.json(
        {
          error:
            "Google Places API (429): Prekoračena kvota ili previše zahtjeva. Sačekajte trenutak i pokušajte ponovo.",
        },
        { status: 429 }
      );
    }

    if (rawMessage.toLowerCase().includes("nije pronađen")) {
      return NextResponse.json(
        { error: `Grad '${city}' nije pronađen. Molimo provjerite tačnost naziva grada.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: rawMessage || "Došlo je do greške prilikom pretrage." },
      { status: 500 }
    );
  }
}
