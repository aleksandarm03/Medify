const mongoose = require("mongoose");

const MedicalRecordSchema = mongoose.Schema({
    patient: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    appointment: { type: mongoose.Types.ObjectId, ref: "Appointment" },
    visitDate: { type: Date, required: true, default: Date.now },
    diagnosis: { type: String, required: true },
    symptoms: [String],
    examinationNotes: String,
    treatment: String,
    recommendations: String,
    vitalSigns: {
        bloodPressure: String, // npr. "120/80"
        heartRate: Number,
        temperature: Number, // u Celzijusima
        weight: Number, // u kilogramima
        height: Number // u centimetrima
    },
    labResults: [{
        testName: String,
        result: String,
        normalRange: String,
        date: { type: Date, default: Date.now }
    }],
    followUpDate: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware za automatsko ažuriranje updatedAt
MedicalRecordSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

var MedicalRecordModel = mongoose.model("MedicalRecord", MedicalRecordSchema);

module.exports = MedicalRecordModel;

