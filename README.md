# Medify - Sistem za upravljanje ordinacijom

Medify je **studentski projekat iz predmeta Web programiranje 2** — RESTful API backend za upravljanje ordinacijom. Projekt je struktuisan da podrži više uloga (admin, doctor, nurse, patient) i sadrži funkcionalnosti za upravljanje korisnicima i zakazivanje termina.

---

## Tehnologije

- **Backend**: Node.js (v18+), Express 5
- **Baza podataka**: MongoDB, Mongoose
- **Autentifikacija**: JWT (JSON Web Tokens), Passport.js
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

Server će biti dostupan na `http://localhost:<PORT>` (podrazumevano port 3232).

---

## API Dokumentacija

### Testni endpoint

**GET /test**

- Opis: Testira da li je API funkcionalan
- Autentifikacija: Nije potrebna
- Odgovor: HTTP 200, telo: `"Test API!"`

### Autentifikacija i korisnici (rute su pod `/auth`)

**POST /auth/register**

- Opis: Registruje novog korisnika
- Autentifikacija: Nije potrebna
- Telo (JSON):
  ```json
  {
    "JMBG": "1234567890123",
    "firstName": "Marko",
    "lastName": "Marković",
    "password": "lozinka123",
    "homeAddress": "Ulica 123",
    "phoneNumber": "0612345678",
    "gender": "male",
    "role": "patient"
  }
  ```
- Validacija:
  - Sva polja su obavezna
  - `role` mora biti: `admin`, `doctor`, `nurse`, ili `patient`
  - `gender` mora biti: `male` ili `female`
  - `password` mora imati najmanje 6 karaktera
  - `JMBG` mora biti jedinstven
- Odgovor: HTTP 201 sa kreiranim korisnikom (bez password hash-a) ili HTTP 400/500 sa porukom greške

**POST /auth/login**

- Opis: Prijavljuje korisnika i vraća JWT token
- Autentifikacija: Nije potrebna (koristi Passport Local Strategy)
- Telo (JSON):
  ```json
  {
    "JMBG": "1234567890123",
    "password": "lozinka123"
  }
  ```
- Odgovor: HTTP 200 sa JWT tokenom:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
  ili HTTP 401 za nevažeće kredencijale

**GET /auth/users**

- Opis: Dohvata sve korisnike iz baze
- Autentifikacija: JWT token (Bearer token u Authorization header-u)
- Autorizacija: Samo `admin` uloga
- Odgovor: HTTP 200 sa listom korisnika (bez password hash-a) ili HTTP 403/500 sa porukom greške

### Termini (rute su pod `/appointments`)

**POST /appointments**

- Opis: Kreira novi termin (samo doktori mogu kreirati termine)
- Autentifikacija: JWT token (Bearer token u Authorization header-u)
- Autorizacija: Samo `doctor` uloga
- Telo (JSON):
  ```json
  {
    "patientId": "507f1f77bcf86cd799439011",
    "appointmentDate": "2024-12-25T10:00:00Z",
    "reason": "Pregled"
  }
  ```
- Validacija:
  - Sva polja su obavezna
  - `appointmentDate` mora biti validan datum u budućnosti
  - `reason` mora imati najmanje 3 karaktera
  - `patientId` mora odgovarati korisniku sa ulogom `patient`
- Odgovor: HTTP 201 sa kreiranim terminom ili HTTP 400/404/500 sa porukom greške

---

## Modeli

### User Model (`models/user.js`)

Model korisnika sa podrškom za hash-ovanje lozinke putem Node-ovog ugrađenog `crypto` modula (PBKDF2). 

**Zajednička polja:**
- `JMBG` (String, required, unique)
- `firstName`, `lastName` (String, required)
- `passwordHash`, `passwordSalt` (String, required)
- `homeAddress`, `phoneNumber` (String, required)
- `gender` (Enum: "male", "female", required)
- `dateOfBirth` (Date, optional)
- `role` (Enum: "admin", "doctor", "nurse", "patient", required)
- `appointments` (Array of ObjectId references to Appointment)

**Polja specifična za doktore:**
- `specialization`, `licenseNumber`, `officeNumber` (String)
- `yearsOfExperience` (Number)
- `shift` (Enum: "morning", "evening", "night")

**Polja specifična za pacijente:**
- `bloodType` (Enum: "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-")
- `allergies` (Array of String)
- `insuranceNumber`, `insuranceCompany` (String)

**Metode:**
- `savePassword(password)` - Hash-uje i čuva lozinku
- `validatePassword(password)` - Validira lozinku
- `generateJwt()` - Generiše JWT token (važi 7 dana)

### Appointment Model (`models/appointment.js`)

Model termina sa referencama na doktora i pacijenta.

**Polja:**
- `doctor` (ObjectId reference to User, required)
- `patient` (ObjectId reference to User, required)
- `appointmentDate` (Date, required)
- `reason` (String, required)
- `status` (Enum: "scheduled", "completed", "canceled", default: "scheduled")
- `createdAt`, `updatedAt` (Date)

---

## Struktura projekta

```
Medify/
├── config.js                 # Konfiguracija (PORT, MongoDB connection, JWT secret)
├── index.js                  # Entry point aplikacije
├── package.json              # npm zavisnosti
├── README.md                 # Dokumentacija
├── models/
│   ├── user.js              # User model sa metodama za autentifikaciju
│   └── appointment.js       # Appointment model
├── routes/
│   ├── auth.js              # Rute za autentifikaciju i korisnike
│   ├── appointment.js       # Rute za termine
│   └── config.js            # Passport.js konfiguracija (Local i JWT strategije)
└── services/
    ├── userService.js       # Business logika za korisnike
    └── appointmentService.js # Business logika za termine
```

---

## Sigurnost

- **Hash lozinki**: Koristi se PBKDF2 algoritam sa salt-om
- **JWT autentifikacija**: Tokeni važe 7 dana
- **Role-based autorizacija**: Middleware za kontrolu pristupa na osnovu uloge
- **Validacija ulaza**: Validacija svih obaveznih polja i formata podataka
- **Error handling**: Try-catch blokovi u svim rutama sa odgovarajućim HTTP status kodovima

---

## Primeri korišćenja

### Registracija korisnika

```bash
curl -X POST http://localhost:3232/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "JMBG": "1234567890123",
    "firstName": "Marko",
    "lastName": "Marković",
    "password": "lozinka123",
    "homeAddress": "Ulica 123",
    "phoneNumber": "0612345678",
    "gender": "male",
    "role": "patient"
  }'
```

### Prijavljivanje

```bash
curl -X POST http://localhost:3232/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "JMBG": "1234567890123",
    "password": "lozinka123"
  }'
```

### Kreiranje termina (za doktore)

```bash
curl -X POST http://localhost:3232/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "507f1f77bcf86cd799439011",
    "appointmentDate": "2024-12-25T10:00:00Z",
    "reason": "Redovni pregled"
  }'
```

---

## Napomene

- Node.js ugrađeni `crypto` modul se koristi za hash-ovanje lozinki (ne koristi se npm paket `crypto`)
- JWT tokeni se prosleđuju u `Authorization` header-u sa prefiksom `Bearer`
- Sve greške vraćaju JSON odgovor sa `message` poljem
- Password hash i salt se nikada ne vraćaju u API odgovorima

