import type { Lead } from "./types";
import { calculateLeadScore } from "./leadScore";

export interface SeedCityData {
  city: string;
  category: string;
  radiusKm: number;
  leads: Lead[];
}

function makeLead(
  id: string,
  name: string,
  address: string,
  rating: number | null,
  reviewCount: number | null,
  phone: string | null,
  website: string | null,
  mapsUrl: string,
  distanceKm: number
): Lead {
  const { score, reasons } = calculateLeadScore({ rating, reviewCount, website });
  return {
    id,
    name,
    address,
    rating,
    reviewCount,
    phone,
    website,
    mapsUrl,
    distanceKm,
    leadScore: score,
    scoreReasons: reasons,
  };
}

export const SEED_DATA: Record<string, SeedCityData> = {
  "visoko:restaurants": {
    city: "Visoko",
    category: "Restaurants",
    radiusKm: 6.0,
    leads: [
      makeLead("ChIJTZiAEwAvX0cRRprfI2UmIvQ", "Semić & Meat", "Aleja šehida Resula 1, Visoko, Bosnia and Herzegovina", 4.4, 626, "032 733-333", "http://www.semicmeat.ba/", "https://maps.google.com/?cid=17591665310297987654", 0.3),
      makeLead("ChIJ6d_sV8kvX0cRO5y-8qL-Xj8", "Burgmen Burger Visoko", "Čaršijska 18, Visoko 71300, Bosnia and Herzegovina", 4.9, 1053, "062 207 567", null, "https://maps.google.com/?cid=4564287515438812219", 0.7),
      makeLead("ChIJw-1zTsgvX0cRUq-z8Wc4nOI", "Restaurant Most", "Alije Izetbegovića, Visoko 71300, Bosnia and Herzegovina", 4.4, 957, "032 737-555", "http://www.restoranmost.com/", "https://maps.google.com/?cid=16327318728084123474", 0.5),
      makeLead("ChIJZ_0bSgEvX0cRS-8u-n2E_hA", "Vema", "X5RH+W3P, Branilaca Bosne, Visoko, Bosnia and Herzegovina", 4.2, 572, null, "http://vema.menu/", "https://maps.google.com/?cid=11649666014496262475", 0.1),
      makeLead("ChIJi-Z5P8gvX0cR7Q3W4vE8iJw", "Nafaka Family", "Čaršijska 42, Visoko 71300, Bosnia and Herzegovina", 4.2, 81, "061 448 218", "https://nafaka.cafe/", "https://maps.google.com/?cid=11277322971295985133", 0.8),
      makeLead("ChIJ1-4hVsYvX0cR0j-n8qP-Xj8", "Restoran \"ŠERPICA\"", "Čaršijska 41, Visoko 71300, Bosnia and Herzegovina", 4.6, 215, "062 308 231", null, "https://maps.google.com/?cid=7284287515438812219", 0.8),
      makeLead("ChIJCw0hVskvX0cRLV1fE-4rA9Q", "Restoran Ajdin", "Kakanjska 46, Visoko, Bosnia and Herzegovina", 4.3, 142, "032 738-210", null, "https://maps.google.com/?cid=15276328728084123474", 1.9),
      makeLead("ChIJ_5iAEwAvX0cRRprfI2UmIv9", "Ribarski Dom Restaurant", "Mule Hodžića, Visoko, Bosnia and Herzegovina", 4.5, 380, "061 930 747", null, "https://maps.google.com/?cid=17591665310297987659", 1.4),
      makeLead("ChIJ_6iAEwAvX0cRRprfI2UmIv8", "soul.mind.body restoran", "Ravne bb, Visoko 71300, Bosnia and Herzegovina", 4.8, 194, "061 112 233", "https://ravne.ba/", "https://maps.google.com/?cid=17591665310297987658", 1.5),
      makeLead("ChIJ_7iAEwAvX0cRRprfI2UmIv7", "Restaurant No.1", "Podvisoki 106, Visoko 71300, Bosnia and Herzegovina", 4.5, 412, "032 735-111", null, "https://maps.google.com/?cid=17591665310297987657", 1.7),
      makeLead("ChIJ_8iAEwAvX0cRRprfI2UmIv6", "Pizzeria & Restaurant VERDI", "Branilaca Bosne 61, Visoko 71300, Bosnia and Herzegovina", 4.4, 287, "032 738-999", "https://verdi.ba/", "https://maps.google.com/?cid=17591665310297987656", 0.4),
      makeLead("ChIJ_9iAEwAvX0cRRprfI2UmIv5", "Natura Food", "X5W5+PW5, Visoko, Bosnia and Herzegovina", 4.3, 98, "066 492-343", null, "https://maps.google.com/?cid=17591665310297987655", 1.5),
      makeLead("ChIJ_0iAEwAvX0cRRprfI2UmIv4", "Ćevabdžinica \"Kod Ibre\"", "X5RF+R8X, Muhameda Hadžijahića, Visoko, Bosnia and Herzegovina", 4.6, 310, "061 889 900", null, "https://maps.google.com/?cid=17591665310297987654", 0.3),
      makeLead("ChIJ_1iAEwAvX0cRRprfI2UmIv3", "Fakat Doner", "Branilaca Bosne 19, Visoko 71300, Bosnia and Herzegovina", 4.7, 185, "062 110 099", null, "https://maps.google.com/?cid=17591665310297987653", 0.2),
      makeLead("ChIJ_2iAEwAvX0cRRprfI2UmIv2", "Nafaka Moštre", "Donje Moštre, Bosnia and Herzegovina", 4.3, 140, "061 556 677", null, "https://maps.google.com/?cid=17591665310297987652", 4.8),
      makeLead("ChIJ_3iAEwAvX0cRRprfI2UmIv1", "Ljetna Bašta \"Hurem\"", "Aleja Suvenirnica Ravne, Visoko 71300, Bosnia and Herzegovina", 4.6, 92, "061 778 899", null, "https://maps.google.com/?cid=17591665310297987651", 1.4),
      makeLead("ChIJ_4iAEwAvX0cRRprfI2UmIv0", "Gradska kafana Pizzeria Milano", "X5QJ+CPW, Alije Izetbegovića, Visoko 71300, Bosnia and Herzegovina", 4.2, 230, "032 730-100", null, "https://maps.google.com/?cid=17591665310297987650", 0.6),
    ],
  },
  "travnik:restaurants": {
    city: "Travnik",
    category: "Restaurants",
    radiusKm: 6.0,
    leads: [
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX1A", "Gusto Restaurant Travnik", "Bosanska bb, Travnik, Bosnia and Herzegovina", 4.6, 420, "062 472 536", "https://gustotravnik.ba/", "https://maps.google.com/?cid=1234567890123456781", 0.1),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX1B", "Ex ponto Bar & Restaurant", "Zenjak, Travnik 72270, Bosnia and Herzegovina", 4.7, 850, "030 595-212", "https://exponto.ba/", "https://maps.google.com/?cid=1234567890123456782", 0.3),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX1C", "Restoran Konoba \"Plava voda\"", "Travnik 72270, Bosnia and Herzegovina", 4.5, 1200, "061 311 729", null, "https://maps.google.com/?cid=1234567890123456783", 0.7),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX1D", "Cafe - Restaurant Esel", "U sklopu Konzum, Bosanska, Travnik 72270, Bosnia and Herzegovina", 4.3, 195, "030 518-000", null, "https://maps.google.com/?cid=1234567890123456784", 0.1),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX1E", "Hari ''Ćevabdžinica''", "Donja čaršija bb, Travnik 72270, Bosnia and Herzegovina", 4.8, 3400, "030 511-727", "https://cevabdzinica-hari.com/", "https://maps.google.com/?cid=1234567890123456785", 0.5),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX1F", "Padrino Travnik", "Školska bb, Travnik 72270, Bosnia and Herzegovina", 4.5, 310, "030 511-111", null, "https://maps.google.com/?cid=1234567890123456786", 0.4),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX1G", "Restoran Vrelo", "Plava Voda, Travnik 72270, Bosnia and Herzegovina", 4.4, 450, "030 512-345", null, "https://maps.google.com/?cid=1234567890123456787", 0.8),
    ],
  },
  "zenica:auto dealerships": {
    city: "Zenica",
    category: "Auto dealerships",
    radiusKm: 9.9,
    leads: [
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX2A", "NCarsZenica", "Zmaja od Bosne bb, Zenica 72000, Bosnia and Herzegovina", 4.7, 45, "062 223 064", "https://ncars.ba/", "https://maps.google.com/?cid=2234567890123456781", 1.1),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX2B", "Gear Spot d.o.o. Zenica", "6V6V+CJ7, ZAVNOBiH-a, Zenica 72000, Bosnia and Herzegovina", 4.8, 38, "066 191-119", "https://gearspot.ba/", "https://maps.google.com/?cid=2234567890123456782", 1.4),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX2C", "BMT Trade d.o.o. Zenica", "ZAVNOBiH-a 84A, Zenica 72000, Bosnia and Herzegovina", 4.5, 52, "062 017 093", "https://bmttrade.ba/", "https://maps.google.com/?cid=2234567890123456783", 0.8),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX2D", "DEAautocentar", "Sarajevska 72000, Zenica 72000, Bosnia and Herzegovina", 4.6, 84, "061 310 330", null, "https://maps.google.com/?cid=2234567890123456784", 2.8),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX2E", "Auto Salon Kobić", "6V6X+4RW, Zmaja od Bosne, Zenica 72000, Bosnia and Herzegovina", 4.4, 61, "062 329 409", "https://kobic.ba/", "https://maps.google.com/?cid=2234567890123456785", 1.0),
    ],
  },
  "mostar:hotels": {
    city: "Mostar",
    category: "Hotels",
    radiusKm: 6.7,
    leads: [
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX3A", "Hotel Karting", "Vukovarska bb, Mostar 88000, Bosnia and Herzegovina", 4.5, 410, "036 326-666", "https://hotelkarting.ba/", "https://maps.google.com/?cid=3234567890123456781", 1.2),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX3B", "Hotel Mostar", "Kneza Domagoja 14, Mostar 88000, Bosnia and Herzegovina", 4.4, 820, "036 446-500", "https://hotelmostar.ba/", "https://maps.google.com/?cid=3234567890123456782", 0.3),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX3C", "Hotel Mepas", "Kneza Višeslava, Mostar 88000, Bosnia and Herzegovina", 4.7, 1650, "036 382-000", "https://mepas-hotel.ba/", "https://maps.google.com/?cid=3234567890123456783", 0.6),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX3D", "City Hotel Mostar", "Vukovarska 7, Mostar 88000, Bosnia and Herzegovina", 4.6, 680, "036 349-090", "https://city-hotel.ba/", "https://maps.google.com/?cid=3234567890123456784", 1.2),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX3E", "Mostay Hotel", "Maršala Tita 25, Mostar 88000, Bosnia and Herzegovina", 4.8, 140, "061 191 928", "https://mostayhotel.ba/", "https://maps.google.com/?cid=3234567890123456785", 1.2),
    ],
  },
  "vitez:restaurants": {
    city: "Vitez",
    category: "Restaurants",
    radiusKm: 6.0,
    leads: [
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX4A", "Kod mlina", "Poslovni centar 96, Zona II, Vitez 72250, Bosnia and Herzegovina", 4.6, 520, "030 712-739", "https://kodmlina.ba/", "https://maps.google.com/?cid=4234567890123456781", 2.0),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX4B", "Pizzeria Verona", "5Q5Q+379, Branilaca Starog Viteza, Vitez, Bosnia and Herzegovina", 4.5, 340, "066 495-272", "https://verona-vitez.ba/", "https://maps.google.com/?cid=4234567890123456782", 0.8),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX4C", "Grill željeznicka stanica", "Stjepana Radića, Vitez 72250, Bosnia and Herzegovina", 4.4, 210, "030 714-191", "https://grillstanica.ba/", "https://maps.google.com/?cid=4234567890123456783", 1.3),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX4D", "BALKAN Döner", "PC96, Vitez, Bosnia and Herzegovina", 4.5, 115, null, "https://balkandoner.ba/", "https://maps.google.com/?cid=4234567890123456784", 1.0),
      makeLead("ChIJrwHk5_k2X0cRRb9Y8_KkX4E", "caffe pizzeria Kaktus", "4QXV+R96, Vitez, Bosnia and Herzegovina", 4.7, 430, "030 710-385", "https://kaktusvitez.ba/", "https://maps.google.com/?cid=4234567890123456785", 0.2),
    ],
  },
};
