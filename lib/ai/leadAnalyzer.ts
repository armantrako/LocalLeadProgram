import type { BusinessAnalysis, Lead } from "../types";

/**
 * Detaljna analiza biznisa zasnovana isključivo na stvarnim podacima sa Google Places API-ja.
 * Ne izmišlja činjenice.
 */
export function analyzeLeadLocally(lead: Lead): BusinessAnalysis {
  const hasWebsite = !!lead.website && lead.website.trim().length > 0;
  const rating = lead.rating ?? 0;
  const reviews = lead.reviewCount ?? 0;

  // Analiza postojećeg web prisustva
  let websiteAnalysis = "Biznis nema registrovani website na Google profilu.";
  let isSocialProfile = false;

  if (hasWebsite && lead.website) {
    const lowerUrl = lead.website.toLowerCase();
    if (
      lowerUrl.includes("facebook.com") ||
      lowerUrl.includes("fb.com") ||
      lowerUrl.includes("instagram.com")
    ) {
      isSocialProfile = true;
      websiteAnalysis =
        "Kao web stranica je postavljen link ka društvenim mrežama (Facebook/Instagram), a ne samostalna web stranica. Nedostaje profesionalna domena, brzi meni i direktna konverzija.";
    } else {
      websiteAnalysis = `Prijavljena web stranica: ${lead.website}. Potrebno provjeriti mobilni odziv, brzinu učitavanja i modernost dizajna.`;
    }
  }

  // Kvalitet online prisustva na osnovu recenzija
  let onlinePresenceQuality: "poor" | "moderate" | "good" | "excellent" = "poor";
  if (reviews >= 200 && rating >= 4.4) {
    onlinePresenceQuality = "excellent";
  } else if (reviews >= 50 && rating >= 4.0) {
    onlinePresenceQuality = "good";
  } else if (reviews >= 10) {
    onlinePresenceQuality = "moderate";
  }

  // Zašto je idealan klijent
  let whyIdealClient = "";
  if (!hasWebsite || isSocialProfile) {
    if (reviews >= 50) {
      whyIdealClient = `Biznis ima visoku lokalnu posjećenost i snažnu bazu kupaca (${reviews} recenzija, ocjena ${rating.toFixed(1)}), ali NEMA modernu web stranicu. Svakodnevno gube direktne posjete i rezervacije jer ih posjetioci traže na Google-u.`;
    } else {
      whyIdealClient = `Lokalni biznis sa ${reviews} recenzija. Zbog nepostojanja web stranice novi klijenti teško pronalaze cjenovnik, radno vrijeme i tačne usluge na internetu.`;
    }
  } else {
    whyIdealClient = `Biznis ima aktivnu web stranicu, ali uz ${reviews} recenzija ima potencijal za redizajn, veću brzinu, SEO optimizaciju i povećanje online upita.`;
  }

  // Potencijal za novu web stranicu
  let websitePotential = "";
  if (!hasWebsite || isSocialProfile) {
    websitePotential =
      "Izrada brze 'mobile-first' prezentacije sa digitalnim cjenovnikom/menijem, direktnim WhatsApp i telefonskim pozivom jednim klikom, te SEO pozicioniranjem za lokalne pretrage.";
  } else {
    websitePotential =
      "Redizajn u moderan stil prilagođen mobitelima, optimizacija brzine učitavanja (Core Web Vitals) i integracija direktnog WhatsApp chat dugmeta za povećanje prodaje.";
  }

  // Najbolji prodajni ugao (Sales Angle)
  let bestSalesAngle = "";
  if (!hasWebsite) {
    if (reviews >= 100) {
      bestSalesAngle = `Naglasiti reputaciju: "Imate preko ${reviews} odličnih recenzija, ali kada vas turisti i gosti traže na Google-u, ne mogu vidjeti ponudu i cjenovnik. Napravio sam primjer kako to može izgledati."`;
    } else {
      bestSalesAngle =
        'Fokus na jednostavnost i dostupnost: "Pokažite klijentima radno vrijeme, usluge i kontakt na jednom mjestu preko modernog web sajta koji se savršeno otvara na svakom mobitelu."';
    }
  } else if (isSocialProfile) {
    bestSalesAngle =
      'Fokus na profesionalnost: "Facebook i Instagram stranice su odlične, ali profesionalna web stranica donosi veće povjerenje i bolje rangiranje na Google mapi kada neko traži vaše usluge u gradu."';
  } else {
    bestSalesAngle =
      'Fokus na modernizaciju i mobilnu brzinu: "Poboljšanje brzine i konverzije posjetilaca sa Google mapa u stvarne kupce."';
  }

  return {
    whyIdealClient,
    hasWebsite,
    websiteAnalysis,
    onlinePresenceQuality,
    websitePotential,
    bestSalesAngle,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Ako je podešen OpenAI ili Gemini ključ, možemo pozvati LLM za još dublju analizu,
 * uz pouzdan lokalni fallback.
 */
export async function analyzeLeadWithAI(lead: Lead): Promise<BusinessAnalysis> {
  const localAnalysis = analyzeLeadLocally(lead);

  // Provjeri da li postoji OpenAI ključ
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return localAnalysis;
  }

  try {
    const prompt = `Analiziraj lokalni biznis za prodaju web stranica:
Naziv: ${lead.name}
Grad: ${lead.city || lead.address || "BiH"}
Kategorija: ${lead.category || "Biznis"}
Ocjena: ${lead.rating || "Nema"} (${lead.reviewCount || 0} recenzija)
Ima web stranicu: ${lead.website ? lead.website : "NE"}
Adresa: ${lead.address || "Nema"}

Vrati isključivo validan JSON objekat sa poljima:
{
  "whyIdealClient": "kratko objašnjenje zašto je dobar klijent na bosanskom",
  "websiteAnalysis": "analiza web stanja na bosanskom",
  "websitePotential": "šta bi nova web stranica donijela biznisu",
  "bestSalesAngle": "najbolji prodajni ugao za WhatsApp poruku"
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = JSON.parse(data.choices[0].message.content);
      return {
        ...localAnalysis,
        whyIdealClient: content.whyIdealClient || localAnalysis.whyIdealClient,
        websiteAnalysis: content.websiteAnalysis || localAnalysis.websiteAnalysis,
        websitePotential: content.websitePotential || localAnalysis.websitePotential,
        bestSalesAngle: content.bestSalesAngle || localAnalysis.bestSalesAngle,
      };
    }
  } catch (err) {
    console.warn("[AI Analyzer] Greška pri LLM pozivu, koristim lokalnu analizu:", err);
  }

  return localAnalysis;
}
