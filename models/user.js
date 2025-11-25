const mongoose = require("mongoose");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
    // Zajednička polja za sve korisnike
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




var UserModel=mongoose.model("User", UserSchema);
UserModel.register=function(firstName,lastName,password,homeAddress,phoneNumber,gender,role)
{
    var user=new UserModel({
        firstName:firstName,
        lastName:lastName,
        homeAddress:homeAddress,
        phoneNumber:phoneNumber,    
        gender:gender,
        role:role
    });
    user.savePassword(password);
    user.save();        
}
module.exports = UserModel;