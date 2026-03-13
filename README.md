# Medify

Medify je full-stack aplikacija za upravljanje ordinacijom, sa Angular frontend-om i Node.js/Express backend-om.



## 1. Stack i arhitektura

- Frontend: Angular 21, TypeScript, RxJS
- Backend: Node.js, Express 5, Passport (Local + JWT)
- Baza: MongoDB + Mongoose

Arhitektura:

- `frontend/` je SPA klijent koji koristi REST API
- `backend/` je API servis sa autentifikacijom i RBAC pravilima

## 2. Uloge u sistemu

Podrzane uloge:

- `admin`
- `doctor`
- `patient`

Napomena: u autentifikacionoj konfiguraciji (`backend/routes/config.js`) ove tri uloge su eksplicitno podrzane.

## 3. Glavne funkcionalnosti

- Registracija i login korisnika (JWT)
- Zakazivanje i upravljanje terminima
- Medicinski kartoni
- Recepti
- Dostupnost doktora
- Administrativne funkcije (admin sekcije)

## 4. Struktura repozitorijuma

```text
Medify/
  README.md
  backend/
    config.js
    index.js
    package.json
    models/
    routes/
    services/
    scripts/
  frontend/
    angular.json
    package.json
    src/
      environments/
      app/
  page-object-model/
    pom.xml
    testng.xml
    src/
      main/java/
      test/java/
```

## 5. Preduslovi

- Node.js 18+
- npm
- MongoDB (lokalno ili cloud)
- JDK 21
- Maven 3.9+
- Google Chrome (aktuelna verzija)

## 6. Quick start 

### 6.1 Pokretanje backend-a

```bash
cd backend
npm install
npm start
```

Podrazumevana adresa backend-a: `http://localhost:3232`

### 6.2 Pokretanje frontend-a

U novom terminalu:

```bash
cd frontend
npm install
npm start
```

Podrazumevana adresa frontend-a: `http://localhost:4200`

### 6.3 Pokretanje POM UI testova (Selenium + TestNG)

U novom terminalu:

```bash
cd page-object-model
mvn test -Dsurefire.suiteXmlFiles=testng.xml
```

Napomena: pre pokretanja testova moraju biti podignuti backend, frontend i seed podaci.

## 7. Konfiguracija

### 7.1 Backend konfiguracija (`backend/config.js`)

Podrazumevane vrednosti:

- `PORT: 3232`
- `MongoConnection: mongodb://localhost:27017/Medify`
- `secret: <jwt-secret>`

Ako promenis `PORT`, obavezno azuriraj frontend API URL.

### 7.2 Frontend konfiguracija (`frontend/src/environments/environment.ts`)

Podrazumevano:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3232'
};
```

Ako backend radi na drugom hostu/portu, promeni `apiUrl`.

## 8. Seed podaci i test nalozi

Seed skripte su u `backend/scripts/seed.js`.

Komande (`backend/`):

- `npm run seed` - puni bazu samo ako je prazna
- `npm run seed:reset` - brise postojecu bazu i puni ponovo

Seed kreira:

- 1 admin nalog
- 2 doctor naloga
- 2 patient naloga
- demo termine, kartone i recepte

Test kredencijali iz seed-a (JMBG / lozinka):

- Admin: `1001001001001` / `Admin123!`
- Doctor 1: `3003003003003` / `Doctor123!`
- Doctor 2: `4004004004004` / `Doctor123!`
- Patient 1: `5005005005005` / `Patient123!`
- Patient 2: `6006006006006` / `Patient123!`

## 9. NPM skripte

### 9.1 Backend (`backend/package.json`)

- `npm start` - pokrece API server (`node index.js`)
- `npm run seed` - pokrece seed bez reset-a
- `npm run seed:reset` - reset + seed

### 9.2 Frontend (`frontend/package.json`)

- `npm start` - Angular dev server
- `npm run build` - build aplikacije
- `npm run watch` - build u watch modu
- `npm run test` - testovi

## 10. API pregled (prefiksi ruta)

Glavni prefiksi:

- `/auth`
- `/appointments`
- `/medical-records`
- `/prescriptions`
- `/doctors`
- `/admin`

Tipicni endpoint-i:

- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/users` (admin)
- Appointments:
  - `POST /appointments`
  - `GET /appointments/doctor`
  - `GET /appointments/patient`
  - `PUT /appointments/:id/status`
- Medical records:
  - `POST /medical-records`
  - `GET /medical-records/patient/:patientId`
  - `GET /medical-records/:id`
  - `PUT /medical-records/:id`
- Prescriptions:
  - `POST /prescriptions`
  - `GET /prescriptions/patient/:patientId`
  - `PUT /prescriptions/:id/status`
- Doctors:
  - `GET /doctors`
  - `GET /doctors/search`
  - `GET /doctors/:id/availability`
  - `GET /doctors/:id/available-slots`

## 11. Frontend stranice (pregled)

- Login / Register
- Dashboard
- Termini
- Medicinski kartoni
- Recepti
- Doktori
- Dostupnost
- Admin sekcije

## 12. Tipican tok rada

Doktor scenario:

1. Doktor vidi listu termina.
2. Zavrsava termin.
3. Iz zavrsenog termina kreira medicinski karton.
4. Iz kartona moze otvoriti kreiranje recepta.

Patient scenario:

1. Pacijent zakazuje i prati svoje termine.
2. Gleda svoje medicinske kartone.
3. Gleda recepte i njihov status.

## 13. Troubleshooting

- Frontend ne moze da pristupi API-ju:
  - proveri da backend radi na `http://localhost:3232`
  - proveri `frontend/src/environments/environment.ts`
- Login ne prolazi:
  - proveri da koristis ispravan `JMBG` i lozinku
  - proveri da li je seed pokrenut (`npm run seed:reset`)
- Nema podataka na listama:
  - proveri da li je baza prazna
  - proveri ulogu korisnika i prava pristupa

- Selenium/TestNG testovi padaju odmah na login/register:
  - proveri da frontend radi na `http://localhost:4200`
  - proveri da backend radi na `http://localhost:3232`
  - pokreni seed (`cd backend && npm run seed:reset`)

- CDP warning za Chrome u Selenium testovima:
  - warning je cesto informativan, ali je preporuka da Selenium verzija u `page-object-model/pom.xml` bude uskladjena sa verzijom Chrome-a

## 14. Napomena

Dokumentacija za backend i frontend postoji i u podfolderima (`backend/README.md`, `frontend/README.md`), ali je ovaj fajl (`README.md`) glavni i obuhvata kompletan projekat end-to-end.

## 15. UI automatizacija (POM)

UI automatizacija je izdvojena u modul `page-object-model/`.

- Framework: Selenium WebDriver + TestNG + WebDriverManager
- Stil: Page Object Model (POM)
- Glavni suite fajl: `page-object-model/testng.xml`

Trenutno pokrivene stranice:

- Login (`LoginPageTest`)
- Register (`RegisterPageTest`)
- Dashboard (`DashboardPageTest`)
- Profile (`ProfilePageTest`)
- Doctors (`DoctorsPageTest`)

Pokretanje iz IntelliJ-a:

- desni klik na `page-object-model/testng.xml` -> `Run 'testng.xml'`
