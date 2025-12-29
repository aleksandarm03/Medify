const DoctorAvailabilityModel = require("../models/doctorAvailability");
const AppointmentModel = require("../models/appointment");

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
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    
    // Pronađi dostupnost za taj dan
    const availability = await DoctorAvailabilityModel.findOne({
        doctor: doctorId,
        dayOfWeek: dayOfWeek,
        isAvailable: true
    });
    
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
        
        if (!isBooked && slotEnd <= endTime) {
            slots.push(new Date(currentTime));
        }
        
        currentTime = new Date(currentTime.getTime() + duration * 60000);
    }
    
    return slots;
};

module.exports = {
    setDoctorAvailability,
    getDoctorAvailability,
    updateDoctorAvailability,
    deleteDoctorAvailability,
    getAvailableTimeSlots
};

