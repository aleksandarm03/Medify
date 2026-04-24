# Medify Backend - Prezentacione Beleške (15-20 min)

## 1. Cilj prezentacije
- Prikazati kako backend podrzava kompletan medicinski tok: autentikacija -> zakazivanje -> karton -> recept.
- Objasniti bezbednost i kontrolu pristupa (role + ownership).
- Pokazati da je arhitektura odrziva za dalji razvoj.

## 2. Agenda
1. Arhitektura backenda
2. Auth i autorizacija
3. Glavni API tokovi
4. Validacije i error handling
5. Admin deo i operativa
6. Ogranicenja + sledeci koraci
7. Q&A

## 3. Arhitektura (2-3 min)

### 3.1 Ulazna tacka
- Server i mount ruta: [backend/index.js](../backend/index.js)
- Konfiguracija (port, DB, secret): [backend/config.js](../backend/config.js)

### 3.2 Slojevi
- `routes/`: HTTP ulaz, validacija, auth check, mapiranje odgovora
- `services/`: poslovna logika
- `models/`: Mongo/Mongoose entiteti
- `middleware/`: JWT i role provere

### 3.3 Klasicni request flow
`Client -> Route -> Middleware(Auth/Role) -> Service -> Model -> Response`

## 4. Auth i autorizacija (3 min)

### 4.1 Login i token
- Passport Local + JWT strategija: [backend/routes/config.js](../backend/routes/config.js)
- Auth rute: [backend/routes/auth.js](../backend/routes/auth.js)

### 4.2 Role model
- `admin`, `doctor`, `patient`
- Doktor zahteva odobrenje pre punog pristupa.

### 4.3 Ownership pravila
- Pacijent vidi samo svoje podatke.
- Doktor radi samo nad svojim slucajevima.
- Admin ima globalni pregled.

### 4.4 Middleware
- JWT validacija i role check: [backend/middleware/auth.js](../backend/middleware/auth.js)

## 5. Glavni API tokovi (7-8 min)

### 5.1 Appointment flow
- Ruta: [backend/routes/appointment.js](../backend/routes/appointment.js)
- Kreiranje termina (doktor/pacijent scenariji)
- Provere pre upisa:
  - datum nije u proslosti
  - validan razlog
  - slot je stvarno dostupan
- Statusi: `scheduled`, `completed`, `canceled`

### 5.2 Medical record flow
- Ruta: [backend/routes/medicalRecord.js](../backend/routes/medicalRecord.js)
- Kreira doktor za pacijenta
- Sadrzaj: dijagnoza, simptomi, notes, terapija, preporuke, vitalni znaci, lab rezultati
- Access control: pacijent (svoj), doktor (svoje), admin (sve)

### 5.3 Prescription flow
- Ruta: [backend/routes/prescription.js](../backend/routes/prescription.js)
- Kreira doktor, lista lekova sa obaveznim poljima
- Statusi: `active`, `completed`, `cancelled`
- Pregled aktivnih terapija po pacijentu

### 5.4 Doctor availability
- Ruta: [backend/routes/doctor.js](../backend/routes/doctor.js)
- Rucno i automatsko generisanje dostupnosti
- Servis za slot logiku: [backend/services/doctorAvailabilityService.js](../backend/services/doctorAvailabilityService.js)

## 6. Validacije i error handling (2 min)
- Validacija obaveznih polja i enum vrednosti
- Datumske i vremenske validacije
- Poslovne validacije (npr. zabrana termina u proslosti)
- Dosledan format greske: `message`

## 7. Admin i operativa (2 min)
- Admin rute: [backend/routes/admin.js](../backend/routes/admin.js)
- Dashboard metrike
- Approval tok korisnika
- Aktivacija/deaktivacija naloga
- Audit log pregled

### Demo podaci
- Seed skripta: [backend/scripts/seed.js](../backend/scripts/seed.js)
- Koristi se za brz setup test i demo scenarija

## 8. Ogranicenja i unapredjenja (1-2 min)
- Centralizovati validacije jos vise
- Prosiriti integracione testove za kriticne tokove
- Pojacati observability (strukturisani logovi, metrike)
- Dodatni security hardening po okruzenjima

## 9. Brzi endpoint pregled (za podsetnik)
- Auth: `/auth/register`, `/auth/login`, `/auth/validate-token`
- Profile: `/profile`
- Appointments: `/appointments`, `/appointments/:id`, `/appointments/:id/status`
- Medical records: `/medical-records`, `/medical-records/:id`, `/medical-records/:id/lab-results`
- Prescriptions: `/prescriptions`, `/prescriptions/:id`, `/prescriptions/:id/status`
- Doctors: `/doctors/search`, `/doctors/:id/availability`, `/doctors/:id/available-slots`
- Admin: `/api/admin/dashboard`, `/api/admin/approve-user/:userId`, `/api/admin/reject-user/:userId`

## 10. Q&A (najcesca pitanja)

### P1: Zasto JWT?
- Stateless API, jednostavno za SPA klijenta, lako kombinovanje sa role proverama.

### P2: Kako sprecavate neovlascen pristup kartonima?
- Ownership + role check na zasticenim rutama pre servisne logike.

### P3: Kako izbegavate duple rezervacije termina?
- Slot validacija pre upisa termina kroz logiku dostupnosti doktora.

### P4: Najveci tehnicki rizik?
- Rast kompleksnosti poslovnih pravila; mitigacija kroz testove i centralizovane validacije.

### P5: Sledeci korak za skaliranje?
- Optimizacija upita/indeksa, bolji monitoring, jacanje test automation.

## 11. Checklist pre prezentacije
- Proci agendu jednom bez citanja
- Potvrditi 2-3 kljucna endpoint primera po modulu
- Pripremiti jedan konkretan end-to-end scenario (od login-a do recepta)
- Imati spreman odgovor na 5 Q&A pitanja
