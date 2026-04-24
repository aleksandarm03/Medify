/**
 * Socket.io Middleware
 * Autentizacija i validacija socket konekcija
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware za verifikaciju JWT tokena
 */
const socketAuthMiddleware = (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Token nije pronađen'));
        }

        // Verifikuj token
        const decoded = jwt.verify(token, config.secret);

        const resolvedUserId = decoded.userId || decoded._id;
        const resolvedRole = decoded.role;
        const resolvedEmail = decoded.email || null;

        if (!resolvedUserId || !resolvedRole) {
            return next(new Error('Autentizacija neuspješna: nedostaju obavezni podaci u tokenu'));
        }
        
        // Spremi korisnika u socket objekat
        socket.userId = String(resolvedUserId);
        socket.userRole = resolvedRole;
        socket.email = resolvedEmail;
        
        next();
    } catch (error) {
        next(new Error(`Autentizacija neuspješna: ${error.message}`));
    }
};

/**
 * Logger middleware za debug
 */
const socketLoggerMiddleware = (socket, next) => {
    console.log(`[Socket] Korisnik ${socket.userId} (${socket.userRole}) je povezan. ID: ${socket.id}`);
    next();
};

module.exports = {
    socketAuthMiddleware,
    socketLoggerMiddleware
};
