# Medify Frontend

Kompletan Angular frontend za Medify sistem za upravljanje ordinacijom.

## Tehnologije

- Angular 21
- TypeScript
- RxJS
- Standalone Components

## Struktura

### Komponente

- **Login/Register** - Autentifikacija korisnika
- **Dashboard** - Početna stranica sa linkovima prema funkcionalnostima
- **Appointments** - Upravljanje terminima
- **Medical Records** - Upravljanje medicinskim kartonima
- **Prescriptions** - Upravljanje receptima
- **Doctors** - Pretraga doktora
- **Availability** - Upravljanje dostupnošću doktora
- **Users** - Upravljanje korisnicima (samo admin)

### Servisi

- **ApiService** - Bazni HTTP servis
- **AuthService** - Autentifikacija i autorizacija
- **AppointmentService** - CRUD operacije za termine
- **MedicalRecordService** - CRUD operacije za medicinske kartone
- **PrescriptionService** - CRUD operacije za recepte
- **DoctorService** - Pretraga doktora i upravljanje dostupnošću

### Guards

- **authGuard** - Zaštita ruta koje zahtevaju autentifikaciju
- **roleGuard** - Zaštita ruta na osnovu uloga

## Pokretanje

1. Instalirajte zavisnosti:
```bash
npm install
```

2. Pokrenite development server:
```bash
npm start
```

Aplikacija će biti dostupna na `http://localhost:4200`

**Napomena**: Backend mora biti pokrenut na `http://localhost:3232`

## Funkcionalnosti

### Za sve uloge:
- Prijava i registracija
- Dashboard sa linkovima

### Za pacijente:
- Pregled termina
- Pretraga doktora
- Pregled medicinskih kartona
- Pregled recepata

### Za doktore:
- Upravljanje terminima
- Kreiranje i ažuriranje medicinskih kartona
- Kreiranje recepata
- Upravljanje dostupnošću

### Za medicinske sestre:
- Pregled termina
- Kreiranje i ažuriranje medicinskih kartona

### Za administratore:
- Pregled svih korisnika

## Napomena

Backend JWT token sadrži samo `_id` korisnika, ne i `role`. Zbog toga, role-based navigacija u navigacionom meniju može biti ograničena. Za potpunu funkcionalnost, preporučeno je dodati endpoint `/auth/me` u backend ili uključiti `role` u JWT token payload.




