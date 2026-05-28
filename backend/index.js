const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const config = require('./config');
const mongoose = require('mongoose');
const AuthRouter = require('./routes/auth');
const AppointmentRouter = require('./routes/appointment');
const MedicalRecordRouter = require('./routes/medicalRecord');
const PrescriptionRouter = require('./routes/prescription');
const DoctorRouter = require('./routes/doctor');
const ProfileRouter = require('./routes/profile');
const AdminRouter = require('./routes/admin');
const { initializeSocket } = require('./socket');

const db = mongoose.connect(config.MongoConnection);

const app = express();
const httpServer = http.createServer(app);

app.use(cors({
    origin: "http://localhost:4200",   // Angular
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use('/auth', AuthRouter);
app.use('/appointments', AppointmentRouter);
app.use('/medical-records', MedicalRecordRouter);
app.use('/prescriptions', PrescriptionRouter);
app.use('/doctors', DoctorRouter);
app.use('/profile', ProfileRouter);
app.use('/api/admin', AdminRouter);



app.get('/', (req, res) => {    
    res.type('text/plain').send(`Medify - Sistem za upravljanje ordinacijom
Medify je RESTful API backend za upravljanje ordinacijom sa podrškom za:
- Upravljanje korisnicima (admin, doktor, pacijent)
- Zakazivanje i upravljanje terminima
- Medicinske kartone i preglede
- Recepte i propisane lekove
- Dostupnost doktora i pretragu
- Autentifikaciju i autorizaciju na osnovu uloga
- Real-time obavijesti putem Socket.io

Dostupni endpointi:
- /auth - Autentifikacija i korisnici
- /appointments - Termini
- /medical-records - Medicinski kartoni
- /prescriptions - Recepti
- /doctors - Pretraga doktora i dostupnost

Socket.io Real-time događaji:
- appointment:created - Novi termin
- appointment:status-updated - Statusne obavijesti
- chat:send-message - Real-time poruke
- doctor:availability-updated - Dostupnost doktora
- notification:* - Opće obavijesti
`);
});

// Inicijalizira Socket.io server
const io = initializeSocket(httpServer);

// Eksponiraj io na app za korištenje u rutama/servisima
app.locals.io = io;

httpServer.listen(config.PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   Medify - Backend Server Started      ║
    ║   Port: ${config.PORT}                 ║
    ║   Socket.io: AKTIVAN                   ║
    ║   MongoDB: Povezan                     ║
    ╚════════════════════════════════════════╝
    `);
});