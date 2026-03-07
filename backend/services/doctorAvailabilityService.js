const DoctorAvailabilityModel = require("../models/doctorAvailability");
const AppointmentModel = require("../models/appointment");
const UserModel = require("../models/user");

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

function toMinutes(time) {
    const [hours, minutes] = String(time).split(":").map(Number);
    return hours * 60 + minutes;
}

function normalizeTimeWindow(startTime, endTime) {
    const start = toMinutes(startTime);
    let end = toMinutes(endTime);
    if (end <= start) {
        end += 24 * 60;
    }
    return { start, end };
}

function normalizeBreakWindow(breakStart, breakEnd, start, end) {
    let breakStartMin = toMinutes(breakStart);
    let breakEndMin = toMinutes(breakEnd);

    if (breakEndMin <= breakStartMin) {
        breakEndMin += 24 * 60;
    }
    if (breakStartMin < start) {
        breakStartMin += 24 * 60;
        breakEndMin += 24 * 60;
    }

    return { breakStartMin, breakEndMin };
}

function validateAvailabilityInput(availabilityData) {
    const {
        dayOfWeek,
        startTime,
        endTime,
        breakStart,
        breakEnd,
        appointmentDuration,
    } = availabilityData;

    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
        return "dayOfWeek mora biti između 0 (nedelja) i 6 (subota).";
    }

    if (startTime !== undefined && !TIME_REGEX.test(startTime)) {
        return "startTime mora biti u formatu HH:MM.";
    }

    if (endTime !== undefined && !TIME_REGEX.test(endTime)) {
        return "endTime mora biti u formatu HH:MM.";
    }

    if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
        return "Ako je uneta pauza, obavezna su i breakStart i breakEnd.";
    }

    if (breakStart && !TIME_REGEX.test(breakStart)) {
        return "breakStart mora biti u formatu HH:MM.";
    }

    if (breakEnd && !TIME_REGEX.test(breakEnd)) {
        return "breakEnd mora biti u formatu HH:MM.";
    }

    if (appointmentDuration !== undefined) {
        const duration = Number(appointmentDuration);
        if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
            return "appointmentDuration mora biti ceo broj između 5 i 240 minuta.";
        }
    }

    if (startTime && endTime) {
        const { start, end } = normalizeTimeWindow(startTime, endTime);
        if (end - start < 5) {
            return "Vremenski opseg dostupnosti je prekratak.";
        }

        if (breakStart && breakEnd) {
            const { breakStartMin, breakEndMin } = normalizeBreakWindow(
                breakStart,
                breakEnd,
                start,
                end
            );

            if (breakStartMin < start || breakEndMin > end || breakStartMin >= breakEndMin) {
                return "Pauza mora biti unutar radnog vremena i breakStart mora biti pre breakEnd.";
            }
        }
    }

    return null;
}

var setDoctorAvailability = async function(doctorId, availabilityData) {
    const validationError = validateAvailabilityInput(availabilityData);
    if (validationError) {
        const error = new Error(validationError);
        error.statusCode = 400;
        throw error;
    }

    const availability = new DoctorAvailabilityModel({
        doctor: doctorId,
        dayOfWeek: availabilityData.dayOfWeek,
        startTime: availabilityData.startTime,
        endTime: availabilityData.endTime,
        isAvailable: availabilityData.isAvailable !== false,
        breakStart: availabilityData.breakStart || undefined,
        breakEnd: availabilityData.breakEnd || undefined,
        appointmentDuration: availabilityData.appointmentDuration || 30
    });
    
    return await availability.save();
};

var getDoctorAvailabilityByDay = async function(doctorId, dayOfWeek) {
    return await DoctorAvailabilityModel.findOne({
        doctor: doctorId,
        dayOfWeek: dayOfWeek
    });
};

var getDoctorAvailability = async function(doctorId) {
    return await DoctorAvailabilityModel.find({ doctor: doctorId })
        .sort({ dayOfWeek: 1 });
};

var getAvailabilityById = async function(availabilityId) {
    return await DoctorAvailabilityModel.findById(availabilityId);
};

var updateDoctorAvailability = async function(availabilityId, updateData) {
    const current = await DoctorAvailabilityModel.findById(availabilityId);
    if (!current) {
        return null;
    }

    const merged = {
        dayOfWeek: updateData.dayOfWeek !== undefined ? updateData.dayOfWeek : current.dayOfWeek,
        startTime: updateData.startTime || current.startTime,
        endTime: updateData.endTime || current.endTime,
        breakStart: updateData.breakStart !== undefined ? updateData.breakStart : current.breakStart,
        breakEnd: updateData.breakEnd !== undefined ? updateData.breakEnd : current.breakEnd,
        appointmentDuration:
            updateData.appointmentDuration !== undefined
                ? updateData.appointmentDuration
                : current.appointmentDuration,
    };

    const validationError = validateAvailabilityInput(merged);
    if (validationError) {
        const error = new Error(validationError);
        error.statusCode = 400;
        throw error;
    }

    updateData.updatedAt = new Date();

    if (updateData.breakStart === "") {
        updateData.breakStart = undefined;
    }
    if (updateData.breakEnd === "") {
        updateData.breakEnd = undefined;
    }

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
    getDoctorAvailabilityByDay,
    getDoctorAvailability,
    getAvailabilityById,
    updateDoctorAvailability,
    deleteDoctorAvailability,
    getAvailableTimeSlots,
    createDefaultAvailability
};


