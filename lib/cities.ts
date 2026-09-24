/**
 * Lista gradova, opština i naseljenih mjesta u Bosni i Hercegovini.
 * Uključuje najmanje 100 verifikovanih gradova i opština sa uklonjenim duplikatima.
 */

export interface CityOption {
  name: string;
  normalized: string;
  popular?: boolean;
}

export function normalizeCityName(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 10 najčešćih gradova za brzi odabir
 */
export const POPULAR_CITIES = [
  "Sarajevo",
  "Banja Luka",
  "Mostar",
  "Tuzla",
  "Zenica",
  "Bihać",
  "Bijeljina",
  "Brčko",
  "Travnik",
  "Visoko",
  "Vitez",
] as const;

/**
 * Kompletna deduplicirana lista 100+ gradova i opština Bosne i Hercegovine
 */
const RAW_CITIES = [
  // Glavni gradovi i veći centri
  "Sarajevo",
  "Banja Luka",
  "Mostar",
  "Tuzla",
  "Zenica",
  "Bijeljina",
  "Brčko",
  "Bihać",
  "Prijedor",
  "Doboj",
  "Trebinje",
  "Travnik",
  "Visoko",
  "Vitez",
  "Jajce",
  "Bugojno",
  "Gračanica",
  "Gradačac",
  "Cazin",
  "Velika Kladuša",
  "Sanski Most",
  "Bosanska Krupa",
  "Livno",
  "Tomislavgrad",
  "Čapljina",
  "Ljubuški",
  "Široki Brijeg",
  "Grude",
  "Posušje",
  "Neum",
  "Konjic",
  "Jablanica",
  "Prozor-Rama",
  "Goražde",
  "Foča",
  "Višegrad",
  "Zvornik",
  "Srebrenica",
  "Bratunac",
  "Kakanj",
  "Zavidovići",
  "Žepče",
  "Maglaj",
  "Tešanj",
  "Teslić",
  "Derventa",
  "Modriča",
  "Laktaši",
  "Gradiška",
  "Kozarska Dubica",
  "Novi Grad",
  "Kostajnica",
  "Prnjavor",
  "Čelinac",
  "Mrkonjić Grad",
  "Šipovo",
  "Drvar",
  "Glamoč",
  "Bosansko Grahovo",
  "Kupres",
  "Donji Vakuf",
  "Gornji Vakuf-Uskoplje",
  "Novi Travnik",
  "Busovača",
  "Fojnica",
  "Kiseljak",
  "Kreševo",
  "Vareš",
  "Breza",
  "Ilijaš",
  "Hadžići",
  "Ilidža",
  "Vogošća",
  "Stari Grad Sarajevo",
  "Novo Sarajevo",
  "Novi Grad Sarajevo",
  "Centar Sarajevo",
  "Lukavac",
  "Srebrenik",
  "Kalesija",
  "Živinice",
  "Banovići",
  "Kladanj",
  "Sapna",
  "Teočak",
  "Orašje",
  "Odžak",
  "Domaljevac-Šamac",
  "Šamac",
  "Brod",
  "Rogatica",
  "Pale",
  "Istočno Sarajevo",
  "Istočna Ilidža",
  "Istočno Novo Sarajevo",
  "Sokolac",
  "Rudo",
  "Čajniče",
  "Han Pijesak",
  "Trnovo",
  "Kalinovik",
  "Nevesinje",
  "Bileća",
  "Gacko",
  "Berkovići",
  "Stolac",
  "Ravno",
  "Bužim",
  "Ključ",
  "Bosanski Petrovac",
  "Olovo",
  "Doboj Istok",
  "Doboj Jug",
  "Usora",
  "Čelić",
  "Lopare",
  "Ugljevik",
  "Milići",
  "Vlasenica",
  "Šekovići",
  "Kotor Varoš",
  "Srbac",
  "Kneževo",
  "Ribnik",
  "Jezero",
  "Ljubinje",
  "Pelagićevo",
  "Donji Žabar",
  "Stanari",
];

// Dedupliciraj i sortiraj po abecedi (B/C/S)
const uniqueCities = Array.from(new Set(RAW_CITIES)).sort((a, b) =>
  a.localeCompare(b, "bs")
);

export const CITIES: CityOption[] = uniqueCities.map((name) => ({
  name,
  normalized: normalizeCityName(name),
  popular: (POPULAR_CITIES as readonly string[]).includes(name),
}));

/**
 * Pretražuje listu gradova po unosu korisnika (podržava pretragu bez dijakritika)
 */
export function searchCities(query: string, limit = 15): CityOption[] {
  const normQuery = normalizeCityName(query);
  if (!normQuery) {
    // Vrati popularne gradove pa ostatak
    return CITIES.slice(0, limit);
  }

  // Prvo gradovi koji počinju traženim pojmom, zatim oni koji ga sadrže
  const startsWithList: CityOption[] = [];
  const containsList: CityOption[] = [];

  for (const city of CITIES) {
    if (city.normalized.startsWith(normQuery)) {
      startsWithList.push(city);
    } else if (city.normalized.includes(normQuery)) {
      containsList.push(city);
    }
  }

  return [...startsWithList, ...containsList].slice(0, limit);
}
