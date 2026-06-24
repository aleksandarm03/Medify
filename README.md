# Medify

Medify je full-stack informacioni sistem za upravljanje radom ordinacije. Sistem povezuje administratore, doktore i pacijente kroz jedinstven tok rada: registraciju i odobravanje korisnika, pretragu doktora, zakazivanje termina, vođenje medicinskih kartona, izdavanje recepata, upravljanje dostupnošću doktora i operativni admin nadzor.

Repozitorijum je organizovan kao monorepo i sadrži:

- Angular frontend aplikaciju
- Node.js/Express REST API backend
- MongoDB bazu podataka preko Mongoose modela
- Socket.io real-time sloj za obaveštenja
- Selenium + TestNG Page Object Model UI regresioni suite

## Sadržaj

- [Funkcionalni pregled](#funkcionalni-pregled)
- [Arhitektura](#arhitektura)
- [Tehnološki stack](#tehnološki-stack)
- [Struktura repozitorijuma](#struktura-repozitorijuma)
- [Uloge i autorizacija](#uloge-i-autorizacija)
- [Lokalno pokretanje](#lokalno-pokretanje)
- [Konfiguracija](#konfiguracija)
- [Seed podaci i kredencijali](#seed-podaci-i-kredencijali)
- [API pregled](#api-pregled)
- [Model podataka](#model-podataka)
- [Frontend rute](#frontend-rute)
- [Real-time obaveštenja](#real-time-obaveštenja)
- [Testiranje](#testiranje)
- [Važne regresije](#važne-regresije)
- [Troubleshooting](#troubleshooting)

## Funkcionalni pregled

Medify pokriva glavne procese jedne ordinacije:

- Upravljanje korisnicima: registracija, prijava, uloge, admin CRUD, odobravanje i odbijanje naloga.
- Upravljanje doktorima: pretraga, detalji doktora, dostupni slotovi i nedeljna dostupnost.
- Termini: zakazivanje od strane pacijenta ili doktora, statusi termina, filtriranje i otkazivanje.
- Medicinski kartoni: kreiranje kartona, vitalni znaci, simptomi, dijagnoza, tretman, preporuke i laboratorijski rezultati.
- Recepti: kreiranje recepata, lekovi, doziranje, trajanje terapije, statusi i aktivni recepti pacijenta.
- Admin modul: dashboard, korisnici, svi termini, svi kartoni, svi recepti i statistika termina.
- Obaveštenja: globalna real-time obaveštenja preko Socket.io i lokalni notification centar.

## Arhitektura

![Medify Architecture](docs/architecture/medify-architecture.svg)

Frontend komunicira sa backend REST API slojem preko Angular servisa. Backend sprovodi poslovna pravila, autentifikaciju, autorizaciju i pristup MongoDB bazi. Socket.io sloj omogućava obaveštenja bez osvežavanja stranice. Selenium POM suite testira sistem kroz realan browser i realne korisničke tokove.

## Tehnološki stack

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- Passport Local
- Passport JWT
- jsonwebtoken
- Socket.io
- CORS

### Frontend

- Angular 21
- TypeScript
- Standalone komponente
- Angular Router
- Route guards
- RxJS
- Socket.io client
- Angular Forms

### Test automation

- Java 21
- Maven
- Selenium WebDriver
- TestNG
- WebDriverManager
- Chrome browser

## Struktura repozitorijuma

```text
Medify/
  README.md
  docs/
    architecture/
      medify-architecture.svg
  backend/
    config.js
    index.js
    middleware/
    models/
    routes/
    scripts/
    services/
    socket/
    utils/
  frontend/
    angular.json
    package.json
    src/
      app/
        components/
        guards/
        interceptors/
        models/
        services/
      environments/
  page-object-model/
    pom.xml
    testng.xml
    src/
      main/java/pmf/imi/moodle/
      test/java/pmf/imi/moodle/
```

## Uloge i autorizacija

Sistem koristi tri uloge:

- `admin`
- `doctor`
- `patient`

Pravila pristupa:

- `admin` upravlja korisnicima, odobrenjima, pregledima svih termina, kartona, recepata i statistikom.
- `doctor` upravlja svojim terminima, dostupnošću, medicinskim kartonima i receptima.
- `patient` pregleda doktore, zakazuje termine, vidi svoje kartone, recepte i obaveštenja.

Doktori prolaze kroz approval tok. Novi doctor nalog inicijalno dobija `approvalStatus: pending` i `isApproved: false`. Admin mora da odobri doktora pre nego što nalog postane funkcionalno dostupan.

JWT payload sadrži osnovne podatke:

- `_id`
- `firstName`
- `lastName`
- `role`
- `exp`

Frontend čuva autentifikacione podatke u localStorage:

- `medify_token`
- `medify_user`
- `medify_notifications_<userId>`

## Lokalno pokretanje

### Preduslovi

- Node.js 18+
- npm
- MongoDB lokalno ili dostupna MongoDB instanca
- Java 21
- Maven 3.9+
- Google Chrome

### 1. Backend

```bash
cd backend
npm install
npm start
```

Backend se pokreće na:

```text
http://localhost:3232
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend se pokreće na:

```text
http://localhost:4200
```

### 3. Seed podaci

Seed bez brisanja postojeće baze:

```bash
cd backend
npm run seed
```

Reset baze i ponovno generisanje podataka:

```bash
cd backend
npm run seed:reset
```

`seed:reset` briše postojeće kolekcije i generiše demo korisnike, dostupnosti doktora, istorijske i buduće termine, medicinske kartone i recepte.

### 4. Selenium POM suite

Pre pokretanja UI testova backend i frontend moraju biti aktivni.

```bash
cd page-object-model
mvn test -Dsurefire.suiteXmlFiles=testng.xml
```

## Konfiguracija

### Backend

Fajl:

```text
backend/config.js
```

Podrazumevane vrednosti:

- `PORT`: `3232`
- `MongoConnection`: `mongodb://localhost:27017/Medify`
- `secret`: razvojni JWT secret

Napomena: `secret` je hardkodovan za razvojno okruženje. Za produkciju ga treba prebaciti u environment promenljivu.

### Frontend

Fajl:

```text
frontend/src/environments/environment.ts
```

Podrazumevana vrednost:

- `apiUrl`: `http://localhost:3232`

### CORS

Backend trenutno dozvoljava frontend origin:

```text
http://localhost:4200
```

## Seed podaci i kredencijali

Seed skripta kreira realističan skup korisnika i kliničkih podataka.

Test kredencijali:

- admin: `1001001001001` / `Admin123!`
- doctor: `3003003003003` / `Doctor123!`
- doctor: `4004004004004` / `Doctor123!`
- patient: `5005005005005` / `Patient123!`
- patient: `6006006006006` / `Patient123!`

Seed takođe generiše:

- default dostupnosti za doktore
- istorijske termine
- buduće termine
- otkazane, završene i zakazane termine
- medicinske kartone
- recepte

## API pregled

### Root

- `GET /`

### Auth i korisnici

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/validate-token`
- `GET /auth/users` `(admin)`
- `GET /auth/users/:id` `(admin)`
- `PUT /auth/users/:id` `(admin)`
- `DELETE /auth/users/:id` `(admin)`

### Profile

- `GET /profile`
- `PUT /profile`

### Appointments

- `POST /appointments`
- `GET /appointments/all` `(admin)`
- `GET /appointments/doctor` `(doctor)`
- `GET /appointments/patient` `(patient)`
- `GET /appointments/:id`
- `PUT /appointments/:id/status`
- `PUT /appointments/:id`
- `DELETE /appointments/:id`

### Medical records

- `GET /medical-records/all` `(admin)`
- `POST /medical-records` `(doctor)`
- `GET /medical-records/patient/:patientId`
- `GET /medical-records/doctor/:doctorId`
- `GET /medical-records/:id`
- `PUT /medical-records/:id` `(doctor/admin)`
- `POST /medical-records/:id/lab-results` `(doctor/admin)`
- `DELETE /medical-records/:id` `(doctor/admin)`

### Prescriptions

- `GET /prescriptions/all` `(admin)`
- `POST /prescriptions` `(doctor)`
- `GET /prescriptions/patient/:patientId/active`
- `GET /prescriptions/patient/:patientId`
- `GET /prescriptions/:id`
- `POST /prescriptions/:id/medications`
- `PUT /prescriptions/:id/medications/:medicationId/cancel`
- `PUT /prescriptions/:id/status`
- `DELETE /prescriptions/:id`

### Doctors i availability

- `GET /doctors`
- `GET /doctors/search`
- `GET /doctors/:id`
- `GET /doctors/:id/available-slots`
- `GET /doctors/:id/availability`
- `POST /doctors/:id/availability` `(doctor/admin)`
- `POST /doctors/:id/availability/generate-default` `(doctor/admin)`
- `PUT /doctors/availability/:availabilityId` `(doctor/admin)`
- `DELETE /doctors/availability/:availabilityId` `(doctor/admin)`

### Admin

- `GET /api/admin/dashboard`
- `POST /api/admin/approve-user/:userId`
- `POST /api/admin/reject-user/:userId`
- `POST /api/admin/toggle-user/:userId`
- `GET /api/admin/audit-log`

## Model podataka

### User

Ključna polja:

- `JMBG`
- `firstName`
- `lastName`
- `passwordHash`
- `passwordSalt`
- `homeAddress`
- `phoneNumber`
- `gender`
- `role`
- `isApproved`
- `approvalStatus`
- `isActive`
- `specialization`
- `licenseNumber`
- `yearsOfExperience`
- `officeNumber`
- `shift`
- `bloodType`
- `allergies`
- `insuranceNumber`
- `insuranceCompany`

### Appointment

Ključna polja:

- `doctor`
- `patient`
- `appointmentDate`
- `reason`
- `status`: `scheduled`, `completed`, `canceled`
- `canceledByRole`
- `canceledByUser`
- `cancellationReason`

### MedicalRecord

Ključna polja:

- `patient`
- `doctor`
- `appointment`
- `visitDate`
- `diagnosis`
- `symptoms`
- `examinationNotes`
- `treatment`
- `recommendations`
- `vitalSigns`
- `labResults`
- `followUpDate`

### Prescription

Ključna polja:

- `patient`
- `doctor`
- `medicalRecord`
- `appointment`
- `medications`
- `issueDate`
- `validUntil`
- `status`: `active`, `completed`, `cancelled`
- `notes`

### DoctorAvailability

Ključna polja:

- `doctor`
- `dayOfWeek`
- `startTime`
- `endTime`
- `breakStart`
- `breakEnd`
- `appointmentDuration`
- `isAvailable`

## Frontend rute

### Javne rute

- `/login`
- `/register`

### Zaštićene rute

- `/dashboard`
- `/appointments`
- `/medical-records`
- `/prescriptions`
- `/doctors`
- `/doctors/:id`
- `/profile`
- `/notifications`

### Role-restricted rute

- doctor: `/availability`
- admin: `/users`
- admin: `/admin/dashboard`
- admin: `/admin/appointments`
- admin: `/admin/medical-records`
- admin: `/admin/prescriptions`
- admin: `/admin/statistics`

## Real-time obaveštenja

Medify koristi Socket.io za real-time obaveštenja.

Osnovni tok:

- korisnik se prijavljuje i dobija JWT
- frontend uspostavlja Socket.io konekciju koristeći isti token
- backend emituje događaje relevantnim korisnicima
- frontend notification store čuva obaveštenja po korisniku
- layout prikazuje globalni toast
- `/notifications` prikazuje listu obaveštenja

Pokriveni real-time tokovi:

- novi termin obaveštava doktora
- promena statusa termina obaveštava doktora i pacijenta
- kreiranje, izmena i laboratorijski rezultat medicinskog kartona obaveštavaju samo pripadajućeg pacijenta
- kreiranje recepta, dodavanje leka, otkazivanje leka i promena statusa recepta obaveštavaju pacijenta
- ciljane poruke pacijenta i video-call događaji se prikazuju kao notification toastovi
- odobravanje i odbijanje korisnika šalju live obaveštenja pogođenom korisniku i ostalim online adminima
- role-based i broadcast događaji se filtriraju na frontendu po ulozi primaoca

Važna bezbednosna napomena: obaveštenja za medicinske kartone se ne emituju broadcast-om. Backend ih šalje ciljano pacijentu, a frontend dodatno proverava `patientId` pre nego što prikaže toast ili upiše obaveštenje u lokalni store.

Relevantne implementacije:

- `backend/socket/*`
- `backend/routes/appointment.js`
- `backend/routes/medicalRecord.js`
- `backend/routes/prescription.js`
- `backend/routes/admin.js`
- `frontend/src/app/services/socket.service.ts`
- `frontend/src/app/services/notification-store.service.ts`
- `frontend/src/app/components/layout/*`
- `frontend/src/app/components/notifications/*`

## Testiranje

Medify ima dva nivoa testiranja:

- backend unit/regression testovi za poslovna pravila
- Selenium Page Object Model UI regresioni suite

### Backend testovi

Primer backend testa:

```bash
cd backend
node --test tests/doctorEligibility.test.js
```

Pokretanje svih backend testova:

```bash
cd backend
node --test tests/**/*.test.js
```

Najvažnije pravilo koje se testira:

- doktor je bookable samo ako je `role = doctor`
- doktor mora biti `isActive = true`
- doktor mora biti `isApproved = true`
- doktor mora imati `approvalStatus = approved`

### Selenium POM testovi

Lokacija:

```text
page-object-model/
```

Struktura:

- page object klase: `src/main/java/pmf/imi/moodle`
- TestNG test klase: `src/test/java/pmf/imi/moodle`
- suite: `testng.xml`
- zajednička baza: `BasePageModel`

Pokretanje celog suite-a:

```bash
cd page-object-model
mvn test -Dsurefire.suiteXmlFiles=testng.xml
```

Pokretanje jedne klase:

```bash
cd page-object-model
mvn -Dtest=LoginPageTest test
```

Pokretanje jednog testa:

```bash
cd page-object-model
mvn -Dtest=DoctorsPageTest#testRejectedDoctorIsNotVisibleInSearchResults test
```

Ako `mvn` nije dostupan, testovi se mogu pokretati iz IDE-a preko TestNG run konfiguracije.

### POM suite obuhvat

`testng.xml` trenutno uključuje:

- `LoginPageTest`
- `RegisterPageTest`
- `DashboardPageTest`
- `AppointmentsPageTest`
- `MedicalRecordsPageTest`
- `PrescriptionsPageTest`
- `NotificationsPageTest`
- `ProfilePageTest`
- `DoctorsPageTest`
- `AvailabilityPageTest`
- `UsersPageTest`
- `AdminAppointmentsPageTest`
- `AdminDashboardPageTest`
- `AdminMedicalRecordsPageTest`
- `AdminPrescriptionsPageTest`
- `AdminStatisticsPageTest`

Suite je sekvencijalan (`parallel="false"`) zato što koristi lokalni backend, lokalni frontend i deljeni seed dataset.

### Stabilnost UI testova

UI testovi koriste `WebDriverWait` za:

- renderovanje login forme
- završetak loading stanja
- pojavu tabela, kartica, empty state-a ili error state-a
- promene URL-a nakon navigacije
- promene filtera i sortiranja
- Angular re-render scenarije

Za `type=date` polja koriste se JavaScript `input` i `change` događaji gde je to stabilnije od `sendKeys`, jer browser lokalizacija može da utiče na unos datuma.

### Testirani ekrani

POM regresija pokriva:

- login
- registraciju
- dashboard
- termine
- medicinske kartone
- recepte
- obaveštenja
- profil
- pretragu doktora i detalj doktora
- dostupnost doktora
- admin korisnike
- admin dashboard
- admin sve termine
- admin sve medicinske kartone
- admin sve recepte
- admin statistiku

Testovi su većinom read-only ili modal-open/modal-close regresije. Namerno se izbegavaju destruktivne UI akcije kao što su brisanje korisnika, brisanje dostupnosti ili izmena terapije, osim kada je test eksplicitno namenjen proveri kritične poslovne regresije.

## Važne regresije

### Odbijeni doktor ne sme biti zakaziv

Rešen je scenario u kome doktor sa `approvalStatus = rejected` može ostati vidljiv u pretrazi ili biti kandidat za zakazivanje.

Implementirano pravilo:

- doktor mora biti aktivan
- doktor mora biti odobren
- doktor mora imati status `approved`
- korisnik mora imati ulogu `doctor`

Relevantne lokacije:

- `backend/utils/doctorEligibility.js`
- `backend/routes/appointment.js`
- `backend/routes/doctor.js`
- `page-object-model/src/test/java/pmf/imi/moodle/DoctorsPageTest.java`

POM regresioni test:

- `testRejectedDoctorIsNotVisibleInSearchResults`

Test tok:

1. registruje novog doktora preko API-ja
2. loguje se kao admin i dobija JWT
3. odbija doktora preko admin API-ja
4. otvara `/doctors` kao pacijent
5. proverava da odbijeni doktor nije vidljiv u pretrazi

## Troubleshooting

### Backend ne radi

Proveriti:

- da MongoDB radi
- da je `backend/config.js` ispravan
- da port `3232` nije zauzet

### Frontend ne komunicira sa backend-om

Proveriti:

- `frontend/src/environments/environment.ts`
- CORS podešavanje u `backend/index.js`
- da backend radi na `http://localhost:3232`

### Login se vraća na login stranicu

Proveriti:

- da postoji `medify_token` u localStorage
- da `GET /auth/validate-token` vraća uspešan odgovor
- da korisnik ima odgovarajuću rolu za rutu

### Admin rute vraćaju 403 ili redirect

Proveriti:

- da je korisnik u ulozi `admin`
- da frontend poziva `/api/admin/*` rute
- da token nije istekao

### Doktor ne vidi dostupnosti ili slotove

Proveriti:

- `GET /doctors/:id/availability`
- `GET /doctors/:id/available-slots`
- da doktor ima generisanu default dostupnost
- da je doktor aktivan i odobren

### Selenium testovi padaju zbog podataka

Preporučeni reset:

```bash
cd backend
npm run seed:reset
```

Zatim ponovo pokrenuti:

- backend
- frontend
- POM suite

### Maven nije dostupan

Instalirati Maven 3.9+ ili pokrenuti TestNG klase direktno iz IDE-a.

## Operativne napomene

- Trenutni JWT secret je razvojni i ne treba ga koristiti u produkciji.
- MongoDB konekcija je lokalna po default-u.
- POM testovi očekuju Chrome browser.
- POM testovi očekuju aktivan frontend i backend.
- Seed podaci su deo testnog ugovora i treba ih održavati zajedno sa UI regresijom.

## Status projekta

Medify trenutno ima pokrivene glavne domenske tokove: autentifikaciju, korisnike, doktore, termine, kartone, recepte, dostupnost, admin nadzor, statistiku i obaveštenja. Projekat je pogodan za lokalni razvoj, demonstraciju funkcionalnosti i regresiono testiranje kroz Selenium Page Object Model suite.
