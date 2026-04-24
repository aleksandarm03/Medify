/**
 * Socket.io Konfiguracija
 * Centralizirana konfiguracija za Socket.io server
 */

const config = {
    cors: {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
};

module.exports = config;
