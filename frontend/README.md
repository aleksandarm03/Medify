# Medify Frontend

Angular 21 frontend aplikacija za Medify sistem.

## Tehnologije

- Angular 21 (standalone komponente)
- TypeScript
- RxJS
- Angular Router
- HTTP interceptor za JWT

## Preduslovi

- Node.js 18+
- npm
- Pokrenut backend na http://localhost:3232 (ili izmenjen apiUrl)

## Instalacija

Iz foldera frontend/:

```bash
npm install
```

## Pokretanje

```bash
npm start
```

Aplikacija je dostupna na http://localhost:4200

## Skripte

- npm start -> ng serve
- npm run build -> ng build
- npm run watch -> ng build --watch --configuration development
- npm run test -> ng test
- npm run serve:ssr:frontend -> node dist/frontend/server/server.mjs

## API konfiguracija

Fajl: src/environments/environment.ts

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3232'
};
```

## Auth i localStorage

Frontend koristi:

- medify_token
- medify_user

Guard logika validira token pozivom backend endpointa GET /auth/validate-token.

## Ruta mapa

### Javne rute

- /login
- /register

### Zaštićene rute (authGuard)

- /dashboard
- /appointments
- /medical-records
- /prescriptions
- /doctors
- /doctors/:id
- /profile

### Role-restricted rute (roleGuard)

Doctor:

- /availability

Admin:

- /users
- /admin/dashboard
- /admin/appointments
- /admin/medical-records
- /admin/prescriptions
- /admin/statistics

## Ključni moduli

Komponente:

- login, register
- dashboard
- appointments
- medical-records
- prescriptions
- doctors
- availability
- profile
- users
- admin/*

Servisi:

- api.service.ts
- auth.service.ts
- appointment.service.ts
- medical-record.service.ts
- prescription.service.ts
- doctor.service.ts
- profile.service.ts
- admin.service.ts


