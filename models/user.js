const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt=require("jsonwebtoken");
const config=require("../config");

const UserSchema = new mongoose.Schema({
    // Zajednička polja za sve korisnike
    JMBG: { type: String, required: true,unique:true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    homeAddress: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    dateOfBirth: { type: Date },
    role: { type: String, enum: ["admin", "doctor", "nurse", "patient"], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    appointments:[{type:mongoose.Types.ObjectId,ref:"Appointment"}],

    // Polja specifična za doktore
    specialization: { type: String },  //npr. kardiolog, ORL, dermatolog
    licenseNumber: { type: String },    //broj lekarske licence
    yearsOfExperience: { type: Number },
    officeNumber: { type: String },
    shift: { type: String, enum: ["morning", "evening", "night"] },

    // Polja specifična za pacijente
    bloodType: { type: String, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
    allergies: [String],
    insuranceNumber: { type: String },
    insuranceCompany: { type: String }
});

UserSchema.methods.savePassword=function(password){
   this.passwordSalt = crypto.randomBytes(16).toString("hex");
   this.passwordHash = crypto.pbkdf2Sync(password,this.passwordSalt,1000,64,"sha512").toString("hex");

};

UserSchema.methods.validatePassword=function(password){
   const hash=crypto.pbkdf2Sync(password,this.passwordSalt,1000,64,"sha512").toString("hex");
   return this.passwordHash===hash;
}


UserSchema.methods.generateJwt = function()
{
    // Token važi 7 dana
    var expire = new Date();
    expire.setDate(expire.getDate() + 7);

    return jwt.sign({
        _id: this._id,
        exp: Math.floor(expire.getTime() / 1000) // JWT standard za expiration
    },config.secret)
}


var UserModel=mongoose.model("User", UserSchema);
UserModel.register=async function(JMBG,firstName,lastName,password,homeAddress,phoneNumber,gender,role)
{
    var user=new UserModel({
        JMBG:JMBG,
        firstName:firstName,
        lastName:lastName,
        homeAddress:homeAddress,
        phoneNumber:phoneNumber,    
        gender:gender,
        role:role
    });
    user.savePassword(password);
    var savedUser=await user.save();    
    return savedUser;    
}
module.exports = UserModel;