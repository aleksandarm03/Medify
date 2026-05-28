/**
 * Socket Event Emitter Service
 * Utility za emitovanje Socket.io događaja iz servisa
 */

const connectionManager = require('./managers/connectionManager');

let io = null;

/**
 * Inicijalizira Socket.io instancu (poziva se iz index.js)
 */
function setIO(socketIO) {
    io = socketIO;
}

/**
 * Enitlje event appointment kreirani
 */
function emitAppointmentCreated(doctorId, appointmentDetails) {
    if (io) {
        const socket = findSocketByUserId(String(doctorId));

        if (socket) {
            io.to(socket.id).emit('notification:appointment-created', {
                message: `Novi termin od pacijenta ${appointmentDetails.patientName || ''}`.trim(),
                appointment: appointmentDetails,
                type: 'appointment_created',
                timestamp: new Date()
            });

            console.log(`[SocketEmitter] notification:appointment-created -> doctor ${doctorId}`);
        } else {
            console.log(`[SocketEmitter] Doktor ${doctorId} nije online za appointment-created`);
        }
    }
}

/**
 * Emituje promjenu statusa termina
 */
function emitAppointmentStatusUpdated(appointment) {
    if (io) {
        const appt = appointment || {};
        const payload = {
            appointmentId: String(appt._id || appt.appointmentId || ''),
            patientId: String((appt.patient && appt.patient._id) || appt.patientId || ''),
            patientName: (appt.patient && `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim()) || appt.patientName || '',
            doctorId: String((appt.doctor && appt.doctor._id) || appt.doctorId || ''),
            doctorName: (appt.doctor && `${appt.doctor.firstName || ''} ${appt.doctor.lastName || ''}`.trim()) || appt.doctorName || '',
            appointmentDate: appt.appointmentDate || appt.date || null,
            newStatus: appt.status || appt.newStatus || '',
            cancellationReason: appt.cancellationReason || appt.reason || '',
            type: 'appointment_status_changed',
            timestamp: new Date()
        };

        const patientSocket = findSocketByUserId(String(payload.patientId));
        const doctorSocket = findSocketByUserId(String(payload.doctorId));

        if (patientSocket) {
            io.to(patientSocket.id).emit('notification:appointment-updated', payload);
        }

        if (doctorSocket) {
            io.to(doctorSocket.id).emit('notification:appointment-updated', payload);
        }

        if (patientSocket || doctorSocket) {
            console.log(`[SocketEmitter] notification:appointment-updated -> doctor ${payload.doctorId}, patient ${payload.patientId}, status ${payload.newStatus}`);
        } else {
            console.log(`[SocketEmitter] Niko online za appointment-updated (${payload.appointmentId})`);
        }
    }
}

/**
 * Emituje dodanu recept
 */
function emitPrescriptionAdded(patientId, doctorId, prescriptionDetails) {
    if (io) {
        io.emit('appointment:prescription-added', {
            patientId,
            doctorId,
            prescriptionDetails,
            timestamp: new Date()
        });
    }
}

/**
 * Emituje ažuriranu medicinsku kartonu
 */
function emitMedicalRecordUpdated(patientId, doctorId, recordDetails) {
    if (io) {
        io.emit('appointment:medical-record-updated', {
            patientId,
            doctorId,
            recordDetails,
            timestamp: new Date()
        });
    }
}

/**
 * Emituje poraku od pacijenta
 */
function emitPatientMessage(doctorId, patientId, message) {
    if (io) {
        io.emit('appointment:patient-message', {
            doctorId,
            patientId,
            message,
            timestamp: new Date()
        });
    }
}

/**
 * Šalje direct obavijest korisniku
 */
function notifyUser(userId, message, data = {}, type = 'info') {
    if (io) {
        // Pronađi socket id korisnika kroz io.sockets
        const socket = findSocketByUserId(userId);
        if (socket) {
            io.to(socket.id).emit('notification:user-alert', {
                message,
                data,
                type,
                timestamp: new Date()
            });
        }
    }
}

/**
 * Pronalazi socket na osnovu korisničkog ID-a
 */
function findSocketByUserId(userId) {
    if (!io) return null;
    
    for (const [, socket] of io.of('/').sockets) {
        if (socket.userId === userId) {
            return socket;
        }
    }
    return null;
}

/**
 * Šalje obavijest svim doktorima
 */
function notifyAllDoctors(message, data = {}) {
    if (io) {
        io.emit('notification:broadcast', {
            message,
            data,
            targetRole: 'doctor',
            timestamp: new Date()
        });
    }
}

/**
 * Šalje obavijest svim pacijentima
 */
function notifyAllPatients(message, data = {}) {
    if (io) {
        io.emit('notification:broadcast', {
            message,
            data,
            targetRole: 'patient',
            timestamp: new Date()
        });
    }
}

/**
 * Šalje obavijest svim adminerima
 */
function notifyAllAdmins(message, data = {}) {
    if (io) {
        const admins = connectionManager.getOnlineAdmins();

        admins.forEach((admin) => {
            io.to(admin.socketId).emit('notification:admin-alert', {
                message,
                data,
                type: data.type || 'info',
                timestamp: new Date()
            });
        });

        console.log(`[SocketEmitter] notification:admin-alert -> ${admins.length} admina`);
    }
}

module.exports = {
    setIO,
    emitAppointmentCreated,
    emitAppointmentStatusUpdated,
    emitPrescriptionAdded,
    emitMedicalRecordUpdated,
    emitPatientMessage,
    notifyUser,
    notifyAllDoctors,
    notifyAllPatients,
    notifyAllAdmins,
    findSocketByUserId
};
