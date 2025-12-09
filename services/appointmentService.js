const AppointmentModel=require("../models/appointment");

var createAppointment=async function(body,doctor,patient) {
    return await AppointmentModel.makeAppointment(
        doctor,
        patient,
        body.appointmentDate,
        body.reason
    );
}

module.exports = {
    createAppointment
};