/**
 * Socket Service - Angular
 * Upravljanje Socket.io konekcijom i resivanjem realtime događaja
 */

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket | null = null;
    private socketUrl = 'http://localhost:3232';

    // Observable subjekti za različite event tipove
    private appointmentCreatedSubject = new Subject<any>();
    private appointmentUpdatedSubject = new Subject<any>();
    private messageReceivedSubject = new Subject<any>();
    private notificationSubject = new Subject<any>();
    private doctorAvailabilitySubject = new Subject<any>();
    private activeUsersSubject = new Subject<any>();
    private typingSubject = new Subject<any>();

    constructor(private authService: AuthService) {
        this.initializeSocket();
        this.bindAuthLifecycle();
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') {
            return null;
        }
        return this.authService.getToken();
    }

    private bindAuthLifecycle(): void {
        this.authService.currentUser$.subscribe((user) => {
            if (user) {
                this.reconnect();
            } else {
                this.disconnect();
            }
        });
    }

    /**
     * Inicijalizira Socket.io konekciju
     */
    private initializeSocket(): void {
        const token = this.getToken();
        
        if (!token) {
            console.log('[Socket] Token nije pronađen, konekcija odložena');
            return;
        }

        this.socket = io(this.socketUrl, {
            auth: {
                token: token
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        this.setupEventListeners();
    }

    /**
     * Postavlja sve event listenere
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // Appointment eventi
        this.socket.on('notification:appointment-created', (data: any) => {
            this.appointmentCreatedSubject.next(data);
        });

        this.socket.on('notification:appointment-updated', (data: any) => {
            this.appointmentUpdatedSubject.next(data);
        });

        // Message eventi
        this.socket.on('chat:message-received', (data: any) => {
            this.messageReceivedSubject.next(data);
        });

        this.socket.on('chat:user-typing', (data: any) => {
            this.typingSubject.next({ type: 'typing', data });
        });

        this.socket.on('chat:user-typing-stopped', (data: any) => {
            this.typingSubject.next({ type: 'stopped', data });
        });

        // Notification eventi
        this.socket.on('notification:user-alert', (data: any) => {
            this.notificationSubject.next({ ...data, __eventName: 'notification:user-alert' });
        });

        this.socket.on('notification:admin-alert', (data: any) => {
            this.notificationSubject.next({ ...data, __eventName: 'notification:admin-alert' });
        });

        this.socket.on('notification:prescription-added', (data: any) => {
            this.notificationSubject.next({ ...data, __eventName: 'notification:prescription-added' });
        });

        this.socket.on('notification:prescription-updated', (data: any) => {
            this.notificationSubject.next({ ...data, __eventName: 'notification:prescription-updated' });
        });

        this.socket.on('notification:medical-record-updated', (data: any) => {
            this.notificationSubject.next({ ...data, __eventName: 'notification:medical-record-updated' });
        });

        // Doctor availability eventi
        this.socket.on('notification:doctor-availability-changed', (data: any) => {
            this.doctorAvailabilitySubject.next(data);
        });

        this.socket.on('notification:doctor-online', (data: any) => {
            this.doctorAvailabilitySubject.next(data);
        });

        this.socket.on('notification:doctor-offline', (data: any) => {
            this.doctorAvailabilitySubject.next(data);
        });

        // System eventi
        this.socket.on('system:active-users-updated', (data: any) => {
            this.activeUsersSubject.next(data);
        });

        // Error handler
        this.socket.on('error', (error: any) => {
            console.error('[Socket Error]', error);
        });

        // Connection events
        this.socket.on('connect', () => {
            console.log('[Socket] Povezan sa serverom');
        });

        this.socket.on('disconnect', () => {
            console.log('[Socket] Odspojeno od servera');
        });

        this.socket.on('reconnect', () => {
            console.log('[Socket] Ponovno povezano');
        });
    }

    /**
     * Poziva ping na server - provjerava je li konekcija aktivna
     */
    public ping(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket nije inicijaliziran');
                return;
            }

            this.socket.emit('system:ping', (response: any) => {
                resolve(response);
            });

            setTimeout(() => {
                reject('Ping timeout');
            }, 5000);
        });
    }

    // ==================== APPOINTMENT METHODS ====================

    /**
     * Obavijesti doktoru o novom terminu
     */
    public notifyAppointmentCreated(doctorId: string, appointmentDetails: any): void {
        if (this.socket) {
            this.socket.emit('appointment:created', {
                doctorId,
                appointmentDetails
            });
        }
    }

    /**
     * Obavijesti o promjeni statusa termina
     */
    public updateAppointmentStatus(appointmentId: string, patientId: string, doctorId: string, 
                                   newStatus: string, reason?: string): void {
        if (this.socket) {
            this.socket.emit('appointment:status-updated', {
                appointmentId,
                patientId,
                doctorId,
                newStatus,
                reason
            });
        }
    }

    /**
     * Obavijesti o novoj recepti
     */
    public notifyPrescriptionAdded(patientId: string, doctorId: string, prescriptionDetails: any): void {
        if (this.socket) {
            this.socket.emit('appointment:prescription-added', {
                patientId,
                doctorId,
                prescriptionDetails
            });
        }
    }

    /**
     * Obavijesti o ažuriranoj medicinskoj kartoni
     */
    public notifyMedicalRecordUpdated(patientId: string, doctorId: string, recordDetails: any): void {
        if (this.socket) {
            this.socket.emit('appointment:medical-record-updated', {
                patientId,
                doctorId,
                recordDetails
            });
        }
    }

    // ==================== MESSAGE METHODS ====================

    /**
     * Priključi se chat sobi
     */
    public joinChatRoom(otherUserId: string): void {
        if (this.socket) {
            this.socket.emit('chat:join-room', {
                otherUserId
            });
        }
    }

    /**
     * Pošalji poruku
     */
    public sendMessage(recipientId: string, message: string, appointmentId?: string): void {
        if (this.socket) {
            this.socket.emit('chat:send-message', {
                recipientId,
                message,
                appointmentId
            });
        }
    }

    /**
     * Označi poruku kao pročitanu
     */
    public markMessageAsRead(messageId: string, recipientId: string): void {
        if (this.socket) {
            this.socket.emit('chat:message-read', {
                messageId,
                recipientId
            });
        }
    }

    /**
     * Obavijesti da pišeš poruku
     */
    public startTyping(recipientId: string): void {
        if (this.socket) {
            this.socket.emit('chat:typing', {
                recipientId
            });
        }
    }

    /**
     * Obavijesti da si prestao pisati
     */
    public stopTyping(recipientId: string): void {
        if (this.socket) {
            this.socket.emit('chat:typing-stopped', {
                recipientId
            });
        }
    }

    /**
     * Napusti chat sobu
     */
    public leaveChatRoom(otherUserId: string): void {
        if (this.socket) {
            this.socket.emit('chat:leave-room', {
                otherUserId
            });
        }
    }

    // ==================== DOCTOR AVAILABILITY METHODS ====================

    /**
     * Ažurira dostupnost doktora
     */
    public updateDoctorAvailability(doctorId: string, status: string, availabilitySchedule?: any): void {
        if (this.socket) {
            this.socket.emit('doctor:availability-updated', {
                doctorId,
                status,
                availabilitySchedule
            });
        }
    }

    /**
     * Signalizira da je doktor online
     */
    public setDoctorOnline(doctorId: string): void {
        if (this.socket) {
            this.socket.emit('doctor:online', { doctorId });
        }
    }

    /**
     * Signalizira da je doktor offline
     */
    public setDoctorOffline(doctorId: string): void {
        if (this.socket) {
            this.socket.emit('doctor:offline', { doctorId });
        }
    }

    /**
     * Zahtjev za video poziva
     */
    public requestVideoCall(patientId: string, appointmentId: string): void {
        if (this.socket) {
            this.socket.emit('doctor:video-call-request', {
                patientId,
                appointmentId
            });
        }
    }

    /**
     * Prihvati video poziva
     */
    public acceptVideoCall(doctorId: string, appointmentId: string): void {
        if (this.socket) {
            this.socket.emit('patient:video-call-accepted', {
                doctorId,
                appointmentId
            });
        }
    }

    /**
     * Odbij video poziva
     */
    public rejectVideoCall(doctorId: string, appointmentId: string, reason?: string): void {
        if (this.socket) {
            this.socket.emit('patient:video-call-rejected', {
                doctorId,
                appointmentId,
                reason
            });
        }
    }

    // ==================== NOTIFICATION METHODS ====================

    /**
     * Preuzmi sve obavijesti
     */
    public fetchNotifications(userId: string): void {
        if (this.socket) {
            this.socket.emit('notification:fetch', { userId });
        }
    }

    /**
     * Označi obavijesti kao pročitane
     */
    public markNotificationsRead(notificationIds: string[]): void {
        if (this.socket) {
            this.socket.emit('notification:mark-read', { notificationIds });
        }
    }

    /**
     * Obriši obavijest
     */
    public deleteNotification(notificationId: string): void {
        if (this.socket) {
            this.socket.emit('notification:delete', { notificationId });
        }
    }

    /**
     * Briši sve obavijesti
     */
    public clearAllNotifications(): void {
        if (this.socket) {
            this.socket.emit('notification:clear-all', {});
        }
    }

    // ==================== OBSERVABLES ====================

    getAppointmentCreatedObservable(): Observable<any> {
        return this.appointmentCreatedSubject.asObservable();
    }

    getAppointmentUpdatedObservable(): Observable<any> {
        return this.appointmentUpdatedSubject.asObservable();
    }

    getMessageReceivedObservable(): Observable<any> {
        return this.messageReceivedSubject.asObservable();
    }

    getNotificationObservable(): Observable<any> {
        return this.notificationSubject.asObservable();
    }

    getDoctorAvailabilityObservable(): Observable<any> {
        return this.doctorAvailabilitySubject.asObservable();
    }

    getActiveUsersObservable(): Observable<any> {
        return this.activeUsersSubject.asObservable();
    }

    getTypingObservable(): Observable<any> {
        return this.typingSubject.asObservable();
    }

    // ==================== CONNECTION MANAGEMENT ====================

    /**
     * Ponovno se poveži
     */
    public reconnect(): void {
        const token = this.getToken();
        if (!token) {
            console.log('[Socket] Reconnect preskočen: token ne postoji');
            return;
        }

        if (this.socket) {
            this.socket.auth = { token };
            this.socket.disconnect();
            this.socket.connect();
        } else {
            this.initializeSocket();
        }
    }

    /**
     * Prekini konekciju
     */
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Provjerite je li konekcija aktivna
     */
    public isConnected(): boolean {
        return this.socket?.connected || false;
    }
}
