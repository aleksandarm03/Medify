/**
 * Appointment Event Handler
 * Real-time obavijesti za termine
 */

const connectionManager = require('../managers/connectionManager');

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
    socket.on('appointment:prescription-added', (data) => {
        try {
            const { patientId, doctorId, prescriptionDetails } = data;
            const patientSocketId = connectionManager.getSocketId(patientId);

            if (patientSocketId) {
                io.to(patientSocketId).emit('notification:prescription-added', {
                    message: 'Doktor je dodao naslov za vas',
                    prescription: prescriptionDetails,
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
    socket.on('appointment:medical-record-updated', (data) => {
        try {
            const { patientId, doctorId, recordDetails } = data;
            const patientSocketId = connectionManager.getSocketId(patientId);

            if (patientSocketId) {
                io.to(patientSocketId).emit('notification:medical-record-updated', {
                    message: 'Doktor je ažurirao vašu medicinsku kartonu',
                    record: recordDetails,
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
    socket.on('appointment:patient-message', (data) => {
        try {
            const { doctorId, patientId, message } = data;
            const doctorSocketId = connectionManager.getSocketId(doctorId);

            if (doctorSocketId) {
                io.to(doctorSocketId).emit('notification:patient-message', {
                    message: `Nova poraka od pacijenta`,
                    patientId,
                    content: message,
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
