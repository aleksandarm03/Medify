/**
 * Message Event Handler
 * Real-time direktne poruke między korisnicima
 */

const connectionManager = require('../managers/connectionManager');

/**
 * Inicijalizira message event handlers
 */
function setupMessageHandler(io, socket) {
    /**
     * Kreira chat sobu između dva korisnika
     */
    socket.on('chat:join-room', (data) => {
        try {
            const { otherUserId } = data;
            const roomId = [socket.userId, otherUserId].sort().join('_');
            
            socket.join(roomId);
            console.log(`[Chat] Korisnik ${socket.userId} se pridružio sobi ${roomId}`);
            
            // Obavijesta drugog korisnika da je netko ušao
            io.to(roomId).emit('chat:user-joined', {
                userId: socket.userId,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('[Chat:join-room] Greška:', error);
        }
    });

    /**
     * Šalje poruku drugom korisniku u realnom vremenu
     */
    socket.on('chat:send-message', (data) => {
        try {
            const { recipientId, message, appointmentId } = data;
            const roomId = [socket.userId, recipientId].sort().join('_');
            
            const messageData = {
                senderId: socket.userId,
                senderRole: socket.userRole,
                senderEmail: socket.email,
                recipientId,
                message,
                appointmentId,
                timestamp: new Date(),
                read: false
            };

            // Šalje poruku svima u sobi
            io.to(roomId).emit('chat:message-received', messageData);
            
            console.log(`[Chat] Poruka od ${socket.userId} prema ${recipientId}`);
        } catch (error) {
            console.error('[Chat:send-message] Greška:', error);
            socket.emit('notification:error', { message: 'Greška pri slanju poruke' });
        }
    });

    /**
     * Obavijesta da je poruka pročitana
     */
    socket.on('chat:message-read', (data) => {
        try {
            const { messageId, recipientId } = data;
            const roomId = [socket.userId, recipientId].sort().join('_');
            
            io.to(roomId).emit('chat:message-marked-read', {
                messageId,
                readBy: socket.userId,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('[Chat:message-read] Greška:', error);
        }
    });

    /**
     * Obavijesta da je korisnik kucajući poruku
     */
    socket.on('chat:typing', (data) => {
        try {
            const { recipientId } = data;
            const otherUserSocketId = connectionManager.getSocketId(recipientId);
            
            if (otherUserSocketId) {
                io.to(otherUserSocketId).emit('chat:user-typing', {
                    userId: socket.userId,
                    userEmail: socket.email,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('[Chat:typing] Greška:', error);
        }
    });

    /**
     * Obavijesta da je korisnik prestao kucati
     */
    socket.on('chat:typing-stopped', (data) => {
        try {
            const { recipientId } = data;
            const otherUserSocketId = connectionManager.getSocketId(recipientId);
            
            if (otherUserSocketId) {
                io.to(otherUserSocketId).emit('chat:user-typing-stopped', {
                    userId: socket.userId,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('[Chat:typing-stopped] Greška:', error);
        }
    });

    /**
     * Napušta chat sobu
     */
    socket.on('chat:leave-room', (data) => {
        try {
            const { otherUserId } = data;
            const roomId = [socket.userId, otherUserId].sort().join('_');
            
            socket.leave(roomId);
            
            io.to(roomId).emit('chat:user-left', {
                userId: socket.userId,
                timestamp: new Date()
            });
            
            console.log(`[Chat] Korisnik ${socket.userId} je napustio sobu ${roomId}`);
        } catch (error) {
            console.error('[Chat:leave-room] Greška:', error);
        }
    });
}

module.exports = {
    setupMessageHandler
};
