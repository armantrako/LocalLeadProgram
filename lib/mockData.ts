import { calculateLeadScore } from "./leadScore";
import { applyFilters } from "./filters";
import type { Lead, SearchParamsInput } from "./types";
export { applyFilters };

const NAME_PARTS: Record<string, string[]> = {
  Restaurants: ["Restoran Bosna", "Kod Ćire", "Stari Grad Grill", "Pod Lipom", "Aščinica Zlatna Ribica"],
  Hotels: ["Hotel Central", "Grand Hotel", "Hotel Vezir", "Hotel Panorama"],
  Motels: ["Motel Raskrsnica", "Motel Sunce", "Motel Putnik"],
  "Auto dealerships": ["Auto Centar Prvi", "Motors Plus", "Auto Galerija Zlatna"],
  "Auto services": ["Auto Servis Marko", "Brzi Servis", "Servis i Gume Halid"],
  "Wedding venues": ["Sala Kristal", "Dvorana Biser", "Vila Ruža"],
  Cafes: ["Kafe Đir", "Caffe Bar Corner", "Slatki Kutak"],
  "Hair salons": ["Frizerski Salon Stil", "Hair Studio Elite", "Salon Ana"],
  "Beauty salons": ["Beauty Studio Glam", "Salon Ljepote Nina", "Studio Lure"],
  Dentists: ["Stomatološka Ordinacija Osmijeh", "Dental Care Plus", "Zubna Ordinacija Dr. Kovač"],
  Gyms: ["Fitness Klub Snaga", "Gym Iron", "Teretana Puls"],
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Demo podaci isključivo za lokalni development kada je MOCK_MODE=true.
 * Nikada se ne koristi u produkciji.
 */
export function generateMockLeads(params: SearchParamsInput): Lead[] {
  const pool = NAME_PARTS[params.category] ?? NAME_PARTS["Restaurants"];
  const rand = seededRandom(
    params.city.length * 7 + params.category.length * 13 + 42
  );

  const count = 16;
  const leads: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const baseName = pool[i % pool.length];
    const name = i < pool.length ? baseName : `${baseName} ${Math.floor(i / pool.length) + 2}`;

    const rating = Math.round((3.5 + rand() * 1.5) * 10) / 10;
    const reviewCount = Math.floor(rand() * 750) + 3;
    const hasWebsite = rand() > 0.5;
    const hasPhone = rand() > 0.25;

    const website = hasWebsite ? `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example.com` : null;
    const phone = hasPhone ? `+387 6${Math.floor(rand() * 9)} ${Math.floor(100 + rand() * 900)}-${Math.floor(100 + rand() * 900)}` : null;

    const { score, reasons } = calculateLeadScore({ rating, reviewCount, website });

    leads.push({
      id: `mock-${i}`,
      name,
      rating,
      reviewCount,
      address: `${params.city}, Bosnia and Herzegovina`,
      phone,
      website,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + params.city)}`,
      leadScore: score,
      scoreReasons: reasons,
      distanceKm: Math.round(rand() * 4 * 10) / 10,
    });
  }

  return applyFilters(leads, params);
}

