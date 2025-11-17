const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    // Zajednička polja za sve korisnike
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    passwordHash: { type: String, required: true },
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

module.exports = mongoose.model("User", UserSchema);
