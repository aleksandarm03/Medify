const express=require('express');
const config=require('./config');
const mongoose=require('mongoose');

const db=mongoose.connect(config.MongoConnection);

//MODELS
const UserModel = require('./models/user');

const app=express();



app.get('/users',async (req,res)=>{

    res.send(await UserModel.find());
});

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