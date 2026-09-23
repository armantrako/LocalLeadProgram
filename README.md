# LocalLeadProgram

> **Live Vercel aplikacija:** [https://lead-finder-two-alpha.vercel.app](https://lead-finder-two-alpha.vercel.app)  
> **GitHub repozitorij:** [https://github.com/armantrako/LocalLeadProgram](https://github.com/armantrako/LocalLeadProgram)

Profesionalan **Lead Finder** koji koristi stvarni **Google Places API (New)** za pronalaženje stvarnih lokalnih biznisa u **tačno zadanom gradu** i kategoriji, uz naprednu dvoslojnu geografsku validaciju.

---

## 🎯 Glavni cilj i riješeni problem

Prethodna verzija je pri pretragama (npr. Grad: *Visoko*, Kategorija: *Restaurant*) vraćala biznise iz Mostara, Sarajeva ili Travnika jer Google Places Text Search pri manjku lokalnih rezultata ili visokom autoritetu vraća rezultate iz cijele države.

U ovom projektu implementirana je **dvoslojna geografska zaštita**:
1. **Pre-search ograničenje na nivou Google API-ja (`locationRestriction: { rectangle }`):**
   - Grad se dinamički razrješava u stvarni geografski centar i viewport putem Places API (New).
   - Pretraga je fizički zaključana na područje grada i neposrednih lokalnih naselja.
2. **Post-search geografski filter (Obavezna verifikacija):**
   - Provjerava stvarne koordinate (`Haversine` formula udaljenosti od centra).
   - **Podrška za specifična formatiranja adresa:** Ne odbacuje ispravne lokalne biznise koji u adresi imaju Plus kodove (npr. `X5RH+W3P, Branilaca Bosne`), nazive lokalnih prigradskih naselja (npr. `Donje Moštre`) ili ulice nazvane po drugim gradovima (npr. `Kakanjska 46, Visoko`).
   - **Eliminacija suprotnih opština:** Ako biznis navodi drugi poznat grad (npr. Mostar, Sarajevo, Travnik, Kakanj, Ilijaš pri pretrazi Visokog), automatski se odbacuje.

---

## 📊 Rezultati testiranja (Prije i poslije Geo Filtera)

Testirano nad stvarnim Google Places API-jem (New):

| Grad | Kategorija | Radijus | Prije Geo Filtera | Poslije Geo Filtera | Uklonjeno (ne pripada gradu) |
|---|---|---|---|---|---|
| **Visoko** | Restaurants | 6.0 km | **45** | **45** | **0** (100% u Visokom, 0 iz Mostara/Sarajeva/Kaknja) |
| **Travnik** | Restaurants | 6.0 km | **43** | **42** | **1** (Odbijen "Ribnjak Izvor" jer je na 7.6 km > 6.0 km) |
| **Zenica** | Auto dealerships | 9.9 km | **27** | **27** | **0** (100% u Zenici, 0 preliva iz Sarajeva) |
| **Mostar** | Hotels | 6.7 km | **8** | **8** | **0** (100% u Mostaru, 0 iz Čapljine/Sarajeva) |
| **Vitez** | Restaurants | 6.0 km | **28** | **28** | **0** (100% u Vitezu, 0 preliva u Travnik/Zenicu) |

---

## 🚀 Ključne funkcionalnosti

- **Tačna geografska pretraga:** Dinamičko određivanje granica bez hardkodiranja (radi za Visoko, Travnik, Zenicu, Mostar, Vitez, Sarajevo, Tuzlu, Banja Luku, Bihać, Jajce, Bugojno, Kakanj, Tešanj i bilo koji drugi grad).
- **Stvarni podaci bez fake/mock rezultata:**
  - Naziv biznisa
  - Google ocjena i ukupan broj recenzija
  - Tačna adresa i udaljenost od centra grada u km
  - Telefon: pravi broj iz Google API-ja ili *"Telefon nije dostupan"*
  - Website status: dugme `OPEN WEBSITE` ili jasna oznaka `NO WEBSITE`
  - Google Maps: direktan link na stvarni `googleMapsUri`
- **Transparentan Lead Score (0–100):**
  - `+40` ako biznis NEMA web stranicu
  - `+20` ako je ocjena >= 4.5
  - `+15` ako je ocjena >= 4.3 (i < 4.5)
  - `+15` ako ima 100+ recenzija
  - `+10` ako ima 50+ recenzija (i < 100)
- **Korisnički filteri:**
  - Minimalna ocjena (0 - 5.0)
  - Minimalan broj recenzija
  - Website filter (`Any`, `No website`, `Has website`)
- **Sortiranje i izvoz:**
  - Sortiranje po: Lead Score, Google ocjeni, broju recenzija i imenu.
  - **Export CSV** sa svim relevantnim podacima (uključujući udaljenost u km i status websita).
- **Riješena paginacija (`Empty text_query`):**
  - Usklađeno sa Google Places API (New) specifikacijom: svaki pageToken zahtjev zadržava originalne parametre pretrage.

---

## 🛠️ Lokalno pokretanje

1. Kloniraj repozitorij:
   ```bash
   git clone https://github.com/armantrako/LocalLeadProgram.git
   cd LocalLeadProgram
   ```

2. Instaliraj zavisnosti:
   ```bash
   npm install
   ```

3. Postavi environment varijable u `.env.local`:
   ```env
   GOOGLE_MAPS_API_KEY=tvoj_google_places_api_kljuc
   MOCK_MODE=false
   ```

4. Pokreni development server:
   ```bash
   npm run dev
   ```
   Otvori [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deploy na Vercel

Aplikacija je već konfigurisana i povezana sa Vercelom:
- Build command: `npm run build`
- Environment variables:
  - `GOOGLE_MAPS_API_KEY`
  - `MOCK_MODE=false`
