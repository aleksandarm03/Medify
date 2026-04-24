/**
 * Socket.io Server Inicijalizacija
 * Centralna točka za inicijalizaciju svih socket event handlera
 */

const socketIO = require('socket.io');
const config = require('./config');
const { socketAuthMiddleware, socketLoggerMiddleware } = require('./middleware');
const connectionManager = require('./managers/connectionManager');
const { setupAppointmentHandler } = require('./handlers/appointmentHandler');
const { setupMessageHandler } = require('./handlers/messageHandler');
const { setupNotificationHandler } = require('./handlers/notificationHandler');
const { setupDoctorAvailabilityHandler } = require('./handlers/doctorAvailabilityHandler');
const socketEmitter = require('./socketEmitter');

/**
 * Inicijalizira Socket.io server
 * @param {http.Server} httpServer - Express server sa HTTP podrškom
 */
function initializeSocket(httpServer) {
    // Kreiraj Socket.io instancu
    const io = socketIO(httpServer, config);

    // Inicijalizira socketEmitter sa io instancom
    socketEmitter.setIO(io);

    // Primijeni middleware
    io.use(socketAuthMiddleware);
    io.use(socketLoggerMiddleware);

    // Handler za nove konekcije
    io.on('connection', (socket) => {
        // Registrira korisnika kao online
        connectionManager.addConnection(
            socket.id,
            socket.userId,
            socket.userRole,
            socket.email
        );

        // Emituje listu aktivnih korisnika
        broadcastActiveUsers(io);

        // Postavi sve event handlere
        setupAppointmentHandler(io, socket);
        setupMessageHandler(io, socket);
        setupNotificationHandler(io, socket);
        setupDoctorAvailabilityHandler(io, socket);

        // Handler za disconnect
        socket.on('disconnect', () => {
            connectionManager.removeConnection(socket.id);
            broadcastActiveUsers(io);
            console.log(`[Socket] Korisnik ${socket.userId} je odspojio`);
        });

        // Handler za error greške
        socket.on('error', (error) => {
            console.error(`[Socket Error] ${socket.userId}:`, error);
        });

        // Handler za custom sisteme event
        socket.on('system:ping', (callback) => {
            connectionManager.updateActivity(socket.id);
            callback({ pong: true, timestamp: new Date() });
        });
    });

    // Periodički čisti neaktivne konekcije
    setInterval(() => {
        const removed = connectionManager.cleanupInactiveConnections();
        if (removed > 0) {
            console.log(`[Socket] Očišćene ${removed} neaktivne konekcije`);
        }
    }, 5 * 60 * 1000); // Svakih 5 minuta

    console.log('[Socket.io] Server inicijaliziran uspješno');

    return io;
}

/**
 * Emituje listu aktivnih korisnika svima
 */
function broadcastActiveUsers(io) {
    const activeUsers = connectionManager.getActiveUsers();
    
    io.emit('system:active-users-updated', {
        count: activeUsers.length,
        users: activeUsers.map(u => ({
            userId: u.userId,
            role: u.role,
            email: u.email,
            connectedAt: u.connectedAt
        })),
        timestamp: new Date()
    });
}

module.exports = {
    initializeSocket,
    broadcastActiveUsers,
    socketEmitter
};
