const express=require('express');
const config=require('./config');
const mongoose=require('mongoose');

const db=mongoose.connect(config.MongoConnection);

//MODELS
const UserModel = require('./model/user');

const app=express();



app.get('/users',async (req,res)=>{

    res.send(await UserModel.find());
});


app.get('/test',(req,res)=>{
    res.send("Test API!")
});

app.listen(config.PORT,()=>{
    console.log(`Aplikacija je pokrenuta na portu ${config.PORT}!`);
});