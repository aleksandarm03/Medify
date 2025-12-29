const mongoose = require("mongoose");

const PrescriptionSchema = mongoose.Schema({
    patient: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    medicalRecord: { type: mongoose.Types.ObjectId, ref: "MedicalRecord" },
    appointment: { type: mongoose.Types.ObjectId, ref: "Appointment" },
    medications: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true }, // npr. "500mg"
        frequency: { type: String, required: true }, // npr. "2x dnevno"
        duration: { type: String, required: true }, // npr. "7 dana"
        instructions: String // npr. "Uz obrok"
    }],
    issueDate: { type: Date, required: true, default: Date.now },
    validUntil: Date,
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware za automatsko ažuriranje updatedAt
PrescriptionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

var PrescriptionModel = mongoose.model("Prescription", PrescriptionSchema);

module.exports = PrescriptionModel;

