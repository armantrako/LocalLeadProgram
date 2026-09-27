# LocalLeadProgram (Lead Finder + AI Sales & WhatsApp Outreach Agent)

> 🚀 **Live Production Vercel aplikacija:** [https://lead-finder-two-alpha.vercel.app](https://lead-finder-two-alpha.vercel.app)  
> 📦 **GitHub repozitorij:** [https://github.com/armantrako/LocalLeadProgram](https://github.com/armantrako/LocalLeadProgram)

Profesionalan **Lead Finder & AI Sales Outreach Agent** koji pronalazi stvarne lokalne biznise u zadanom gradu putem **Google Places API (New)**, vrši AI analizu prisustva biznisa, generiše prilagođene cold pitch poruke i automatizuje WhatsApp outreach sa praćenjem statusa i klasifikacijom odgovora.

---

## 🌟 Glavni moduli sistema

### 1. 🔍 Precision Lead Finder (Google Places API New)
- **Pre-search ograničenje na nivou Google API-ja (`locationRestriction: { rectangle }`):**
  - Dinamičko razrješavanje grada u geografski centar i viewport.
  - Pretraga zaključana unutar stvarnih granica grada bez prelivanja u udaljene gradove.
- **Post-search dvoslojni geografski filter:**
  - Haversine kalkulacija stvarne udaljenosti od centra grada.
  - Podrška za specifična formatiranja adresa (Plus kodovi, lokalna naselja).
  - Automatsko odbacivanje suprotnih gradova i opština.
- **Transparentni Lead Score (0–100):**
  - Evaluacija na osnovu posjedovanja web stranice, Google ocjene i broja recenzija.
- **Paginacija & CSV Export:**
  - Stabilna paginacija bez grešaka praznog upita.
  - Detaljan izvoz svih pronađenih leadova u CSV.

### 2. 🤖 AI Lead Analyzer & Pitch Generator
- **AI analiza poslovnog prisustva:**
  - Prepoznavanje prednosti i mana (nedostatak web stranice, niska ocjena, mali broj recenzija).
  - Definisanje idealnog prodajnog ugla (*Best Sales Angle*).
  - Objašnjenje zašto je biznis idealan klijent (*Why Ideal Client*).
- **Generator personalizovanih poruka:**
  - Dinamičko popunjavanje varijabli: `{business_name}`, `{city}`, `{category}`, `{rating}`, `{review_count}`, `{demo_url}`, `{sender_name}`, `{pricing}`.
  - Podrška za WhatsApp Approved predloške (Template Mode) i Custom AI poruke.

### 3. 💬 WhatsApp Cloud Outreach Engine (Meta Graph API)
- **Validacija i normalizacija telefonskih brojeva:**
  - E.164 konverzija za BiH (`+387`), regionalne i međunarodne brojeve.
  - Stroga provjera podobnosti: automatsko odbacivanje fiksnih/landline brojeva, brojeva bez koda i nepostojećih brojeva.
- **Do Not Contact (DNC) zaštita:**
  - Globalna crna lista koja sprječava kontaktiranje leadova koji su zatražili odjavu.
  - Normalizovano prepoznavanje brojeva.
- **Upravljanje kvotama i Rate Limiting:**
  - Dnevni i satni limiti (npr. max 5 poruka/sat, 25 poruka/dan).
  - Automatski razmaci između slanja radi zaštite WhatsApp broja od restrikcija.
- **Praćenje statusa u realnom vremenu:**
  - `NEW` ➔ `QUEUED` ➔ `SENT` ➔ `DELIVERED` ➔ `READ` ➔ `REPLIED` / `OPTED_OUT` / `FAILED`.

### 4. 🧠 Reply Classifier & Webhook Handler
- **Automatska klasifikacija odgovora:**
  - `STOP` / `OPT_OUT`: Automatsko prebacivanje u DNC listu.
  - `PRICE_REQUEST`: Priprema odgovora sa cjenovnikom.
  - `INTERESTED`: Označavanje visokog prioriteta i prijedlog termina za poziv/demo.
  - `NOT_INTERESTED`: Arhiviranje bez daljeg uznemiravanja.
  - `LATER` / `QUESTION`: Predlaganje personalizovanog odgovora.
- **Pametni Follow-up:**
  - Automatsko generisanje follow-up poruke za leadove koji nisu odgovorili u roku od npr. 48h.

---

## 📊 Rezultati testiranja Geo Filtera

| Grad | Kategorija | Radijus | Prije Geo Filtera | Poslije Geo Filtera | Uklonjeno (ne pripada gradu) |
|---|---|---|---|---|---|
| **Visoko** | Restaurants | 6.0 km | **45** | **45** | **0** (100% u Visokom, 0 iz Mostara/Sarajeva) |
| **Travnik** | Restaurants | 6.0 km | **43** | **42** | **1** (Odbijen ribnjak izvan radijusa) |
| **Zenica** | Auto dealerships | 9.9 km | **27** | **27** | **0** (100% u Zenici, 0 preliva iz Sarajeva) |
| **Mostar** | Hotels | 6.7 km | **8** | **8** | **0** (100% u Mostaru, 0 iz Čapljine/Sarajeva) |
| **Vitez** | Restaurants | 6.0 km | **28** | **28** | **0** (100% u Vitezu, 0 preliva u Travnik/Zenicu) |

---

## 🛠️ Postavljanje i pokretanje

### 1. Kloniranje repozitorija
```bash
git clone https://github.com/armantrako/LocalLeadProgram.git
cd LocalLeadProgram
```

### 2. Instalacija zavisnosti
```bash
npm install
```

### 3. Konfiguracija okruženja (`.env.local`)
Kopiraj `.env.example` u `.env.local` i popuni potrebne ključeve:
```env
# Google Places API (New)
GOOGLE_MAPS_API_KEY=AIzaSy...
MOCK_MODE=false

# Meta WhatsApp Cloud API (opcionalno za live slanje)
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=109283...
WHATSAPP_BUSINESS_ACCOUNT_ID=98273...
WHATSAPP_VERIFY_TOKEN=my_secure_verify_token

# AI Provider (opcionalno - sistem ima ugrađen fallback)
OPENAI_API_KEY=sk-...
```

### 4. Pokretanje razvojnog servera
```bash
npm run dev
```
Otvori [http://localhost:3000](http://localhost:3000).

---

## 🚀 Produkcija (Vercel)

Aplikacija je aktivna i raspoređena na Vercelu:  
👉 **[https://lead-finder-two-alpha.vercel.app](https://lead-finder-two-alpha.vercel.app)**
