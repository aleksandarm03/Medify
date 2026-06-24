/**
 * Socket Event Emitter Service
 * Utility za emitovanje Socket.io događaja iz servisa
 */

const connectionManager = require('./managers/connectionManager');
const { buildAppointmentStatusMessage } = require('./appointmentNotificationMessages');
const {
    buildPrescriptionNotificationMessage,
    getDoctorName,
    getMedicationNamesSummary,
    getNotificationTitle
} = require('./prescriptionNotificationMessages');

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
        // Accept either the new object shape or the old positional args for backward compatibility
        let appt = appointment || {};
        if (typeof appt !== 'object' || appt === null) {
            // nothing to emit
            return;
        }

        const patientId = String((appt.patient && appt.patient._id) || appt.patientId || '');
        const doctorId = String((appt.doctor && appt.doctor._id) || appt.doctorId || '');
        const canceledByUserRaw = appt.canceledByUser || appt.canceledByUserId || null;
        const canceledByUserId = canceledByUserRaw && typeof canceledByUserRaw === 'object' && canceledByUserRaw._id
            ? String(canceledByUserRaw._id)
            : (canceledByUserRaw ? String(canceledByUserRaw) : null);

        const basePayload = {
            appointmentId: String(appt._id || appt.appointmentId || ''),
            patientId,
            patientName: (appt.patient && `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim()) || appt.patientName || '',
            doctorId,
            doctorName: (appt.doctor && `${appt.doctor.firstName || ''} ${appt.doctor.lastName || ''}`.trim()) || appt.doctorName || '',
            appointmentDate: appt.appointmentDate || appt.date || null,
            serviceName: appt.reason || '',
            reason: appt.reason || '',
            newStatus: appt.status || appt.newStatus || '',
            canceledByRole: appt.canceledByRole || appt.canceledBy || null,
            canceledByUser: canceledByUserId,
            cancellationReason: appt.cancellationReason || null,
            type: 'appointment_status_changed',
            timestamp: new Date()
        };

        const patientSocket = findSocketByUserId(patientId);
        const doctorSocket = findSocketByUserId(doctorId);

        if (patientSocket) {
            const patientMessage = buildAppointmentStatusMessage('patient', appt, patientId);
            io.to(patientSocket.id).emit('notification:appointment-updated', {
                ...basePayload,
                message: patientMessage || 'Status termina je ažuriran.'
            });
        }

        if (doctorSocket) {
            const doctorMessage = buildAppointmentStatusMessage('doctor', appt, doctorId);
            io.to(doctorSocket.id).emit('notification:appointment-updated', {
                ...basePayload,
                message: doctorMessage || 'Status termina je ažuriran.'
            });
        }

        if (patientSocket || doctorSocket) {
            console.log(`[SocketEmitter] notification:appointment-updated -> doctor ${doctorId}, patient ${patientId}, status ${basePayload.newStatus}`);
        } else {
            console.log(`[SocketEmitter] Niko online za appointment-updated (${basePayload.appointmentId})`);
        }
    }
}

/**
 * Obaveštenje pacijentu o promeni recepta (kreiranje, lek, završetak...)
 */
function emitPrescriptionPatientNotification(prescription, action, options = {}) {
    if (!io || !prescription) {
        return;
    }

    const patientId = String(
        (prescription.patient && prescription.patient._id) ||
        prescription.patient ||
        options.patientId ||
        ''
    );

    if (!patientId) {
        return;
    }

    const message = buildPrescriptionNotificationMessage(action, prescription, options);
    const payload = {
        action,
        patientId,
        doctorId: String(
            (prescription.doctor && prescription.doctor._id) ||
            prescription.doctor ||
            options.doctorId ||
            ''
        ),
        doctorName: getDoctorName(prescription, options.doctor),
        prescriptionId: String(prescription._id || ''),
        medicationName: options.medicationName || '',
        medicalRecordDiagnosis: options.medicalRecordDiagnosis || '',
        hasMedicalRecord: Boolean(options.hasMedicalRecord || prescription.medicalRecord),
        prescriptionSummary: getMedicationNamesSummary(prescription.medications || []),
        title: getNotificationTitle(action),
        message,
        type: 'prescription_updated',
        timestamp: new Date()
    };

    const patientSocket = findSocketByUserId(patientId);

    if (patientSocket) {
        io.to(patientSocket.id).emit('notification:prescription-updated', payload);
        console.log(`[SocketEmitter] notification:prescription-updated (${action}) -> patient ${patientId}`);
    } else {
        console.log(`[SocketEmitter] Pacijent ${patientId} nije online za prescription-updated (${action})`);
    }
}

/**
 * @deprecated Koristiti emitPrescriptionPatientNotification(prescription, 'created', ...)
 */
function emitPrescriptionAdded(patientId, doctorId, prescriptionDetails) {
    emitPrescriptionPatientNotification(
        prescriptionDetails || { patient: patientId, doctor: doctorId },
        'created',
        { doctor: { firstName: '', lastName: '', ...prescriptionDetails } }
    );
}

function resolveId(value) {
    if (!value) {
        return '';
    }
    if (typeof value === 'object' && value._id) {
        return String(value._id);
    }
    return String(value);
}

function resolveDoctorName(recordDetails = {}) {
    if (recordDetails.doctorName) {
        return recordDetails.doctorName;
    }

    const doctor = recordDetails.doctor;
    if (doctor && typeof doctor === 'object') {
        const name = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
        if (name) {
            return name;
        }
    }

    const snapshot = recordDetails.doctorSnapshot;
    if (snapshot) {
        const name = `${snapshot.firstName || ''} ${snapshot.lastName || ''}`.trim();
        if (name) {
            return name;
        }
    }

    return 'Doktor';
}

function resolveRecordSummary(recordDetails = {}, action = 'updated', options = {}) {
    if (options.recordSummary) {
        return options.recordSummary;
    }
    if (action === 'lab_result_added' && options.testName) {
        return `dodat laboratorijski rezultat: ${options.testName}`;
    }
    if (recordDetails.diagnosis) {
        return `dijagnoza: ${recordDetails.diagnosis}`;
    }
    return '';
}

function buildMedicalRecordMessage(action, doctorName, summary) {
    const summarySuffix = summary ? ` (${summary})` : '';
    if (action === 'created') {
        return `Doktor ${doctorName} je kreirao vaš medicinski karton${summarySuffix}.`;
    }
    if (action === 'lab_result_added') {
        return `Doktor ${doctorName} je dodao laboratorijski rezultat u vaš medicinski karton${summarySuffix}.`;
    }
    return `Doktor ${doctorName} je ažurirao vaš medicinski karton${summarySuffix}.`;
}

function getMedicalRecordTitle(action) {
    if (action === 'created') {
        return 'Novi medicinski karton';
    }
    if (action === 'lab_result_added') {
        return 'Novi laboratorijski rezultat';
    }
    return 'Ažuriranje kartona';
}

/**
 * Emituje obaveštenje pacijentu o kreiranju ili izmeni medicinskog kartona.
 */
function emitMedicalRecordUpdated(patientId, doctorId, recordDetails = {}, action = 'updated', options = {}) {
    if (!io) {
        return;
    }

    const resolvedPatientId = String(patientId || resolveId(recordDetails.patient) || recordDetails.patientId || '');
    if (!resolvedPatientId) {
        return;
    }

    const resolvedDoctorId = String(doctorId || resolveId(recordDetails.doctor) || recordDetails.doctorId || '');
    const patientSocket = findSocketByUserId(resolvedPatientId);
    const doctorName = resolveDoctorName(recordDetails);
    const recordSummary = resolveRecordSummary(recordDetails, action, options);
    const message = buildMedicalRecordMessage(action, doctorName, recordSummary);

    if (patientSocket) {
        io.to(patientSocket.id).emit('notification:medical-record-updated', {
            action,
            patientId: resolvedPatientId,
            doctorId: resolvedDoctorId,
            doctorName,
            recordId: String(recordDetails._id || recordDetails.recordId || ''),
            recordSummary,
            recordDetails,
            title: getMedicalRecordTitle(action),
            message,
            type: 'medical_record_updated',
            timestamp: new Date()
        });
        console.log(`[SocketEmitter] notification:medical-record-updated (${action}) -> patient ${resolvedPatientId}`);
    } else {
        console.log(`[SocketEmitter] Pacijent ${resolvedPatientId} nije online za medical-record-updated (${action})`);
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
function notifyAllAdmins(message, data = {}, excludeUserId = null) {
    if (io) {
        const admins = connectionManager.getOnlineAdmins();

        admins.forEach((admin) => {
            if (excludeUserId && String(admin.userId) === String(excludeUserId)) {
                return;
            }

            io.to(admin.socketId).emit('notification:admin-alert', {
                message,
                data,
                type: data.type || 'info',
                timestamp: new Date()
            });
        });

        const recipientCount = excludeUserId
            ? admins.filter((admin) => String(admin.userId) !== String(excludeUserId)).length
            : admins.length;

        console.log(`[SocketEmitter] notification:admin-alert -> ${recipientCount} admina`);
    }
}

module.exports = {
    setIO,
    emitAppointmentCreated,
    emitAppointmentStatusUpdated,
    emitPrescriptionAdded,
    emitPrescriptionPatientNotification,
    emitMedicalRecordUpdated,
    emitPatientMessage,
    notifyUser,
    notifyAllDoctors,
    notifyAllPatients,
    notifyAllAdmins,
    findSocketByUserId
};
