# Medify - Sistem za upravljanje ordinacijom

Medify je **studentski projekat iz predmeta Web programiranje 2** — RESTful API backend za upravljanje ordinacijom. Projekt je struktuisan da podrži više uloga (admin, doctor, nurse, patient) i sadrži funkcionalnosti za upravljanje korisnicima, zakazivanje termina, medicinske kartone, recepte i dostupnost doktora.

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

- Opis: Kreira novi termin (samo doktori)
- Autentifikacija: JWT token
- Autorizacija: `doctor`
- Telo: `patientId`, `appointmentDate`, `reason`
- Odgovor: HTTP 201 sa kreiranim terminom

**GET /appointments/doctor**

- Opis: Dohvata termine doktora
- Autentifikacija: JWT token
- Autorizacija: `doctor`
- Query params: `status` (opciono)
- Odgovor: HTTP 200 sa listom termina

**GET /appointments/patient**

- Opis: Dohvata termine pacijenta
- Autentifikacija: JWT token
- Autorizacija: `patient`
- Query params: `status` (opciono)
- Odgovor: HTTP 200 sa listom termina

**GET /appointments/:id**

- Opis: Dohvata određeni termin
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa terminom

**PUT /appointments/:id/status**

- Opis: Ažurira status termina (scheduled, completed, canceled)
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa ažuriranim terminom

**PUT /appointments/:id**

- Opis: Ažurira termin (samo doktor ili admin)
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa ažuriranim terminom

**DELETE /appointments/:id**

- Opis: Briše termin (samo doktor ili admin)
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa porukom o uspehu

### Medicinski kartoni (rute su pod `/medical-records`)

**POST /medical-records**

- Opis: Kreira medicinski karton (doktor ili sestra)
- Autentifikacija: JWT token
- Autorizacija: `doctor`, `nurse`
- Telo: `patientId`, `diagnosis`, `symptoms`, `examinationNotes`, `treatment`, `vitalSigns`, `labResults`
- Odgovor: HTTP 201 sa kreiranim kartonom

**GET /medical-records/patient/:patientId**

- Opis: Dohvata sve kartone pacijenta
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa listom kartona

**GET /medical-records/:id**

- Opis: Dohvata određeni karton
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa kartonom

**PUT /medical-records/:id**

- Opis: Ažurira karton (doktor, sestra ili admin)
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa ažuriranim kartonom

**POST /medical-records/:id/lab-results**

- Opis: Dodaje laboratorijski rezultat u karton
- Autentifikacija: JWT token
- Autorizacija: `doctor`, `nurse`, `admin`
- Odgovor: HTTP 200 sa ažuriranim kartonom

### Recepti (rute su pod `/prescriptions`)

**POST /prescriptions**

- Opis: Kreira recept (samo doktori)
- Autentifikacija: JWT token
- Autorizacija: `doctor`
- Telo: `patientId`, `medications` (niz), `validUntil`, `notes`
- Odgovor: HTTP 201 sa kreiranim receptom

**GET /prescriptions/patient/:patientId**

- Opis: Dohvata recepte pacijenta
- Autentifikacija: JWT token
- Query params: `status` (opciono)
- Odgovor: HTTP 200 sa listom recepata

**GET /prescriptions/patient/:patientId/active**

- Opis: Dohvata aktivne recepte pacijenta
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa listom aktivnih recepata

**GET /prescriptions/:id**

- Opis: Dohvata određeni recept
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa receptom

**PUT /prescriptions/:id/status**

- Opis: Ažurira status recepta (active, completed, cancelled)
- Autentifikacija: JWT token
- Autorizacija: `doctor`, `admin`
- Odgovor: HTTP 200 sa ažuriranim receptom

### Doktori (rute su pod `/doctors`)

**GET /doctors**

- Opis: Dohvata sve doktore
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa listom doktora

**GET /doctors/search**

- Opis: Pretražuje doktore po specijalizaciji ili imenu
- Autentifikacija: JWT token
- Query params: `specialization`, `name`
- Odgovor: HTTP 200 sa listom doktora

**GET /doctors/:id**

- Opis: Dohvata određenog doktora
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa doktorom

**POST /doctors/:id/availability**

- Opis: Postavlja dostupnost doktora
- Autentifikacija: JWT token
- Autorizacija: `doctor`, `admin`
- Telo: `dayOfWeek` (0-6), `startTime`, `endTime`, `breakStart`, `breakEnd`, `appointmentDuration`
- Odgovor: HTTP 201 sa dostupnošću

**GET /doctors/:id/availability**

- Opis: Dohvata dostupnost doktora
- Autentifikacija: JWT token
- Odgovor: HTTP 200 sa listom dostupnosti

**GET /doctors/:id/available-slots**

- Opis: Dohvata dostupne termine za određeni datum
- Autentifikacija: JWT token
- Query params: `date` (YYYY-MM-DD)
- Odgovor: HTTP 200 sa listom dostupnih termina

**PUT /doctors/availability/:availabilityId**

- Opis: Ažurira dostupnost doktora
- Autentifikacija: JWT token
- Autorizacija: `doctor`, `admin`
- Odgovor: HTTP 200 sa ažuriranom dostupnošću

**DELETE /doctors/availability/:availabilityId**

- Opis: Briše dostupnost doktora
- Autentifikacija: JWT token
- Autorizacija: `doctor`, `admin`
- Odgovor: HTTP 200 sa porukom o uspehu

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

### MedicalRecord Model (`models/medicalRecord.js`)

Model medicinskog kartona sa informacijama o pregledu.

**Polja:**
- `patient`, `doctor` (ObjectId reference to User, required)
- `appointment` (ObjectId reference to Appointment, optional)
- `visitDate` (Date, required)
- `diagnosis` (String, required)
- `symptoms` (Array of String)
- `examinationNotes`, `treatment`, `recommendations` (String)
- `vitalSigns` (Object: bloodPressure, heartRate, temperature, weight, height)
- `labResults` (Array of Object: testName, result, normalRange, date)
- `followUpDate` (Date)
- `createdAt`, `updatedAt` (Date)

### Prescription Model (`models/prescription.js`)

Model recepta sa propisanim lekovima.

**Polja:**
- `patient`, `doctor` (ObjectId reference to User, required)
- `medicalRecord`, `appointment` (ObjectId reference, optional)
- `medications` (Array of Object: name, dosage, frequency, duration, instructions)
- `issueDate` (Date, required)
- `validUntil` (Date)
- `status` (Enum: "active", "completed", "cancelled", default: "active")
- `notes` (String)
- `createdAt`, `updatedAt` (Date)

### DoctorAvailability Model (`models/doctorAvailability.js`)

Model dostupnosti doktora po danima u nedelji.

**Polja:**
- `doctor` (ObjectId reference to User, required)
- `dayOfWeek` (Number, 0-6, required)
- `startTime`, `endTime` (String, format "HH:MM", required)
- `isAvailable` (Boolean, default: true)
- `breakStart`, `breakEnd` (String, format "HH:MM")
- `appointmentDuration` (Number, u minutima, default: 30)
- `createdAt`, `updatedAt` (Date)

---

## Struktura projekta

```
Medify/
├── config.js                      # Konfiguracija (PORT, MongoDB connection, JWT secret)
├── index.js                       # Entry point aplikacije
├── package.json                   # npm zavisnosti
├── README.md                      # Dokumentacija
├── models/
│   ├── user.js                   # User model sa metodama za autentifikaciju
│   ├── appointment.js            # Appointment model
│   ├── medicalRecord.js          # MedicalRecord model
│   ├── prescription.js           # Prescription model
│   └── doctorAvailability.js     # DoctorAvailability model
├── routes/
│   ├── auth.js                   # Rute za autentifikaciju i korisnike
│   ├── appointment.js            # Rute za termine
│   ├── medicalRecord.js         # Rute za medicinske kartone
│   ├── prescription.js          # Rute za recepte
│   ├── doctor.js                # Rute za doktore i dostupnost
│   └── config.js                # Passport.js konfiguracija (Local i JWT strategije)
└── services/
    ├── userService.js           # Business logika za korisnike
    ├── appointmentService.js    # Business logika za termine
    ├── medicalRecordService.js  # Business logika za medicinske kartone
    ├── prescriptionService.js   # Business logika za recepte
    └── doctorAvailabilityService.js # Business logika za dostupnost doktora
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

### Kreiranje medicinskog kartona

```bash
curl -X POST http://localhost:3232/medical-records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "507f1f77bcf86cd799439011",
    "diagnosis": "Hipertenzija",
    "symptoms": ["Glavobolja", "Vrtoglavica"],
    "treatment": "Lekovi za snižavanje pritiska",
    "vitalSigns": {
      "bloodPressure": "140/90",
      "heartRate": 75,
      "temperature": 36.5
    }
  }'
```

### Kreiranje recepta

```bash
curl -X POST http://localhost:3232/prescriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "507f1f77bcf86cd799439011",
    "medications": [
      {
        "name": "Aspirin",
        "dosage": "100mg",
        "frequency": "1x dnevno",
        "duration": "30 dana",
        "instructions": "Uz obrok"
      }
    ]
  }'
```

### Pretraga doktora

```bash
curl -X GET "http://localhost:3232/doctors/search?specialization=kardiolog" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Dohvatanje dostupnih termina

```bash
curl -X GET "http://localhost:3232/doctors/507f1f77bcf86cd799439011/available-slots?date=2024-12-25" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Napomene

- Node.js ugrađeni `crypto` modul se koristi za hash-ovanje lozinki (ne koristi se npm paket `crypto`)
- JWT tokeni se prosleđuju u `Authorization` header-u sa prefiksom `Bearer`
- Sve greške vraćaju JSON odgovor sa `message` poljem
- Password hash i salt se nikada ne vraćaju u API odgovorima

