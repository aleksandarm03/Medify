/**
 * Connection Manager
 * Upravljanje aktivnim korisničkim konekcijama
 */

class ConnectionManager {
    constructor() {
        // Map: userId -> {socketId, role, email, connectedAt}
        this.activeUsers = new Map();
        // Map: socketId -> userId
        this.socketToUser = new Map();
    }

    /**
     * Registrira novu konekciju
     */
    addConnection(socketId, userId, role, email) {
        this.activeUsers.set(userId, {
            socketId,
            role,
            email,
            connectedAt: new Date(),
            lastActivity: new Date()
        });
        
        this.socketToUser.set(socketId, userId);
        
        console.log(`[ConnectionManager] Dodan: ${userId} (${socketId})`);
    }

    /**
     * Uklanja konekciju
     */
    removeConnection(socketId) {
        const userId = this.socketToUser.get(socketId);
        
        if (userId) {
            this.activeUsers.delete(userId);
            this.socketToUser.delete(socketId);
            console.log(`[ConnectionManager] Uklonjen: ${userId}`);
        }
    }

    /**
     * Vraća socket ID korisnika
     */
    getSocketId(userId) {
        const user = this.activeUsers.get(userId);
        return user ? user.socketId : null;
    }

    /**
     * Vraća sve aktivne korisnike
     */
    getActiveUsers() {
        return Array.from(this.activeUsers.entries()).map(([userId, data]) => ({
            userId,
            ...data
        }));
    }

    /**
     * Vraća sve korisnike određene uloge
     */
    getUsersByRole(role) {
        return Array.from(this.activeUsers.entries())
            .filter(([_, data]) => data.role === role)
            .map(([userId, data]) => ({ userId, ...data }));
    }

    /**
     * Provjerava je li korisnik online
     */
    isUserOnline(userId) {
        return this.activeUsers.has(userId);
    }

    /**
     * Ažurira vremenske oznake aktivnosti
     */
    updateActivity(socketId) {
        const userId = this.socketToUser.get(socketId);
        
        if (userId && this.activeUsers.has(userId)) {
            const user = this.activeUsers.get(userId);
            user.lastActivity = new Date();
        }
    }

    /**
     * Vraća broj aktivnih korisnika
     */
    getActiveUserCount() {
        return this.activeUsers.size;
    }

    /**
     * Pronalazi sve doktore online
     */
    getOnlineDoctors() {
        return this.getUsersByRole('doctor');
    }

    /**
     * Pronalazi sve pacijente online
     */
    getOnlinePatients() {
        return this.getUsersByRole('patient');
    }

    /**
     * Pronalazi sve admire online
     */
    getOnlineAdmins() {
        return this.getUsersByRole('admin');
    }

    /**
     * Čisti konekcije starije od X minuta
     */
    cleanupInactiveConnections(thresholdMinutes = 30) {
        const now = new Date();
        const threshold = thresholdMinutes * 60 * 1000;
        let removed = 0;

        for (const [userId, data] of this.activeUsers.entries()) {
            if (now - data.lastActivity > threshold) {
                this.activeUsers.delete(userId);
                this.socketToUser.delete(data.socketId);
                removed++;
                console.log(`[ConnectionManager] Čišćenje: ${userId}`);
            }
        }

        return removed;
    }
}

// Singleton instanca
const connectionManager = new ConnectionManager();

module.exports = connectionManager;
