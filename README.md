# Medify - Sistem za upravljanje ordinacijom

Medify je **studentski projekat iz predmeta Web programiranje 2** — RESTful API backend za upravljanje ordinacijom. Projekt je struktuisan da podrži više uloga (admin, doctor, nurse, patient) i sadrži osnovne funkcionalnosti za upravljanje korisnicima.

---

## Tehnologije

- **Backend**: Node.js (v18+), Express 5
- **Baza podataka**: MongoDB, Mongoose
- **Arhitektura**: RESTful API
- **Pakovanje**: npm

---

## Preduslovi

Pre pokretanja aplikacije instalirajte:

- [Node.js](https://nodejs.org/) (preporučeno v18+ zbog Express 5)
- [MongoDB](https://www.mongodb.com/) (lokalna ili cloud instanca)

---

## Instalacija i pokretanje

1. Klonirajte repozitorijum i uđite u folder:

```powershell
git clone https://github.com/aleksandarm03/Medify
cd Medify
```

2. Instalirajte zavisnosti:

```powershell
npm install
```

3. Proverite `config.js` i podesite `PORT` i `MongoConnection` (npr. `mongodb://localhost:27017/Medify`).

4. Pokrenite MongoDB (lokalno ili koristite cloud konekciju).

5. Pokrenite aplikaciju:

```powershell
node .\index.js
```

Server će biti dostupan na `http://localhost:<PORT>`.

---

## API Dokumentacija (trenutno implementirano)

### Testni endpoint

GET /test

- Opis: Testira da li je API funkcionalan
- Odgovor: HTTP 200, telo: `"Test API!"`

### Autentifikacija i korisnici (rute su pod `/auth`)

POST /auth/register

- Opis: Registruje novog korisnika (koristi `services/userService.register`)
- Telo: JSON sa poljima `firstName`, `lastName`, `password`, `homeAddress`, `phoneNumber`, `gender`, `role`
- Odgovor: Kreirani korisnik ili odgovarajuća greška

GET /auth/users

- Opis: Dohvata sve korisnike iz baze
- Odgovor: Lista korisnika u JSON formatu

Napomena: `express.json()` middleware je uključen za parsiranje JSON tela.

---

## Model korisnika

Model se nalazi u `models/user.js` i sadrži podršku za hash-ovanje lozinke putem Node-ovog `crypto` modula (PBKDF2). Polja uključuju opšta polja (ime, prezime, adresa, telefon, pol, datum rođenja, uloga) i dodatna polja specifična za lekare i pacijente.

---

## Struktura projekta (aktuelna)

```
Medify/
├── config.js
├── index.js
├── package.json
├── README.md
├── models/
│   └── user.js
├── routes/
│   └── auth.js
└── services/
    └── userService.js
```

---

## Napomene i budući koraci

- Trenutno su implementirane osnovne rute za registraciju i dohvatanje korisnika. Sledeći koraci su: autentifikacija (JWT), autorizacija (role-based middleware), kompletiranje validacije ulaznih podataka i dodavanje funkcionalnosti za zakazivanje termina i medicinske kartone.

- Paket `crypto` iz npm-a NIJE potreban jer Node.js ima ugrađeni `crypto` modul — koristite ugrađeni modul (`require('crypto')`) umesto spoljnog paketa.

Ako želiš, mogu: ažurirati `package.json` da ukloni eventualne neželjene dependency-je, dodati primer zahteva za registraciju (`curl` / Postman), ili implementirati osnovnu autentifikaciju (JWT). Samo reci šta želiš sledeće.

