# Medify Backend

REST API backend za Medify sistem (Node.js + Express 5 + MongoDB).

## Tehnologije

- Node.js 18+
- Express 5
- MongoDB + Mongoose
- Passport (Local + JWT)
- jsonwebtoken
- CORS

## Preduslovi

- Node.js 18+
- npm
- MongoDB instanca (lokalna ili cloud)

## Instalacija i pokretanje

Iz foldera backend/:

```bash
npm install
npm start
```

Podrazumevani URL: http://localhost:3232

## Seed podaci

Iz foldera backend/:

```bash
npm run seed
npm run seed:reset
```

- seed: ubacuje demo podatke
- seed:reset: briše postojeće kolekcije i ponovo puni bazu

## Skripte

Definisano u package.json:

- npm start -> node index.js
- npm run seed -> node scripts/seed.js
- npm run seed:reset -> node scripts/seed.js --reset

## Konfiguracija

Fajl: config.js

- PORT (default 3232)
- MongoConnection (default mongodb://localhost:27017/Medify)
- secret (JWT secret)

Napomena: trenutno su vrednosti hardkodovane i za produkciju ih treba prebaciti u environment promenljive.

## CORS

Backend dozvoljava origin:

- http://localhost:4200

## Autentifikacija i uloge

- Autentifikacija: JWT Bearer token
- Uloge: admin, doctor, patient
- Zaštita ruta je implementirana kroz Passport middleware i role proveru

## Glavne rute

### Root

- GET / -> tekstualni opis API-ja
- GET /test -> "Test API!"

### Auth (/auth)

- POST /auth/register
- POST /auth/login
- GET /auth/validate-token
- GET /auth/users (admin)
- GET /auth/users/:id (admin)
- PUT /auth/users/:id (admin)
- DELETE /auth/users/:id (admin)

Važno:

- register vraća token i user objekat
- login vraća token

### Profile (/profile)

- GET /profile
- PUT /profile

PUT /profile ne dozvoljava izmenu: _id, passwordHash, passwordSalt, password, role, JMBG.

### Appointments (/appointments)

- POST /appointments (doctor ili patient)
- GET /appointments/all (admin)
- GET /appointments/doctor (doctor)
- GET /appointments/patient (patient)
- GET /appointments/:id
- PUT /appointments/:id/status
- PUT /appointments/:id
- DELETE /appointments/:id

Detalj za POST /appointments:

- doctor šalje patientJMBG (ili fallback patientId)
- patient šalje doctorId
- traženi termin mora da postoji u dostupnim slotovima doktora

### Medical records (/medical-records)

- GET /medical-records/all (admin)
- POST /medical-records (doctor)
- GET /medical-records/patient/:patientId
- GET /medical-records/doctor/:doctorId
- GET /medical-records/:id
- PUT /medical-records/:id (doctor/admin)
- POST /medical-records/:id/lab-results (doctor/admin)
- DELETE /medical-records/:id (doctor/admin)

### Prescriptions (/prescriptions)

- GET /prescriptions/all (admin)
- POST /prescriptions (doctor)
- GET /prescriptions/patient/:patientId/active
- GET /prescriptions/patient/:patientId
- GET /prescriptions/:id
- PUT /prescriptions/:id/status
- DELETE /prescriptions/:id

### Doctors (/doctors)

- POST /doctors/:id/availability (doctor/admin)
- POST /doctors/:id/availability/generate-default (doctor/admin)
- GET /doctors/:id/available-slots
- GET /doctors/:id/availability
- PUT /doctors/availability/:availabilityId (doctor/admin)
- DELETE /doctors/availability/:availabilityId (doctor/admin)
- GET /doctors/search
- GET /doctors
- GET /doctors/:id

### Admin (/api/admin)

- GET /api/admin/dashboard
- POST /api/admin/approve-user/:userId
- POST /api/admin/reject-user/:userId
- POST /api/admin/toggle-user/:userId
- GET /api/admin/audit-log

Sve admin rute zahtevaju admin ulogu.

## Struktura foldera

```text
backend/
  config.js
  index.js
  package.json
  middleware/
    auth.js
  models/
    appointment.js
    doctorAvailability.js
    medicalRecord.js
    prescription.js
    user.js
  routes/
    admin.js
    appointment.js
    auth.js
    config.js
    doctor.js
    medicalRecord.js
    prescription.js
    profile.js
  scripts/
    seed.js
  services/
    appointmentService.js
    doctorAvailabilityService.js
    medicalRecordService.js
    prescriptionService.js
    userService.js
```

## Brzi health check

```bash
curl http://localhost:3232/test
```

Ako backend radi ispravno, odgovor je: Test API!
