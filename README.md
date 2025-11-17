# Medify - Sistem za upravljanje ordinacijom


Medify je **studentski projekat iz predmeta: Web programiranje 2**, jednostavan sistem za upravljanje ordinacijom. Omogućava upravljanje korisnicima sa različitim ulogama, osnovno zakazivanje termina i evidenciju podataka pacijenata i osoblja.

---
## Tehnologije

- **Backend**: Node.js, Express.js
- **Baza podataka**: MongoDB, Mongoose ODM
- **Arhitektura**: RESTful API
- **Pakovanje**: npm

---

## Preduslovi

Prije pokretanja aplikacije potrebno je instalirati:

- [Node.js](https://nodejs.org/) (verzija 14+)
- [MongoDB](https://www.mongodb.com/) (lokalna ili cloud verzija)
- npm (dolazi sa Node.js)

---

## Instalacija i pokretanje

### 1. Kloniranje repozitorijuma
```bash
git clone https://github.com/aleksandarm03/Medify
cd PROJEKAT
```

### 2. Instalacija dependencies
```bash
npm install
```

### 3. Konfiguracija
Proverite da li su postavke u `config.js` pravilne:
```javascript
module.exports = {
    PORT: 3232,
    MongoConnection: "mongodb://localhost:27017/Medify"
};
```

### 4. Pokretanje MongoDB-a
Uverite se da je MongoDB pokrenuto na vašem sistemu.

### 5. Pokretanje aplikacije
```bash
node index.js
```

Aplikacija će biti dostupna na: `http://localhost:3232`

---

## API Dokumentacija

### Testni endpoint
```
GET /test
```
**Opis**: Testira da li je API funkcionalan  
**Odgovor**: "Test API!"

### Korisnici
```
GET /users
```
**Opis**: Dohvata sve korisnike iz baze podataka  
**Odgovor**: Lista svih korisnika u JSON formatu

---

## Struktura projekta

```
PROJEKAT/
├── config.js          # Konfiguracija aplikacije
├── index.js            # Glavni server fajl
├── package.json        # npm dependencies i skripte
├── README.md           # Dokumentacija
└── model/
    └── user.js         # Mongoose model za korisnike
```

## Buduće funkcionalnosti

- [ ] **Autentifikacija i autorizacija**
  - JWT tokeni
  - Middleware za role-based pristup
  
- [ ] **Zakazivanje termina**
  - Kalendar dostupnosti
  - Automatska notifikacija
  
- [ ] **Medicinski kartoni**
  - Istorija pregleda
  - Dijagnoze i terapije
  
- [ ] **Dashboard**
  - Statistike i izveštaji
  - Grafički prikaz podataka
  
- [ ] **Notifikacije**
  - Email notifikacije
  - SMS podsetniki

