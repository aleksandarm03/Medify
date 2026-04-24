/**
 * Example Socket Integration Component
 * Demonstrira kako koristiti Socket.io servic u Angular komponenti
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-notifications-center',
    template: ''
})
export class NotificationsCenterComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Notification statistika
    appointments: any[] = [];
    messages: any[] = [];
    generalNotifications: any[] = [];
    onlineDoctors: any[] = [];
    activeUserCount: number = 0;

    // UI State
    isSocketConnected: boolean = false;
    isTyping: boolean = false;
    currentTypingUser: string = '';

    constructor(private socketService: SocketService) {}

    ngOnInit(): void {
        // Inicijalizacija svega

        // 1. Provjeri socket konekciju
        this.checkSocketConnection();

        // 2. Sluša appointment eventi
        this.setupAppointmentListeners();

        // 3. Sluša message eventi
        this.setupMessageListeners();

        // 4. Sluša obavijesti
        this.setupNotificationListeners();

        // 5. Sluša doctor availability
        this.setupDoctorAvailabilityListeners();

        // 6. Sluša aktivne korisnike
        this.setupActiveUsersListener();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Provjeri je li socket konekcija aktivna
     */
    private checkSocketConnection(): void {
        if (this.socketService.isConnected()) {
            this.isSocketConnected = true;
            console.log('✅ Socket je povezan');

            // Testiraj sa ping
            this.socketService.ping()
                .then((response: any) => console.log('✅ Ping uspješan:', response))
                .catch((error: any) => console.error('❌ Ping failed:', error));
        } else {
            console.warn('⚠️ Socket nije povezan, pokušavam ponovno');
            this.socketService.reconnect();
        }
    }

    /**
     * Postavlja event listenere za termine
     */
    private setupAppointmentListeners(): void {
        // Nova термина obaviješt
        this.socketService
            .getAppointmentCreatedObservable()
            .pipe(takeUntil(this.destroy$))
            .subscribe((event: any) => {
                console.log('📅 Novi termin:', event);
                this.appointments.push({
                    ...event,
                    type: 'appointment_created',
                    read: false
                });

                // Prikaži toast notifikaciju
                this.showToast(
                    'Novi termin',
                    `Pacijent ${event.appointment.patientName} je rezervirao termin`
                );
            });

        // Promjena statusa termina
        this.socketService
            .getAppointmentUpdatedObservable()
            .pipe(takeUntil(this.destroy$))
            .subscribe((event: any) => {
                console.log('📅 Status termina promjenjen:', event);

                const notification = {
                    ...event,
                    type: 'appointment_status_changed',
                    read: false
                };

                this.appointments.push(notification);

                // Različite poruke u ovisnosti od statusa
                const statusMessages: {[key: string]: string} = {
                    'confirmed': '✅ Vaš termin je potvrđen',
                    'cancelled': '❌ Vaš termin je otkazan',
                    'completed': '✅ Termin je završen',
                    'rescheduled': '📝 Termin je prebačen na drugo vrijeme'
                };

                this.showToast('Obavijest', statusMessages[event.newStatus] || 'Termin ažuriran');
            });
    }

    /**
     * Postavlja event listenere za poruke
     */
    private setupMessageListeners(): void {
        // Novi poruka
        this.socketService
            .getMessageReceivedObservable()
            .pipe(takeUntil(this.destroy$))
            .subscribe((message: any) => {
                console.log('💬 Nova poruka:', message);

                this.messages.push({
                    ...message,
                    type: 'message',
                    read: false,
                    timestamp: new Date(message.timestamp)
                });

                // Prikaži notifikaciju
                this.showToast(
                    'Nova poruka',
                    `Od: ${message.senderEmail}\n${message.message.substring(0, 50)}...`
                );
            });

        // Kucanje indikatora
        this.socketService
            .getTypingObservable()
            .pipe(takeUntil(this.destroy$))
            .subscribe((event: any) => {
                if (event.type === 'typing') {
                    this.isTyping = true;
                    this.currentTypingUser = event.data.userEmail;
                    console.log(`✏️ ${this.currentTypingUser} kuca...`);
                } else {
                    this.isTyping = false;
                }
            });
    }

    /**
     * Postavlja event listenere za obavijesti
     */
    private setupNotificationListeners(): void {
        this.socketService
            .getNotificationObservable()
            .pipe(takeUntil(this.destroy$))
            .subscribe((notification: any) => {
                console.log('🔔 Obavijest:', notification);

                this.generalNotifications.push({
                    ...notification,
                    read: false,
                    timestamp: new Date()
                });

                // Specifični tipovi obavijesti
                this.handleNotificationByType(notification);
            });
    }

    /**
     * Postavlja event listenere za dostupnost doktora
     */
    private setupDoctorAvailabilityListeners(): void {
        this.socketService
            .getDoctorAvailabilityObservable()
            .pipe(takeUntil(this.destroy$))
            .subscribe((event: any) => {
                console.log('👨‍⚕️ Dostupnost doktora:', event);

                switch (event.type) {
                    case 'doctor_online':
                        this.showToast('Doktor je online', `Dr. ${event.email} je sada dostupan`);
                        break;
                    case 'doctor_offline':
                        this.showToast('Doktor je offline', `Dr. ${event.doctorId} je odspojio/a se`);
                        break;
                    case 'availability_changed':
                        this.showToast('Dostupnost se promijenila', `Dr. ${event.doctorId} je ažurio/a dostupnost`);
                        break;
                    case 'video_call_incoming':
                        this.handleIncomingVideoCall(event);
                        break;
                }
            });
    }

    /**
     * Postavlja event listenere za aktivne korisnike
     */
    private setupActiveUsersListener(): void {
        this.socketService
            .getActiveUsersObservable()
            .pipe(takeUntil(this.destroy$))
            .subscribe((data: any) => {
                console.log(`👥 Aktivnih korisnika: ${data.count}`);
                this.activeUserCount = data.count;

                // Ažuriraj listu aktivnih doktora
                this.onlineDoctors = data.users.filter((u: any) => u.role === 'doctor');
            });
    }

    /**
     * Obradi notifikacije po tipu
     */
    private handleNotificationByType(notification: any): void {
        if (!notification.type) return;

        switch (notification.type) {
            case 'prescription_added':
                this.showToast('Recepti', 'Doktor je dodao naslov za vas', 'info');
                break;
            case 'medical_record_updated':
                this.showToast('Medicinska kartona', 'Doktor je ažurio vašu kartonu', 'info');
                break;
            case 'patient_message':
                this.showToast('Nova poraka od pacijenta', notification.message, 'warning');
                break;
            case 'appointment_created':
                this.showToast('Novi termin', 'Novi termin je kreiran', 'success');
                break;
            default:
                this.showToast('Obavijest', notification.message, 'info');
        }
    }

    /**
     * Rukovanje dolaskom video poziva
     */
    private handleIncomingVideoCall(event: any): void {
        console.log('📞 Dolazni video pozív:', event);

        // Prikaži modal za video poziva
        const userChoice = confirm(
            `Dr. ${event.doctorId} vas poziva na video pregled.\nPrihvaćaš?`
        );

        if (userChoice) {
            this.socketService.acceptVideoCall(event.doctorId, event.appointmentId);
            this.showToast('Prihvaćeno', 'Video poziva je prihvaćeno', 'success');
        } else {
            this.socketService.rejectVideoCall(
                event.doctorId,
                event.appointmentId,
                'Pacijent je odbio poziva'
            );
            this.showToast('Odbijeno', 'Poziva je odbijen', 'info');
        }
    }

    /**
     * Primjer slanja poruke kroz socket
     */
    public sendMessage(recipientId: string, message: string, appointmentId?: string): void {
        if (!message.trim()) {
            console.warn('Poruke ne može biti prazna');
            return;
        }

        if (!this.socketService.isConnected()) {
            console.error('Socket nije povezan');
            return;
        }

        console.log(`💬 Slanje poruke za: ${recipientId}`);
        this.socketService.sendMessage(recipientId, message, appointmentId);

        this.showToast('Poraka poslana', '✅ Vaša poraka je poslana');
    }

    /**
     * Primjer ažuriranja dostupnosti doktora
     */
    public updateDoctorAvailability(doctorId: string, status: 'available' | 'busy' | 'offline'): void {
        console.log(`Ažuriranje dostupnosti na: ${status}`);
        this.socketService.updateDoctorAvailability(doctorId, status);

        const statusLabel: {[key: string]: string} = {
            'available': '✅ Dostupan/a',
            'busy': '🔴 Zauzet/a',
            'offline': '⚪ Offline'
        };

        this.showToast('Status ažuriran', statusLabel[status]);
    }

    /**
     * Primjer kreiranja termina sa socket notifikacijom
     * (Obično se poziva iz appointment service)
     */
    public createAppointmentWithNotification(appointmentData: any): void {
        console.log('Kreiram termin:', appointmentData);

        // 1. Kreiraj u bazi (HTTP request)
        // const appointment = await this.appointmentService.create(appointmentData);

        // 2. Prosljeđi notifikaciju kroz socket
        this.socketService.notifyAppointmentCreated(
            appointmentData.doctorId,
            appointmentData
        );

        this.showToast('Termin kreiran', 'Doktor je obaviješten');
    }

    /**
     * Prikaži toast notifikaciju
     */
    private showToast(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
        // Ovdje integrira toast library
        // Npr: MatSnackBar, Toastr, NgxToastr, itd

        const icons: {[key: string]: string} = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };

        console.log(`${icons[type]} [${type.toUpperCase()}] ${title}: ${message}`);

        // Primjer sa console (zamijeni sa stvarnom toast bibliotekom)
        // this.toastr.show(message, title, { type });
    }

    /**
     * Prikaži sve obavijesti
     */
    public getAllNotifications(): any[] {
        return [
            ...this.appointments.filter(a => !a.read),
            ...this.messages.filter(m => !m.read),
            ...this.generalNotifications.filter(n => !n.read)
        ];
    }

    /**
     * Označi obavijest kao pročitanu
     */
    public markAsRead(notificationId: string): void {
        this.socketService.markNotificationsRead([notificationId]);

        const allNotifications = this.getAllNotifications();
        const notification = allNotifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }

    /**
     * Obriši obavijest
     */
    public deleteNotification(notificationId: string): void {
        this.socketService.deleteNotification(notificationId);

        this.generalNotifications = this.generalNotifications.filter(
            n => n.id !== notificationId
        );
    }

    /**
     * Testiraj socket konekciju
     */
    public testSocketConnection(): void {
        console.log('🧪 Testiranje Socket konekcije...');

        this.socketService
            .ping()
            .then((response: any) => {
                this.showToast('✅ Socket Test', 'Konekcija je aktivna', 'success');
                console.log('Socket is alive:', response);
            })
            .catch((error: any) => {
                this.showToast('❌ Socket Test', 'Konekcija niet uspješna', 'error');
                console.error('Socket test failed:', error);
            });
    }
}
