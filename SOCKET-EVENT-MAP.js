/**
 * Socket.io Event Map
 * Potpuni pregled svih dostupnih real-time event-a
 */

// ==================== 📅 APPOINTMENT EVENTI ====================

// Appointment Creation
{
    event: 'appointment:created',
    sender: 'Backend Service',
    receiver: 'Doktor (kome je kreiran termin)',
    trigger: 'appointmentService.createAppointment()',
    data: {
        doctorId: 'doctor-123',
        appointmentId: 'apt-456',
        patientName: 'Marko Marković',
        dateTime: '2024-05-15 14:00',
        reason: 'Opšti pregled'
    },
    frontend_listen: `socketService.getAppointmentCreatedObservable().subscribe(event => {
        showNotification('Novi termin od ' + event.appointment.patientName);
    })`
}

// Appointment Status Update
{
    event: 'appointment:status-updated',
    sender: 'Backend Service',
    receiver: 'Pacijent (čiji je termin ažuran)',
    trigger: 'appointmentService.updateAppointmentStatus()',
    data: {
        appointmentId: 'apt-456',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        newStatus: 'confirmed',  // 'pending', 'confirmed', 'cancelled', 'completed'
        reason: 'Razlog ako je otkazan'
    },
    frontend_listen: `socketService.getAppointmentUpdatedObservable().subscribe(event => {
        const statusText = {
            'confirmed': '✅ Potvrđen',
            'cancelled': '❌ Otkazan',
            'completed': '✅ Završen'
        }[event.newStatus];
        showNotification(statusText);
    })`
}

// Prescription Added
{
    event: 'notification:prescription-added',
    sender: 'Backend Service',
    receiver: 'Pacijent (kojem je dodan recept)',
    trigger: 'appointmentService.addPrescription()',
    data: {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        medicationName: 'Aspirina',
        dosage: '500mg',
        duration: '7 dana',
        instructions: 'Tri puta dnevno'
    },
    frontend_listen: `socketService.getNotificationObservable().subscribe(notification => {
        if (notification.__eventName === 'notification:prescription-added' || notification.type === 'prescription_added') {
            showAlert('Doktor je dodao recept za vas');
        }
    })`
}

// Medical Record Updated
{
    event: 'notification:medical-record-updated',
    sender: 'Backend Service',
    receiver: 'Pacijent (čija je kartona ažurirana)',
    trigger: 'appointmentService.updateMedicalRecord()',
    data: {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        recordType: 'Pregled',
        findings: 'Zdrav pacijent',
        nextVisit: '2024-06-15'
    },
    frontend_listen: `socketService.getNotificationObservable().subscribe(notification => {
        if (notification.__eventName === 'notification:medical-record-updated' || notification.type === 'medical_record_updated') {
            showAlert('Medicinska kartona je ažurirana');
        }
    })`
}

// ==================== 💬 MESSAGE EVENTI ====================

// Join Chat Room
{
    event: 'chat:join-room',
    direction: 'Frontend → Backend',
    trigger: 'socketService.joinChatRoom(otherUserId)',
    data: {
        otherUserId: 'user-456'
    },
    description: 'Priključi se chat sobi sa drugim korisnikom'
}

// Send Message
{
    event: 'chat:send-message',
    direction: 'Frontend → Backend → Frontend',
    trigger: 'socketService.sendMessage(recipientId, message)',
    data: {
        recipientId: 'doctor-123',
        message: 'Dobar dan doktore!',
        appointmentId: 'apt-456',  // opciono
        senderId: 'patient-123',
        senderRole: 'patient',
        senderEmail: 'patient@medify.com',
        timestamp: '2024-05-15T10:30:00Z',
        read: false
    },
    receiver: 'Svi u chat sobi (doctor + patient)',
    frontend_listen: `socketService.getMessageReceivedObservable().subscribe(message => {
        addMessageToChat({
            from: message.senderEmail,
            text: message.message,
            time: message.timestamp
        });
    })`
}

// Message Read
{
    event: 'chat:message-read',
    direction: 'Frontend → Backend → Frontend',
    trigger: 'socketService.markMessageAsRead(messageId)',
    data: {
        messageId: 'msg-789',
        recipientId: 'doctor-123',
        readBy: 'patient-123'
    },
    description: 'Obavijesti da je poruka pročitana'
}

// Typing Indicator
{
    event: 'chat:typing',
    direction: 'Frontend → Backend → Frontend',
    trigger: 'socketService.startTyping(recipientId)',
    data: {
        recipientId: 'doctor-123',
        userId: 'patient-123',
        userEmail: 'patient@medify.com'
    },
    receiver: 'Korisnik koji prima poruku',
    frontend_listen: `socketService.getTypingObservable().subscribe(event => {
        if (event.type === 'typing') {
            showTypingIndicator(event.data.userEmail + ' piše...');
        }
    })`
}

// Typing Stopped
{
    event: 'chat:typing-stopped',
    direction: 'Frontend → Backend → Frontend',
    trigger: 'socketService.stopTyping(recipientId)',
    data: {
        recipientId: 'doctor-123',
        userId: 'patient-123'
    },
    description: 'Obavijesti da je korisnik prestao pisati'
}

// Leave Room
{
    event: 'chat:leave-room',
    direction: 'Frontend → Backend',
    trigger: 'socketService.leaveChatRoom(otherUserId)',
    data: {
        otherUserId: 'doctor-123'
    },
    description: 'Napusti chat sobu'
}

// ==================== 👨‍⚕️ DOCTOR AVAILABILITY EVENTI ====================

// Doctor Availability Updated
{
    event: 'doctor:availability-updated',
    sender: 'Frontend (Doktor)',
    receiver: 'SVI online korisnici',
    trigger: 'socketService.updateDoctorAvailability(doctorId, status)',
    data: {
        doctorId: 'doctor-123',
        status: 'busy',  // 'available', 'busy', 'offline'
        availabilitySchedule: {
            startTime: '14:00',
            endTime: '16:00',
            reason: 'U pregledi'
        }
    },
    frontend_listen: `socketService.getDoctorAvailabilityObservable().subscribe(data => {
        updateDoctorStatus(data.doctorId, data.status);
    })`
}

// Doctor Online
{
    event: 'doctor:online',
    sender: 'Frontend (Doktor)',
    receiver: 'SVI online korisnici',
    trigger: 'socketService.setDoctorOnline(doctorId)',
    data: {
        doctorId: 'doctor-123',
        email: 'doctor@medify.com',
        timestamp: '2024-05-15T10:30:00Z'
    },
    frontend_listen: `socketService.getDoctorAvailabilityObservable().subscribe(data => {
        if (data.type === 'doctor_online') {
            showWithGreenBadge(data.doctorId);
        }
    })`
}

// Doctor Offline
{
    event: 'doctor:offline',
    sender: 'Backend (na disconnect)',
    receiver: 'SVI online korisnici',
    data: {
        doctorId: 'doctor-123',
        timestamp: '2024-05-15T10:35:00Z'
    },
    frontend_listen: `socketService.getDoctorAvailabilityObservable().subscribe(data => {
        if (data.type === 'doctor_offline') {
            showWithGreyBadge(data.doctorId);
        }
    })`
}

// Appointment Started
{
    event: 'doctor:appointment-started',
    sender: 'Frontend (Doktor)',
    receiver: 'SVI online korisnici',
    trigger: 'socketService.emit("doctor:appointment-started", data)',
    data: {
        doctorId: 'doctor-123',
        appointmentId: 'apt-456',
        patientId: 'patient-123'
    },
    description: 'Doktor je počeo pregled'
}

// Appointment Completed
{
    event: 'doctor:appointment-completed',
    sender: 'Frontend (Doktor)',
    receiver: 'Pacijent i SVI online',
    trigger: 'socketService.emit("doctor:appointment-completed", data)',
    data: {
        doctorId: 'doctor-123',
        appointmentId: 'apt-456',
        notes: 'Pacijent je zdrav, ponos u mjesecu'
    },
    frontend_listen: `socketService.getNotificationObservable().subscribe(data => {
        if (data.type === 'appointment_completed') {
            showAlert('Vaš pregled je završen');
        }
    })`
}

// Video Call Request
{
    event: 'doctor:video-call-request',
    sender: 'Frontend (Doktor)',
    receiver: 'Pacijent',
    trigger: 'socketService.requestVideoCall(patientId, appointmentId)',
    data: {
        doctorId: 'doctor-123',
        patientId: 'patient-123',
        appointmentId: 'apt-456'
    },
    frontend_listen: `socketService.getNotificationObservable().subscribe(data => {
        if (data.type === 'video_call_incoming') {
            showVideoCallModal(data);
        }
    })`
}

// Video Call Accepted
{
    event: 'patient:video-call-accepted',
    sender: 'Frontend (Pacijent)',
    receiver: 'Doktor',
    trigger: 'socketService.acceptVideoCall(doctorId, appointmentId)',
    data: {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        appointmentId: 'apt-456'
    },
    frontend_listen: `socketService.getNotificationObservable().subscribe(data => {
        if (data.type === 'video_call_accepted') {
            initializeWebRTC();
        }
    })`
}

// Video Call Rejected
{
    event: 'patient:video-call-rejected',
    sender: 'Frontend (Pacijent)',
    receiver: 'Doktor',
    trigger: 'socketService.rejectVideoCall(doctorId, appointmentId, reason)',
    data: {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        appointmentId: 'apt-456',
        reason: 'Zauzet/a sam'
    }
}

// ==================== 🔔 NOTIFICATION EVENTI ====================

// General Notification
{
    event: 'notification:user-alert',
    sender: 'Backend (via socketEmitter)',
    receiver: 'Specifičan korisnik',
    trigger: 'socketEmitter.notifyUser(userId, message, data)',
    data: {
        message: 'Obavijest poruke',
        data: { customData: 'value' },
        type: 'info',  // 'info', 'success', 'warning', 'error'
        timestamp: '2024-05-15T10:30:00Z'
    }
}

// Admin Alert
{
    event: 'notification:admin-alert',
    sender: 'Backend (via socketEmitter)',
    receiver: 'SVI online admini',
    trigger: 'socketEmitter.notifyAdmin(io, message, data)',
    data: {
        message: 'Admin poruke',
        severity: 'high'  // 'low', 'medium', 'high'
    },
    frontend_listen: `socketService.getNotificationObservable().subscribe(notification => {
        if (notification.type === 'admin_alert') {
            showAdminAlert(notification.message);
        }
    })`
}

// Active Users Updated
{
    event: 'system:active-users-updated',
    sender: 'Backend (Socket.io)',
    receiver: 'SVI online korisnici',
    trigger: 'Automatski nakon svakog connect/disconnect',
    data: {
        count: 5,
        users: [
            { userId: 'user-1', role: 'admin', email: 'admin@medify.com', connectedAt: '2024-05-15T10:00:00Z' },
            { userId: 'user-2', role: 'doctor', email: 'doctor@medify.com', connectedAt: '2024-05-15T10:15:00Z' },
            { userId: 'user-3', role: 'patient', email: 'patient@medify.com', connectedAt: '2024-05-15T10:25:00Z' }
        ]
    },
    frontend_listen: `socketService.getActiveUsersObservable().subscribe(data => {
        console.log(data.count + ' korisnika je online');
        updateUsersList(data.users);
    })`
}

// ==================== 🔌 SYSTEM EVENTI ====================

// Ping (Health Check)
{
    event: 'system:ping',
    direction: 'Frontend → Backend',
    trigger: 'socketService.ping()',
    returns: 'Promise<{pong: true, timestamp: Date}>',
    description: 'Testiraj je li socket konekcija aktivna',
    frontend_example: `socketService.ping()
        .then(res => console.log('✅ Socket je živ:', res))
        .catch(err => console.error('❌ Socket je dead:', err))`
}

// ==================== REZIME ====================

/**
 * UKUPNO EVENTI: 25+
 * 
 * Event Kategorije:
 * - Appointment: 4 event-a
 * - Chat/Message: 6 event-a
 * - Doctor Availability: 6 event-a
 * - Notifications: 3 event-a
 * - System: 2 event-a
 * 
 * Kako Koristiti:
 * 
 * 1. Backend Emitovanje:
 *    socketEmitter.emitAppointmentCreated(doctorId, data);
 * 
 * 2. Frontend Slušanje:
 *    socketService.getAppointmentCreatedObservable().subscribe(data => {
 *        // Obrada eventi
 *    });
 * 
 * 3. Frontend Slanje:
 *    socketService.sendMessage(recipientId, message);
 * 
 * Sve je real-time, bez osvježavanja! ⚡
 */
