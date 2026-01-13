const mongoose = require("mongoose");

const DoctorAvailabilitySchema = mongoose.Schema({
    doctor: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    dayOfWeek: { 
        type: Number, 
        required: true,
        min: 0, // Nedelja
        max: 6  // Subota
    },
    startTime: { type: String, required: true }, // Format: "HH:MM" npr. "09:00"
    endTime: { type: String, required: true }, // Format: "HH:MM" npr. "17:00"
    isAvailable: { type: Boolean, default: true },
    breakStart: String, // Format: "HH:MM"
    breakEnd: String, // Format: "HH:MM"
    appointmentDuration: { type: Number, default: 30 }, // u minutima
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indeks za brže pretraživanje
DoctorAvailabilitySchema.index({ doctor: 1, dayOfWeek: 1 });

// Middleware za automatsko ažuriranje updatedAt
DoctorAvailabilitySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

var DoctorAvailabilityModel = mongoose.model("DoctorAvailability", DoctorAvailabilitySchema);

module.exports = DoctorAvailabilityModel;

