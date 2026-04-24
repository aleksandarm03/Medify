/**
 * Notification Event Handler
 * Opće sistema obavijesti za sve korisnike
 */

const connectionManager = require('../managers/connectionManager');

/**
 * Inicijalizira notification event handlers
 */
function setupNotificationHandler(io, socket) {
    /**
     * Prikuplja sve obavijesti za korisnika
     */
    socket.on('notification:fetch', (data) => {
        try {
            const { userId } = data;
            
            if (userId !== socket.userId && socket.userRole !== 'admin') {
                return socket.emit('notification:error', { 
                    message: 'Nemate pristup ovim obavijestima' 
                });
            }

            // Ovdje možete učitati obavijesti iz baze podataka
            socket.emit('notification:list', {
                // Obavijesti će biti učitane iz baze
                messages: [],
                timestamp: new Date()
            });
        } catch (error) {
            console.error('[Notification:fetch] Greška:', error);
        }
    });

    /**
     * Označava obavijesti kao pročitane
     */
    socket.on('notification:mark-read', (data) => {
        try {
            const { notificationIds } = data;
            
            // Ažuriraj u bazi podataka
            socket.emit('notification:marked-read', {
                notificationIds,
                timestamp: new Date()
            });
            
            console.log(`[Notification] Označene kao pročitane: ${notificationIds.length}`);
        } catch (error) {
            console.error('[Notification:mark-read] Greška:', error);
        }
    });

    /**
     * Briše obavijest
     */
    socket.on('notification:delete', (data) => {
        try {
            const { notificationId } = data;
            
            // Obriši iz baze podataka
            socket.emit('notification:deleted', {
                notificationId,
                timestamp: new Date()
            });
            
            console.log(`[Notification] Obavijest obrisana: ${notificationId}`);
        } catch (error) {
            console.error('[Notification:delete] Greška:', error);
        }
    });

    /**
     * Briše sve obavijesti
     */
    socket.on('notification:clear-all', (data) => {
        try {
            socket.emit('notification:all-cleared', {
                timestamp: new Date()
            });
            
            console.log(`[Notification] Sve obavijesti obrisane za ${socket.userId}`);
        } catch (error) {
            console.error('[Notification:clear-all] Greška:', error);
        }
    });
}

/**
 * Globalne obavijesti - Šalje upravitelju
 */
function notifyAdmin(io, message, data = {}) {
    const admins = connectionManager.getOnlineAdmins();
    
    admins.forEach(admin => {
        io.to(admin.socketId).emit('notification:admin-alert', {
            message,
            data,
            severity: data.severity || 'info',
            timestamp: new Date()
        });
    });
    
    console.log(`[AdminNotification] ${message} -> ${admins.length} admina`);
}

/**
 * Obavijesti sve doktore
 */
function notifyAllDoctors(io, message, data = {}) {
    const doctors = connectionManager.getOnlineDoctors();
    
    doctors.forEach(doctor => {
        io.to(doctor.socketId).emit('notification:doctor-alert', {
            message,
            data,
            timestamp: new Date()
        });
    });
    
    console.log(`[DoctorNotification] ${message} -> ${doctors.length} doktora`);
}

/**
 * Obavijesti sve pacijente
 */
function notifyAllPatients(io, message, data = {}) {
    const patients = connectionManager.getOnlinePatients();
    
    patients.forEach(patient => {
        io.to(patient.socketId).emit('notification:patient-alert', {
            message,
            data,
            timestamp: new Date()
        });
    });
    
    console.log(`[PatientNotification] ${message} -> ${patients.length} pacijenata`);
}

/**
 * Specifičnu obavijest korisniku
 */
function notifyUser(io, userId, message, data = {}) {
    const socketId = connectionManager.getSocketId(userId);
    
    if (socketId) {
        io.to(socketId).emit('notification:user-alert', {
            message,
            data,
            timestamp: new Date()
        });
        
        console.log(`[UserNotification] ${message} -> ${userId}`);
    }
}

module.exports = {
    setupNotificationHandler,
    notifyAdmin,
    notifyAllDoctors,
    notifyAllPatients,
    notifyUser
};
