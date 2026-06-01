/**
 * Appointment Event Handler
 * Real-time obavijesti za termine
 */

const connectionManager = require('../managers/connectionManager');
const UserModel = require('../../models/user');

/**
 * Inicijalizira appointment event handlers
 */
function setupAppointmentHandler(io, socket) {
    /**
     * Obavijesti doktoru da je novi termin rezerviran
     * Koristi se iz appointment service
     */
    socket.on('appointment:created', (data) => {
        try {
            const { doctorId, appointmentDetails } = data;
            const doctorSocketId = connectionManager.getSocketId(doctorId);

            if (doctorSocketId) {
                io.to(doctorSocketId).emit('notification:appointment-created', {
                    message: `Novi termin od pacijenta ${appointmentDetails.patientName}`,
                    appointment: appointmentDetails,
                    type: 'appointment_created',
                    timestamp: new Date()
                });

                console.log(`[Appointment] Doktor ${doctorId} obaviješten o novom terminu`);
            }

            // Obavijesti pacijenta
            socket.emit('notification:success', {
                message: 'Termin uspješno rezerviran',
                timestamp: new Date()
            });
        } catch (error) {
            console.error('[Appointment:created] Greška:', error);
            socket.emit('notification:error', { message: 'Greška pri rezervaciji termina' });
        }
    });

    /**
     * Obavijest kada doktor ažurira status termina
     */
    socket.on('appointment:status-updated', (data) => {
        try {
            const { appointmentId, patientId, doctorId, newStatus, reason } = data;
            const patientSocketId = connectionManager.getSocketId(patientId);

            const statusMessages = {
                'confirmed': 'Vaš termin je potvrđen',
                'cancelled': `Vaš termin je otkazan. Razlog: ${reason || 'Bez specifikacije'}`,
                'completed': 'Termin je završen',
                'rescheduled': 'Termin je prebačen na drugo vrijeme'
            };

            if (patientSocketId) {
                io.to(patientSocketId).emit('notification:appointment-updated', {
                    message: statusMessages[newStatus] || 'Status termina se promijenio',
                    appointmentId,
                    newStatus,
                    type: 'appointment_status_changed',
                    timestamp: new Date()
                });

                console.log(`[Appointment] Pacijent ${patientId} obaviješten o promjeni statusa`);
            }
        } catch (error) {
            console.error('[Appointment:status-updated] Greška:', error);
        }
    });

    /**
     * Obavijest o novom recceptu
     */
    socket.on('appointment:prescription-added', async (data) => {
        try {
            const { patientId, doctorId, prescriptionDetails } = data;
            const patientSocketId = connectionManager.getSocketId(patientId);

            // Attempt to get doctor name for more informative notification
            let doctorName = '';
            try {
                const doctor = await UserModel.findById(doctorId).select('firstName lastName');
                if (doctor) {
                    doctorName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');
                }
            } catch (err) {
                // ignore lookup errors
            }

            const prescriptionSummary = Array.isArray(prescriptionDetails?.items)
                ? prescriptionDetails.items.map(i => i.name || i).slice(0,5).join(', ')
                : (prescriptionDetails?.summary || prescriptionDetails?.note || '');

            if (patientSocketId) {
                io.to(patientSocketId).emit('notification:prescription-added', {
                    message: `Doktor ${doctorName || ''} je dodao recept za vas`.trim(),
                    doctorId,
                    doctorName,
                    prescription: prescriptionDetails,
                    prescriptionSummary,
                    type: 'prescription_added',
                    timestamp: new Date()
                });

                console.log(`[Prescription] Pacijent ${patientId} obaviješten o novom receptu`);
            }
        } catch (error) {
            console.error('[Appointment:prescription-added] Greška:', error);
        }
    });

    /**
     * Obavijest o medičinskom kartonu
     */
    socket.on('appointment:medical-record-updated', async (data) => {
        try {
            const { patientId, doctorId, recordDetails } = data;
            const patientSocketId = connectionManager.getSocketId(patientId);

            let doctorName = '';
            try {
                const doctor = await UserModel.findById(doctorId).select('firstName lastName');
                if (doctor) doctorName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');
            } catch (err) {}

            const recordSummary = recordDetails?.summary || recordDetails?.note || '';

            if (patientSocketId) {
                io.to(patientSocketId).emit('notification:medical-record-updated', {
                    message: `Doktor ${doctorName || ''} je ažurirao vašu medicinsku kartonu`.trim(),
                    doctorId,
                    doctorName,
                    record: recordDetails,
                    recordSummary,
                    type: 'medical_record_updated',
                    timestamp: new Date()
                });

                console.log(`[MedicalRecord] Pacijent ${patientId} obaviješten`);
            }
        } catch (error) {
            console.error('[Appointment:medical-record-updated] Greška:', error);
        }
    });

    /**
     * Obavijest doktoru o novoj poracci od pacijenta
     */
    socket.on('appointment:patient-message', async (data) => {
        try {
            const { doctorId, patientId, message } = data;
            const doctorSocketId = connectionManager.getSocketId(doctorId);

            let patientName = '';
            try {
                const patient = await UserModel.findById(patientId).select('firstName lastName');
                if (patient) patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ');
            } catch (err) {}

            const snippet = typeof message === 'string' ? message.substring(0, 120) : '';

            if (doctorSocketId) {
                io.to(doctorSocketId).emit('notification:patient-message', {
                    message: `Nova poruka od pacijenta ${patientName || ''}`.trim(),
                    patientId,
                    patientName,
                    content: message,
                    snippet,
                    type: 'patient_message',
                    timestamp: new Date()
                });

                console.log(`[Message] Doktor ${doctorId} obaviješten`);
            }
        } catch (error) {
            console.error('[Appointment:patient-message] Greška:', error);
        }
    });
}

module.exports = {
    setupAppointmentHandler
};
