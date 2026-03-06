# Medify

Medify je full-stack aplikacija za upravljanje ordinacijom (studentski projekat iz predmeta Web programiranje 2), sa Angular frontendom i Node.js/Express backendom.

## 1) Plan projekta

### Cilj
Napraviti sistem koji pokriva osnovne procese rada ordinacije:
- autentifikacija i role-based pristup
- zakazivanje termina
- vođenje medicinskih kartona
- izdavanje recepata
- upravljanje dostupnošću doktora

### Uloge u sistemu
- **admin**: upravljanje korisnicima i administrativne privilegije
- **doctor**: termini, kartoni, recepti, dostupnost
- **nurse**: ograničen pristup medicinskim kartonima i pomoćnim operacijama
- **patient**: uvid u sopstvene termine, kartone i recepte; zakazivanje termina

### Arhitektura
- **Frontend**: Angular 21 (Standalone komponente)
- **Backend**: Node.js + Express 5 + Passport (Local + JWT)
- **Baza**: MongoDB + Mongoose

---

## 2) Funkcionalnosti

### Autentifikacija i autorizacija
- registracija korisnika
- prijava i izdavanje JWT tokena
- zaštita ruta po ulogama

### Termini
- kreiranje termina (doctor/patient scenariji)
- pregled termina za doktora i pacijenta
- izmena statusa i detalja termina
- brisanje termina

### Medicinski kartoni
- kreiranje i izmena kartona
- dodavanje laboratorijskih rezultata
- pregled po pacijentu i po ID-u
- brisanje kartona

### Recepti
- kreiranje recepta
- pregled svih/aktivnih recepata pacijenta
- promena statusa recepta
- brisanje recepta

### Doktori i dostupnost
- lista i pretraga doktora
- pregled doktora po ID-u
- podešavanje, izmena i brisanje dostupnosti
- dobijanje slobodnih termina za datum

---

## 3) Struktura repozitorijuma

```text
Medify/
  backend/
  frontend/
```

- `backend/` sadrži REST API, modele, servise i rute
- `frontend/` sadrži Angular aplikaciju i UI komponente

---

## 4) Pokretanje projekta (lokalno)

## Preduslovi
- Node.js 18+ (preporuka: LTS)
- npm
- MongoDB (lokalni servis ili cloud konekcija)

## Backend
1. Uđi u backend folder:
   ```bash
   cd backend
   ```
2. Instaliraj zavisnosti:
   ```bash
   npm install
   ```
3. Proveri konfiguraciju u `backend/config.js`:
   - `PORT` (podrazumevano `3232`)
   - `MongoConnection` (podrazumevano `mongodb://localhost:27017/Medify`)
   - `secret` (JWT secret)
4. Pokreni backend:
   ```bash
   node index.js
   ```

Backend će biti dostupan na `http://localhost:3232`.

## Frontend
1. Uđi u frontend folder:
   ```bash
   cd frontend
   ```
2. Instaliraj zavisnosti:
   ```bash
   npm install
   ```
3. Pokreni frontend:
   ```bash
   npm start
   ```

Frontend će biti dostupan na `http://localhost:4200`.

Napomena: frontend očekuje backend na `http://localhost:3232`.

---

## 5) Testiranje

## Frontend testovi
Pokretanje unit testova:
```bash
cd frontend
npm test
```

## Backend testiranje
U projektu trenutno nema automatizovanih backend test skripti (npr. Jest/Supertest).
Preporučeni praktični pristup:
- testiraj endpointe preko Postman/Insomnia/Thunder Client
- proveri role-based pristup sa različitim JWT tokenima
- proveri validacije i edge-case scenarije (neispravni datumi, nepostojeći ID-evi, nevažeći statusi)

---

## 6) Produkcija (deployment)

Ispod je jednostavan i praktičan deployment plan bez promene arhitekture.

## 6.1 Backend deployment

1. **Environment varijable** (preporučeno):
   - `PORT`
   - `MONGO_CONNECTION`
   - `JWT_SECRET`

2. **Refaktor config-a za env** (preporučeno za produkciju):
   - umesto hardkodovanih vrednosti u `config.js`, koristiti `process.env`

3. **Pokretanje Node procesa**:
   - direktno: `node index.js`
   - preporučeno: PM2
     ```bash
     pm2 start index.js --name medify-backend
     pm2 save
     pm2 startup
     ```

4. **Reverse proxy**:
   - Nginx ispred backenda
   - HTTPS sertifikat (npr. Let's Encrypt)

## 6.2 Frontend deployment

1. Build frontend-a:
```bash
cd frontend
npm run build
```

2. Deploy statičkih fajlova iz `frontend/dist/`:
- Nginx
- Apache
- Vercel / Netlify / GitHub Pages (u zavisnosti od potrebe)

3. Ako koristiš Angular SSR, koristi `npm run serve:ssr:frontend` nakon build-a i hostuj Node SSR proces.

## 6.3 Baza podataka
- produkcioni MongoDB (Atlas ili self-hosted)
- whitelist IP adresa
- redovan backup i monitoring

---

## 7) Bezbednosne preporuke pre produkcije

- nikad ne držati stvarni JWT secret u repozitorijumu
- koristiti CORS restrikcije za produkcioni domen
- uključiti rate limiting i osnovne sigurnosne middleware-e (npr. helmet)
- logovanje grešaka i centralizovan monitoring
- redovan update npm paketa

---

## 8) Korisni endpoint prefiksi

- `/auth`
- `/appointments`
- `/medical-records`
- `/prescriptions`
- `/doctors`

---

## 9) Trenutna ograničenja

- backend nema automatizovane testove
- konfiguracija je trenutno delom hardkodovana (`backend/config.js`)
- za produkciju je preporučen prelazak na `.env` konfiguraciju

---

## 10) Dalji razvoj (predlog)

- dodati backend testove (Jest + Supertest)
- centralizovan error-handler i request logging
- audit trail za izmene kartona i recepata
- CI/CD pipeline (build + test + deploy)

---

Za detalje API-ja i komponenti vidi:
- `backend/README.md`
- `frontend/README_FRONTEND.md`
