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
    if (status && status.trim() !== "") {
        query.status = status;
    }
    const appointments = await AppointmentModel.find(query)
        .populate("patient", "firstName lastName phoneNumber")
        .sort({ appointmentDate: 1 });
    return appointments.filter((appointment) => Boolean(appointment.patient));
};

var getAppointmentsByPatient = async function(patientId, status = null) {
    const query = { patient: patientId };
    if (status && status.trim() !== "") {
        query.status = status;
    }
    const appointments = await AppointmentModel.find(query)
        .populate("doctor", "firstName lastName specialization officeNumber")
        .sort({ appointmentDate: 1 });
    return appointments.filter((appointment) => Boolean(appointment.doctor));
};

var getAppointmentById = async function(appointmentId) {
    return await AppointmentModel.findById(appointmentId)
        .populate("doctor", "firstName lastName specialization officeNumber phoneNumber")
        .populate("patient", "firstName lastName phoneNumber JMBG");
};

var updateAppointmentStatus = async function(appointmentId, status, options = {}) {
    const updateDoc = {
        $set: {
            status: status,
            updatedAt: new Date()
        }
    };

    if (status === 'canceled') {
        updateDoc.$set.canceledByRole = options.canceledByRole || 'unknown';
        updateDoc.$set.cancellationReason = options.cancellationReason || null;
        if (options.canceledByUser) {
            updateDoc.$set.canceledByUser = options.canceledByUser;
        } else {
            updateDoc.$unset = { canceledByUser: '' };
        }
    } else {
        updateDoc.$unset = {
            canceledByRole: '',
            canceledByUser: '',
            cancellationReason: ''
        };
    }

    return await AppointmentModel.findByIdAndUpdate(
        appointmentId,
        updateDoc,
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

var getAllAppointments = async function() {
    const appointments = await AppointmentModel.find()
        .populate("doctor", "firstName lastName specialization officeNumber")
        .populate("patient", "firstName lastName phoneNumber JMBG")
        .sort({ appointmentDate: -1 });
    return appointments.filter((appointment) => Boolean(appointment.doctor) && Boolean(appointment.patient));
};

var deleteAppointmentsForUser = async function(userId) {
    const appointments = await AppointmentModel.find({
        $or: [
            { doctor: userId },
            { patient: userId }
        ]
    }).select('_id');

    if (appointments.length === 0) {
        return { deletedCount: 0, appointmentIds: [] };
    }

    const appointmentIds = appointments.map((appointment) => appointment._id);
    const UserModel = require("../models/user");

    await UserModel.updateMany(
        { appointments: { $in: appointmentIds } },
        { $pull: { appointments: { $in: appointmentIds } } }
    );

    const deleteResult = await AppointmentModel.deleteMany({
        _id: { $in: appointmentIds }
    });

    return {
        deletedCount: deleteResult.deletedCount || 0,
        appointmentIds
    };
};

var cancelScheduledAppointmentsForUser = async function(userId, options = {}) {
    const query = {
        status: 'scheduled',
        $or: [
            { doctor: userId },
            { patient: userId }
        ]
    };

    const appointmentsToCancel = await AppointmentModel.find(query).select('_id');
    const appointmentIds = appointmentsToCancel.map((appointment) => appointment._id);

    if (appointmentIds.length === 0) {
        return [];
    }

    await AppointmentModel.updateMany(
        { _id: { $in: appointmentIds } },
        {
            $set: {
                status: 'canceled',
                canceledByRole: options.canceledByRole || 'unknown',
                canceledByUser: options.canceledByUser || null,
                cancellationReason: options.cancellationReason || null,
                updatedAt: new Date()
            }
        }
    );

    return await AppointmentModel.find({ _id: { $in: appointmentIds } })
        .populate('doctor', 'firstName lastName')
        .populate('patient', 'firstName lastName')
        .sort({ updatedAt: -1 });
};

module.exports = {
    createAppointment,
    getAppointmentsByDoctor,
    getAppointmentsByPatient,
    getAppointmentById,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment,
    getAllAppointments,
    cancelScheduledAppointmentsForUser,
    deleteAppointmentsForUser
};