const AppointmentModel=require("../models/appointment");

var createAppointment=async function(body,doctor,patient) {
    return await AppointmentModel.makeAppointment(
        doctor,
        patient,
        body.appointmentDate,
        body.reason
    );
}

var getAppointmentsByDoctor = async function(doctorId, status = null) {
    const query = { doctor: doctorId };
    if (status) {
        query.status = status;
    }
    return await AppointmentModel.find(query)
        .populate("patient", "firstName lastName phoneNumber")
        .sort({ appointmentDate: 1 });
};

var getAppointmentsByPatient = async function(patientId, status = null) {
    const query = { patient: patientId };
    if (status) {
        query.status = status;
    }
    return await AppointmentModel.find(query)
        .populate("doctor", "firstName lastName specialization officeNumber")
        .sort({ appointmentDate: 1 });
};

var getAppointmentById = async function(appointmentId) {
    return await AppointmentModel.findById(appointmentId)
        .populate("doctor", "firstName lastName specialization officeNumber phoneNumber")
        .populate("patient", "firstName lastName phoneNumber JMBG");
};

var updateAppointmentStatus = async function(appointmentId, status) {
    return await AppointmentModel.findByIdAndUpdate(
        appointmentId,
        { 
            $set: { 
                status: status,
                updatedAt: new Date()
            }
        },
        { new: true }
    ).populate("doctor", "firstName lastName")
     .populate("patient", "firstName lastName");
};

var updateAppointment = async function(appointmentId, updateData) {
    updateData.updatedAt = new Date();
    return await AppointmentModel.findByIdAndUpdate(
        appointmentId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate("doctor", "firstName lastName")
     .populate("patient", "firstName lastName");
};

var deleteAppointment = async function(appointmentId) {
    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
        return null;
    }
    
    // Ukloni appointment iz nizova kod doktora i pacijenta
    const UserModel = require("../models/user");
    await UserModel.updateOne(
        { _id: appointment.doctor },
        { $pull: { appointments: appointmentId } }
    );
    await UserModel.updateOne(
        { _id: appointment.patient },
        { $pull: { appointments: appointmentId } }
    );
    
    return await AppointmentModel.findByIdAndDelete(appointmentId);
};

module.exports = {
    createAppointment,
    getAppointmentsByDoctor,
    getAppointmentsByPatient,
    getAppointmentById,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment
};