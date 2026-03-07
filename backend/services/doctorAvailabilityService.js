const DoctorAvailabilityModel = require("../models/doctorAvailability");
const AppointmentModel = require("../models/appointment");
const UserModel = require("../models/user");

var setDoctorAvailability = async function(doctorId, availabilityData) {
    const availability = new DoctorAvailabilityModel({
        doctor: doctorId,
        dayOfWeek: availabilityData.dayOfWeek,
        startTime: availabilityData.startTime,
        endTime: availabilityData.endTime,
        isAvailable: availabilityData.isAvailable !== false,
        breakStart: availabilityData.breakStart,
        breakEnd: availabilityData.breakEnd,
        appointmentDuration: availabilityData.appointmentDuration || 30
    });
    
    return await availability.save();
};

var getDoctorAvailability = async function(doctorId) {
    return await DoctorAvailabilityModel.find({ doctor: doctorId })
        .sort({ dayOfWeek: 1 });
};

var updateDoctorAvailability = async function(availabilityId, updateData) {
    updateData.updatedAt = new Date();
    return await DoctorAvailabilityModel.findByIdAndUpdate(
        availabilityId,
        { $set: updateData },
        { new: true, runValidators: true }
    );
};

var deleteDoctorAvailability = async function(availabilityId) {
    return await DoctorAvailabilityModel.findByIdAndDelete(availabilityId);
};

var getAvailableTimeSlots = async function(doctorId, date) {
    // Parse YYYY-MM-DD kao lokalni datum, bez UTC pomeranja dana
    const [year, month, day] = String(date).split("-").map(Number);
    const targetDate = new Date(year, (month || 1) - 1, day || 1);
    const dayOfWeek = targetDate.getDay();
    
    // Pronađi dostupnost za taj dan
    let availability = await DoctorAvailabilityModel.findOne({
        doctor: doctorId,
        dayOfWeek: dayOfWeek,
        isAvailable: true
    });

    // Fallback: za starije doktore bez dostupnosti pokušaj generisanja po smeni
    if (!availability) {
        const existingAvailability = await DoctorAvailabilityModel.find({ doctor: doctorId }).limit(1);
        if (existingAvailability.length === 0) {
            const doctor = await UserModel.findById(doctorId).select("shift role");
            if (doctor && doctor.role === "doctor" && doctor.shift) {
                await createDefaultAvailability(doctorId, doctor.shift);
                availability = await DoctorAvailabilityModel.findOne({
                    doctor: doctorId,
                    dayOfWeek: dayOfWeek,
                    isAvailable: true
                });
            }
        }
    }
    
    if (!availability) {
        return [];
    }
    
    // Dohvati sve termine za taj dan
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = await AppointmentModel.find({
        doctor: doctorId,
        appointmentDate: {
            $gte: startOfDay,
            $lte: endOfDay
        },
        status: { $ne: "canceled" }
    }).select("appointmentDate");
    
    // Generiši dostupne slotove
    const slots = [];
    const [startHour, startMin] = availability.startTime.split(":").map(Number);
    const [endHour, endMin] = availability.endTime.split(":").map(Number);
    
    let currentTime = new Date(targetDate);
    currentTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date(targetDate);
    endTime.setHours(endHour, endMin, 0, 0);

    // Podrška za smene koje prelaze preko ponoći (npr. 16:00-00:00)
    if (endTime <= currentTime) {
        endTime.setDate(endTime.getDate() + 1);
    }
    
    const duration = availability.appointmentDuration;
    
    while (currentTime < endTime) {
        // Proveri da li je u pauzi
        if (availability.breakStart && availability.breakEnd) {
            const [breakStartHour, breakStartMin] = availability.breakStart.split(":").map(Number);
            const [breakEndHour, breakEndMin] = availability.breakEnd.split(":").map(Number);
            
            const breakStart = new Date(targetDate);
            breakStart.setHours(breakStartHour, breakStartMin, 0, 0);
            const breakEnd = new Date(targetDate);
            breakEnd.setHours(breakEndHour, breakEndMin, 0, 0);
            
            if (currentTime >= breakStart && currentTime < breakEnd) {
                currentTime = breakEnd;
                continue;
            }
        }
        
        // Proveri da li je slot zauzet
        const slotEnd = new Date(currentTime.getTime() + duration * 60000);
        const isBooked = appointments.some(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return (aptDate >= currentTime && aptDate < slotEnd) ||
                   (currentTime >= aptDate && currentTime < new Date(aptDate.getTime() + duration * 60000));
        });
        
        if (!isBooked && slotEnd <= endTime && currentTime > new Date()) {
            slots.push(new Date(currentTime));
        }
        
        currentTime = new Date(currentTime.getTime() + duration * 60000);
    }
    
    return slots;
};

/**
 * Kreira automatsku nedeljnu dostupnost za doktora prema shift-u
 * - morning: Pon-Pet 08:00-16:00
 * - evening: Pon-Pet 16:00-00:00
 * - night: Pon-Pet 00:00-08:00
 */
var createDefaultAvailability = async function(doctorId, shift) {
    if (!shift) {
        console.log("Shift nije definisan, preskačem kreiranje dostupnosti");
        return [];
    }

    const shiftTimes = {
        morning: { startTime: "08:00", endTime: "16:00", breakStart: "12:00", breakEnd: "13:00" },
        evening: { startTime: "16:00", endTime: "00:00", breakStart: null, breakEnd: null },
        night: { startTime: "00:00", endTime: "08:00", breakStart: null, breakEnd: null }
    };

    const times = shiftTimes[shift];
    if (!times) {
        console.log("Nepoznat shift:", shift);
        return [];
    }

    const availabilities = [];
    // Kreiraj dostupnost za Ponedeljak(1) - Petak(5)
    for (let day = 1; day <= 5; day++) {
        const availability = new DoctorAvailabilityModel({
            doctor: doctorId,
            dayOfWeek: day,
            startTime: times.startTime,
            endTime: times.endTime,
            isAvailable: true,
            breakStart: times.breakStart,
            breakEnd: times.breakEnd,
            appointmentDuration: 30
        });
        
        const saved = await availability.save();
        availabilities.push(saved);
    }

    console.log(`✅ Kreirana automatska dostupnost za doktora ${doctorId}, shift: ${shift} (${availabilities.length} dana)`);
    return availabilities;
};

module.exports = {
    setDoctorAvailability,
    getDoctorAvailability,
    updateDoctorAvailability,
    deleteDoctorAvailability,
    getAvailableTimeSlots,
    createDefaultAvailability
};


