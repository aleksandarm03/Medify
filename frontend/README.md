# Medify Frontend

Angular frontend aplikacija za Medify sistem.

## Tehnologije

- Angular 21 (standalone komponente)
- TypeScript
- RxJS

## Preduslovi

- Node.js 18+
- npm
- Pokrenut Medify backend (podrazumevano `http://localhost:3232`)

## Instalacija

```bash
npm install
```

## Pokretanje

```bash
npm start
```

Aplikacija je dostupna na `http://localhost:4200`.

## Build i test

```bash
npm run build
npm run test
```

## Konfiguracija API adrese

API baza je definisana u `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3232'
};
```

Ako backend radi na drugoj adresi/portu, promeni `apiUrl`.

## Kljucne stranice

- Login / Register
- Dashboard
- Termini
- Medicinski kartoni
- Recepti
- Doktori
- Dostupnost
- Admin sekcije

