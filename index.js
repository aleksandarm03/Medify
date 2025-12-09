const express=require('express');
const config=require('./config');
const mongoose=require('mongoose');
const AuthRouter=require('./routes/auth');
const AppointmentRouter=require('./routes/appointment');
const db=mongoose.connect(config.MongoConnection);


const app=express();
app.use(express.json());
app.use('/auth', AuthRouter);
app.use('/appointments', AppointmentRouter);



app.get('/',(req,res)=>{    
    res.type('text/plain').send(`Medify
Medify je jednostavna aplikacija za upravljanje medicinskim podacima.
Trenutno pruža API za upravljanje korisnicima i služi kao početna baza za dalji razvoj zdravstvenih funkcionalnosti.`);

});


app.get('/test',(req,res)=>{
    res.send("Test API!")
});

app.listen(config.PORT,()=>{
    console.log(`Aplikacija je pokrenuta na portu ${config.PORT}!`);
});