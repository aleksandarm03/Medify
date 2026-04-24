/**
 * Doctor Availability Event Handler
 * Real-time dostupnost doktora
 */

const connectionManager = require('../managers/connectionManager');

/**
 * Inicijalizira doctor availability event handlers
 */
function setupDoctorAvailabilityHandler(io, socket) {
    /**
     * Doktor ažurira svoju dostupnost
     */
    socket.on('doctor:availability-updated', (data) => {
        try {
            const { doctorId, availabilitySchedule, status } = data;
            
            // Provjera je li doktor koji jeUpdatao
            if (doctorId !== socket.userId) {
                return socket.emit('notification:error', { 
                    message: 'Samo doktor može ažurirati svoju dostupnost' 
                });
            }

            // Obavijesti sve online korisnike (pacijente) o dostupnosti
            io.emit('notification:doctor-availability-changed', {
                doctorId,
                status, // 'available', 'busy', 'offline'
                availabilitySchedule,
                timestamp: new Date()
            });

            console.log(`[DoctorAvailability] Doktor ${doctorId} ažurio dostupnost: ${status}`);
        } catch (error) {
            console.error('[DoctorAvailability:updated] Greška:', error);
        }
    });

    /**
     * Doktor je sada dostupan (online)
     */
    socket.on('doctor:online', (data) => {
        try {
            const { doctorId } = data;
            
            io.emit('notification:doctor-online', {
                doctorId,
                email: socket.email,
                timestamp: new Date()
            });

            console.log(`[DoctorAvailability] Doktor ${doctorId} je online`);
        } catch (error) {
            console.error('[DoctorAvailability:online] Greška:', error);
        }
    });

    /**
     * Doktor je sada nedostupan (offline)
     */
    socket.on('doctor:offline', (data) => {
        try {
            const { doctorId } = data;
            
            io.emit('notification:doctor-offline', {
                doctorId,
                timestamp: new Date()
            });

            console.log(`[DoctorAvailability] Doktor ${doctorId} je offline`);
        } catch (error) {
            console.error('[DoctorAvailability:offline] Greška:', error);
        }
    });

    /**
     * Doktor započinje pregled - zablokira termin
     */
    socket.on('doctor:appointment-started', (data) => {
        try {
            const { doctorId, appointmentId, patientId } = data;
            
            io.emit('notification:appointment-in-progress', {
                doctorId,
                appointmentId,
                patientId,
                timestamp: new Date()
            });

            console.log(`[DoctorAvailability] Doktor ${doctorId} je počeo pregled ${appointmentId}`);
        } catch (error) {
            console.error('[DoctorAvailability:appointment-started] Greška:', error);
        }
    });

    /**
     * Doktor završava pregled
     */
    socket.on('doctor:appointment-completed', (data) => {
        try {
            const { doctorId, appointmentId, notes } = data;
            
            io.emit('notification:appointment-completed', {
                doctorId,
                appointmentId,
                notes,
                timestamp: new Date()
            });

            console.log(`[DoctorAvailability] Doktor ${doctorId} je završio pregled ${appointmentId}`);
        } catch (error) {
            console.error('[DoctorAvailability:appointment-completed] Greška:', error);
        }
    });

    /**
     * Zahtjev za video poziva
     */
    socket.on('doctor:video-call-request', (data) => {
        try {
            const { patientId, appointmentId } = data;
            const patientSocketId = connectionManager.getSocketId(patientId);
            
            if (patientSocketId) {
                io.to(patientSocketId).emit('notification:video-call-incoming', {
                    doctorId: socket.userId,
                    appointmentId,
                    timestamp: new Date()
                });

                console.log(`[VideoCall] Zahtjev od doktora ${socket.userId} prema pacijentu ${patientId}`);
            }
        } catch (error) {
            console.error('[DoctorAvailability:video-call-request] Greška:', error);
        }
    });

    /**
     * Pacijent prihvata video poziva
     */
    socket.on('patient:video-call-accepted', (data) => {
        try {
            const { doctorId, appointmentId } = data;
            const doctorSocketId = connectionManager.getSocketId(doctorId);
            
            if (doctorSocketId) {
                io.to(doctorSocketId).emit('notification:video-call-accepted', {
                    patientId: socket.userId,
                    appointmentId,
                    timestamp: new Date()
                });

                console.log(`[VideoCall] Pacijent ${socket.userId} je prihvatio poziv`);
            }
        } catch (error) {
            console.error('[DoctorAvailability:video-call-accepted] Greška:', error);
        }
    });

    /**
     * Pacijent odbija video poziva
     */
    socket.on('patient:video-call-rejected', (data) => {
        try {
            const { doctorId, appointmentId, reason } = data;
            const doctorSocketId = connectionManager.getSocketId(doctorId);
            
            if (doctorSocketId) {
                io.to(doctorSocketId).emit('notification:video-call-rejected', {
                    patientId: socket.userId,
                    appointmentId,
                    reason,
                    timestamp: new Date()
                });

                console.log(`[VideoCall] Pacijent ${socket.userId} je odbio poziv`);
            }
        } catch (error) {
            console.error('[DoctorAvailability:video-call-rejected] Greška:', error);
        }
    });
}

/**
 * Obavijesti sve korisnike o dostupnim doktorima
 */
function broadcastAvailableDoctors(io, doctors) {
    io.emit('notification:available-doctors', {
        doctors,
        timestamp: new Date()
    });
    
    console.log(`[Broadcast] Dostupni doktori: ${doctors.length}`);
}

module.exports = {
    setupDoctorAvailabilityHandler,
    broadcastAvailableDoctors
};
