const express=require('express');
const config=require('./config');
const mongoose=require('mongoose');
const AuthRouter=require('./routes/auth');
const AppointmentRouter=require('./routes/appointment');
const MedicalRecordRouter=require('./routes/medicalRecord');
const PrescriptionRouter=require('./routes/prescription');
const DoctorRouter=require('./routes/doctor');
const db=mongoose.connect(config.MongoConnection);


const app=express();
app.use(express.json());
app.use('/auth', AuthRouter);
app.use('/appointments', AppointmentRouter);
app.use('/medical-records', MedicalRecordRouter);
app.use('/prescriptions', PrescriptionRouter);
app.use('/doctors', DoctorRouter);



app.get('/',(req,res)=>{    
    res.type('text/plain').send(`Medify - Sistem za upravljanje ordinacijom
Medify je RESTful API backend za upravljanje ordinacijom sa podrškom za:
- Upravljanje korisnicima (admin, doktor, medicinska sestra, pacijent)
- Zakazivanje i upravljanje terminima
- Medicinske kartone i preglede
- Recepte i propisane lekove
- Dostupnost doktora i pretragu
- Autentifikaciju i autorizaciju na osnovu uloga

Dostupni endpointi:
- /auth - Autentifikacija i korisnici
- /appointments - Termini
- /medical-records - Medicinski kartoni
- /prescriptions - Recepti
- /doctors - Pretraga doktora i dostupnost
`);

});


app.get('/test',(req,res)=>{
    res.send("Test API!")
});

app.listen(config.PORT,()=>{
    console.log(`Aplikacija je pokrenuta na portu ${config.PORT}!`);
});