# Socket.io Real-time Notifikacijski Sistem - Upustva

## 📋 Pregled

Profesionalna Socket.io infrastruktura za real-time obavijesti u Medify aplikaciji. Podrška za:
- ✅ Real-time termine i status promjene
- ✅ Direktne poruke između korisnika
- ✅ Dostupnost doktora u realnom vremenu
- ✅ Recepti i medicinski kartoni obavijesti
- ✅ Video pozivi (signalizacija)
- ✅ Sistem obavijesti

---

## 🏗️ Arhitektura

```
socket/
├── config.js                          # Socket.io konfiguracija
├── middleware.js                      # JWT autentuzacija
├── socketEmitter.js                   # Event emitter za servise
├── index.js                           # Glavna inicijalizacija
├── managers/
│   └── connectionManager.js           # Upravljanje konekcijama korisnika
└── handlers/
    ├── appointmentHandler.js          # Termin eventi
    ├── messageHandler.js              # Chat eventi
    ├── notificationHandler.js         # Opće obavijesti
    └── doctorAvailabilityHandler.js   # Dostupnost doktora
```

---

## 🚀 Inicijalizacija Backend-a

### 1. Instaliraj dependencije
```bash
cd backend
npm install socket.io
```

### 2. Backend je već konfiguriran

File `backend/index.js` je već ažuriran sa:
- HTTP serverom
- Socket.io inicijalizacijom
- Svim event handled registracijama

### 3. Pokreni server
```bash
npm start
```

Server će biti dostupan na `http://localhost:3232` sa Socket.io na istoj porti.

---

## 📱 Frontend Sa Socket.io

### 1. Instaliraj dependencije
```bash
cd frontend
npm install socket.io-client
```

### 2. Koristi Socket Servic

#### Osnovna inicijalizacija
```typescript
import { SocketService } from './services/socket.service';

export class YourComponent {
    constructor(private socketService: SocketService) {
        // Socket je automatski inicijaliziran
        this.setupListeners();
    }

    private setupListeners(): void {
        // Sluša nove termine
        this.socketService.getAppointmentCreatedObservable().subscribe(event => {
            console.log('Novi termin:', event);
        });

        // Sluša obavijesti
        this.socketService.getNotificationObservable().subscribe(notification => {
            console.log('Nova obavijest:', notification);
        });

        // Sluša poruke
        this.socketService.getMessageReceivedObservable().subscribe(message => {
            console.log('Nova poruka:', message);
        });
    }
}
```

---

## 🔔 Event Tipovi

### 📅 Appointment Eventi

#### `appointment:created` - Novi termin
```typescript
// Backend emitovanje
emitAppointmentCreated(doctorId, {
    appointmentId: '123',
    patientName: 'Marko',
    dateTime: '2024-05-15 14:00',
    reason: 'Opšti pregled'
});

// Frontend slušanje
socketService.getAppointmentCreatedObservable().subscribe(data => {
    // Prikaži notifikaciju
    showNotification('Novi termin od ' + data.appointment.patientName);
});
```

#### `appointment:status-updated` - Promjena statusa
```typescript
// Backend
updateAppointmentStatus(appointmentId, patientId, doctorId, 'confirmed', '');

// Frontend
socketService.getAppointmentUpdatedObservable().subscribe(data => {
    console.log('Status:', data.newStatus); // 'confirmed', 'cancelled', etc.
});
```

#### `appointment:prescription-added` - Nova recepti
```typescript
// Backend
emitPrescriptionAdded(patientId, doctorId, prescriptionData);

// Frontend
socketService.getNotificationObservable().subscribe(data => {
    if (data.type === 'prescription_added') {
        showAlert('Doktor je dodao recepta');
    }
});
```

### 💬 Message Eventi

#### `chat:send-message` - Pošalji poruku
```typescript
// Frontend
socketService.sendMessage(recipientId, 'Pozdrav!', appointmentId);

// Backend automatski koristi event handler
```

#### `chat:message-received` - Primi poruku
```typescript
// Frontend
socketService.getMessageReceivedObservable().subscribe(message => {
    console.log(`Od: ${message.senderEmail}`);
    console.log(`Poruka: ${message.message}`);
    console.log(`Vrijeme: ${message.timestamp}`);
});
```

#### `chat:typing` - Kucanje poruke
```typescript
// Frontend - Obavijesti da kucaš
socketService.startTyping(recipientId);

// Slusač
socketService.getTypingObservable().subscribe(event => {
    if (event.type === 'typing') {
        showTypingIndicator(event.data.userEmail);
    } else {
        hideTypingIndicator();
    }
});
```

### 👨‍⚕️ Doctor Availability Eventi

#### `doctor:availability-updated` - Dostupnost se promijenila
```typescript
// Backend - Doktor ažurira dostupnost
socketService.updateDoctorAvailability(doctorId, 'busy', {
    startTime: '14:00',
    endTime: '16:00'
});

// Frontend - Slusač
socketService.getDoctorAvailabilityObservable().subscribe(data => {
    console.log('Status:', data.status); // 'available', 'busy', 'offline'
});
```

#### `doctor:online` / `doctor:offline`
```typescript
// Backend
socketService.setDoctorOnline(doctorId);
socketService.setDoctorOffline(doctorId);

// Frontend
socketService.getDoctorAvailabilityObservable().subscribe(data => {
    if (data.doctorId) {
        updateDoctorStatusInUI(data.doctorId, data.status);
    }
});
```

### 📹 Video Call Eventi

#### Zahtjev za video poziva
```typescript
// Doktor → Pacijent
socketService.requestVideoCall(patientId, appointmentId);

// Pacijent prima notifikaciju
socketService.getNotificationObservable().subscribe(data => {
    if (data.type === 'video_call_incoming') {
        showVideoCallDialog(data);
        // Ponudi Accept/Reject
    }
});
```

#### Prihvat/Odbijanje
```typescript
// Prihvati
socketService.acceptVideoCall(doctorId, appointmentId);

// Odbij
socketService.rejectVideoCall(doctorId, appointmentId, 'Zauzet/a sam');

// Doktor prima odgovor
socketService.getNotificationObservable().subscribe(data => {
    if (data.type === 'video_call_accepted') {
        startWebRTC(data);
    }
});
```

---

## 🛠️ Primjena u Servisima

### U App Service-u

```typescript
import { socketEmitter } from './socket/socketEmitter';

export class AppointmentService {
    createAppointment(appointmentData) {
        // Kreiraj termin u bazi
        const appointment = await this.db.appointments.create(appointmentData);

        // Emituj event na sve klijente
        socketEmitter.emitAppointmentCreated(
            appointmentData.doctorId,
            appointment
        );

        return appointment;
    }

    updateStatus(appointmentId, newStatus) {
        const appointment = await this.db.appointments.update(appointmentId, { status: newStatus });

        // Obavijesti sve zainteresovane
        socketEmitter.emitAppointmentStatusUpdated(
            appointmentId,
            appointment.patientId,
            appointment.doctorId,
            newStatus,
            ''
        );

        return appointment;
    }
}
```

### U Route Handler-u

```typescript
const router = require('express').Router();
const socketEmitter = require('../socket/socketEmitter');

router.post('/appointments', async (req, res) => {
    try {
        const appointment = await appointmentService.create(req.body);
        
        // Emituj socket event
        socketEmitter.emitAppointmentCreated(
            req.body.doctorId,
            appointment
        );

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

---

## 📊 Connection Manager API

```typescript
const connectionManager = require('./socket/managers/connectionManager');

// Pronađi socket ID korisnika
const socketId = connectionManager.getSocketId(userId);

// Provjerite je li korisnik online
const isOnline = connectionManager.isUserOnline(userId);

// Dobij sve aktivne korisnike
const allUsers = connectionManager.getActiveUsers();

// Dobij korisnike po ulozi
const doctors = connectionManager.getOnlineDoctors();
const patients = connectionManager.getOnlinePatients();
const admins = connectionManager.getOnlineAdmins();

// Statistika
const count = connectionManager.getActiveUserCount();
```

---

## 🔐 Sigurnost

### JWT Autentizacija

Socket konekcije koriste JWT tokene iz `Authorization` headera. Middleware automatski:
1. Ekstrahira token iz `socket.handshake.auth.token`
2. Verificira JWT
3. Sprema `userId`, `role`, `email` na socket objekat

```javascript
socket.userId      // ID korisnika
socket.userRole    // 'admin', 'doctor', 'patient'
socket.email       // Korisničko e-pošte
```

### Validacija Uloga

```typescript
socket.on('admin:special-event', (data) => {
    if (socket.userRole !== 'admin') {
        return socket.emit('error', { message: 'Nedostaje permisija' });
    }
    // Samo admini mogu izvršiti
});
```

---

## ⚡ Best Practices

### 1. Poveži se pri logiranju
```typescript
// auth.service.ts - Nakon uspješne prijave
async login(email, password) {
    const response = await this.authenticate(email, password);
    localStorage.setItem('token', response.token);
    
    // Socket će se automatski priključiti sa token-om
    this.socketService.reconnect();
}
```

### 2. Odspoji se pri odjavi
```typescript
async logout() {
    this.socketService.disconnect();
    localStorage.removeItem('token');
}
```

### 3. Upravljanje je li konekcija aktivna
```typescript
if (this.socketService.isConnected()) {
    this.socketService.sendMessage(userId, message);
} else {
    showError('Niste povezani. Pokušajte kasnije.');
}
```

### 4. Slušaj aktivne korisnike
```typescript
this.socketService.getActiveUsersObservable().subscribe(data => {
    console.log(`Aktivnih korisnika: ${data.count}`);
    this.updateOnlinesList();
});
```

### 5. Rukovanje greškama
```typescript
try {
    const response = await this.socketService.ping();
    console.log('Socket je aktivan');
} catch (error) {
    console.error('Socket greška:', error);
    this.socketService.reconnect();
}
```

---

## 🐛 Debugging

### Omogući console logove

Socket serveri ispisuje na `console`:
```
[Socket] Korisnik userId123 (doctor) je povezan. ID: socket-id-123
[ConnectionManager] Dodan: userId123 (socket-id-123)
[Appointment] Doktor userId123 obaviješten o novom terminu
[Chat] Poruka od userId456 prema userId789
```

### Provjera aktivnih konekcija

Backend console će show:
```
[Socket.io] Server inicijaliziran uspješno
╔════════════════════════════════════════╗
║   Medify - Backend Server Started      ║
║   Port: 3232                           ║
║   Socket.io: AKTIVAN                   ║
║   MongoDB: Povezan                     ║
╚════════════════════════════════════════╝
```

---

## 🎯 Checklist za Integraciju

### Backend
- [ ] Pokreni `npm install socket.io` u backend direktoriju
- [ ] Verifikuj da je `backend/index.js` ažuriran
- [ ] Testiraj socket konekciju na localhost:3232
- [ ] Implementiraj socket emit pozive u servisima

### Frontend
- [ ] Pokreni `npm install socket.io-client` u frontend direktoriju
- [ ] Socket service je već kreirano (`socket.service.ts`)
- [ ] Testiraj konekciju u DevTools Console-u
- [ ] Registriraj se na relevantne observable-e

### Testiranje
- [ ] Kreiraj termin i provjeri real-time obavijest
- [ ] Pošalji poruku između doktora i pacijenta
- [ ] Testiraj ažuriranje dostupnosti doktora
- [ ] Provjeri video poziva signalizaciju

---

## 📞 Podrška

Za probleme ili pitanja pogledaj:
- `backend/socket/` - Backend socket implementacija
- `frontend/src/app/services/socket.service.ts` - Frontend service
- Console logove za debug informacije

Sveukupna struktura je profesionalna i spremna za produkciju! 🚀
