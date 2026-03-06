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

## 8) Korisni endpoint prefiksi

- `/auth`
- `/appointments`
- `/medical-records`
- `/prescriptions`
- `/doctors`

---
Ukoliko imate bilo kakvih pitanja ili vam je potrebna podrška, slobodno otvorite issue na GitHub-u ili me direktno kontaktirajte.

Napravljeno sa ❤️ uz Node.js, Angular i MongoDB