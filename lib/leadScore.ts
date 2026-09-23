/**
 * Transparentna Lead Score funkcija (0-100) prema specifikaciji:
 *
 *  +40  ako biznis NEMA website
 *  +20  ako je rating >= 4.5
 *  +15  ako je rating >= 4.3 (i < 4.5)
 *  +15  ako ima 100+ recenzija
 *  +10  ako ima 50+ recenzija (i < 100)
 *
 * Maksimalan broj bodova: 100.
 * Bez AI nagađanja - isključivo stvarni podaci.
 */
export function calculateLeadScore(input: {
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
}): { score: number; reasons: string[] } {
  const { rating, reviewCount, website } = input;
  let score = 0;
  const reasons: string[] = [];

  const hasWebsite = !!website;
  if (!hasWebsite) {
    score += 40;
    reasons.push("No website (+40)");
  } else {
    reasons.push("Has website (0)");
  }

  if (rating !== null && typeof rating === "number") {
    if (rating >= 4.5) {
      score += 20;
      reasons.push(`Rating ${rating.toFixed(1)} (+20)`);
    } else if (rating >= 4.3) {
      score += 15;
      reasons.push(`Rating ${rating.toFixed(1)} (+15)`);
    } else {
      reasons.push(`Rating ${rating.toFixed(1)}`);
    }
  }

  if (reviewCount !== null && typeof reviewCount === "number") {
    if (reviewCount >= 100) {
      score += 15;
      reasons.push(`${reviewCount} reviews (+15)`);
    } else if (reviewCount >= 50) {
      score += 10;
      reasons.push(`${reviewCount} reviews (+10)`);
    } else {
      reasons.push(`${reviewCount} reviews`);
    }
  }

  return { score: Math.min(score, 100), reasons };
}
