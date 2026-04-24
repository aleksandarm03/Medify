/**
 * Socket.io Integration Test & Examples
 * Testiranje socket konekcije i primjeri korištenja
 */

// ==================== BACKEND - APPOINTMENT SERVICE ====================

// FILE: backend/services/appointmentService.js (PRIMJER - dodaj u tvoj servis)

const socketEmitter = require('../socket/socketEmitter');

class AppointmentService {
    async createAppointment(appointmentData) {
        try {
            // 1. Spremi termin u MongoDB
            const appointment = {
                id: Date.now(),
                patientId: appointmentData.patientId,
                doctorId: appointmentData.doctorId,
                dateTime: appointmentData.dateTime,
                reason: appointmentData.reason,
                status: 'pending',
                createdAt: new Date()
            };

            // Spremi u DB...
            // const dbResult = await db.appointments.insertOne(appointment);

            // 2. VAŽNO: Emituj Socket.io event - SVI će biti obaviješteni
            socketEmitter.emitAppointmentCreated(
                appointmentData.doctorId,
                {
                    appointmentId: appointment.id,
                    patientName: appointmentData.patientName,
                    dateTime: appointmentData.dateTime,
                    reason: appointmentData.reason
                }
            );

            return appointment;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    async updateAppointmentStatus(appointmentId, patientId, doctorId, newStatus, reason = '') {
        try {
            // 1. Ažuriraj status u bazi
            // const updated = await db.appointments.updateOne({ id: appointmentId }, { status: newStatus });

            // 2. VAŽNO: Emituj Socket.io event - PACIJENT će biti obaviješten
            socketEmitter.emitAppointmentStatusUpdated(
                appointmentId,
                patientId,
                doctorId,
                newStatus,
                reason
            );

            return { success: true, updatedStatus: newStatus };
        } catch (error) {
            console.error('Error updating appointment status:', error);
            throw error;
        }
    }

    async addPrescription(patientId, doctorId, prescriptionData) {
        try {
            // 1. Spremi receptu u bazu
            // const prescription = await db.prescriptions.insertOne(prescriptionData);

            // 2. VAŽNO: Emituj Socket.io event - PACIJENT će biti obaviješten
            socketEmitter.emitPrescriptionAdded(
                patientId,
                doctorId,
                {
                    medicationName: prescriptionData.medicationName,
                    dosage: prescriptionData.dosage,
                    duration: prescriptionData.duration,
                    instructions: prescriptionData.instructions
                }
            );

            return { success: true };
        } catch (error) {
            console.error('Error adding prescription:', error);
            throw error;
        }
    }
}

module.exports = new AppointmentService();

// ==================== BACKEND - APPOINTMENT ROUTE ====================

// FILE: backend/routes/appointment.js (PRIMJER - dodaj u tvoj rout)

const appointmentService = require('../services/appointmentService');

router.post('/create', async (req, res) => {
    try {
        const appointment = await appointmentService.createAppointment(req.body);
        // Socket event je već emitovan u servisu automatski!
        res.json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/status', async (req, res) => {
    try {
        const { patientId, doctorId, status, reason } = req.body;
        const result = await appointmentService.updateAppointmentStatus(
            req.params.id,
            patientId,
            doctorId,
            status,
            reason
        );
        // Socket event je već emitovan!
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== FRONTEND - COMPONENT ====================

// FILE: frontend/src/app/components/appointments/appointments.component.ts

import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { AppointmentService } from '../../services/appointment.service';

@Component({
    selector: 'app-appointments',
    templateUrl: './appointments.component.html'
})
export class AppointmentsComponent implements OnInit {
    appointments: any[] = [];
    newAppointmentNotifications: any[] = [];
    isSocketConnected: boolean = false;

    constructor(
        private socketService: SocketService,
        private appointmentService: AppointmentService
    ) {}

    ngOnInit(): void {
        // 1. Provjeri je li socket konekcija aktivna
        console.log('🔌 Socket je povezan:', this.socketService.isConnected());
        this.isSocketConnected = this.socketService.isConnected();

        // 2. Preuzmi postojeće termine iz baze
        this.loadAppointments();

        // 3. VAŽNO: Sluša LIVE appointment eventi
        this.setupSocketListeners();
    }

    private loadAppointments(): void {
        this.appointmentService.getAppointments().subscribe(data => {
            this.appointments = data;
        });
    }

    private setupSocketListeners(): void {
        // ✅ Sluša nove termine
        this.socketService.getAppointmentCreatedObservable().subscribe(event => {
            console.log('📅 LIVE NOTIFICATION: Novi termin!', event);
            
            // Dodaj u UI stranicu ODMAH - bez čekanja!
            this.newAppointmentNotifications.push({
                message: `Pacijent ${event.appointment.patientName} je rezervirao termin za ${event.appointment.dateTime}`,
                type: 'success',
                timestamp: new Date()
            });

            // Opciono: Ponovi termine iz baze da budu sinkronizirani
            this.loadAppointments();

            // Prikaži toast ili badge
            this.showAppointmentAlert(event.appointment);
        });

        // ✅ Sluša status promjena termina
        this.socketService.getAppointmentUpdatedObservable().subscribe(event => {
            console.log('📅 LIVE: Status termina je promjenjen!', event);
            
            const statusText = this.getStatusText(event.newStatus);
            this.newAppointmentNotifications.push({
                message: `Termin je sada: ${statusText}`,
                type: event.newStatus === 'cancelled' ? 'error' : 'info',
                timestamp: new Date()
            });

            // Ažuriraj UI
            this.loadAppointments();
        });

        // ✅ Sluša recepti
        this.socketService.getNotificationObservable().subscribe(notification => {
            if (notification.type === 'prescription_added') {
                console.log('💊 LIVE: Nova recepti!', notification);
                this.newAppointmentNotifications.push({
                    message: 'Doktor je dodao novu receptu za vas',
                    type: 'info',
                    timestamp: new Date()
                });
            }
        });
    }

    async createNewAppointment(): Promise<void> {
        const appointmentData = {
            patientId: 'patient-123',
            patientName: 'Marko Marković',
            doctorId: 'doctor-456',
            dateTime: '2024-05-15 14:00',
            reason: 'Opšti pregled'
        };

        try {
            // POST zahtjev
            const result = await this.appointmentService.create(appointmentData).toPromise();

            console.log('✅ Termin je kreiiran');
            // Socket event je već emitovan sa backend-a!
            // SVI korisnici će vidjeti obavijest u realnom vremenu

        } catch (error) {
            console.error('❌ Greška pri kreiranju termina:', error);
        }
    }

    updateAppointmentStatus(appointmentId: string): void {
        const updateData = {
            patientId: 'patient-123',
            doctorId: 'doctor-456',
            status: 'confirmed',
            reason: ''
        };

        this.appointmentService.updateStatus(appointmentId, updateData).subscribe(
            result => {
                console.log('✅ Status ažuriran');
                // Socket event je već emitovan!
                // PACIJENT će vidjeti obavijest u realnom vremenu
            },
            error => console.error('❌ Greška:', error)
        );
    }

    private showAppointmentAlert(appointment: any): void {
        // Prikaži alert, toast, ili notification - ovisno o tvoj UI framework-u
        console.log(`
        ╔════════════════════════════════════════╗
        ║        📅 NOVI TERMIN                  ║
        ║  Pacijent: ${appointment.patientName}
        ║  Vrijeme: ${appointment.dateTime}
        ║  Razlog: ${appointment.reason}
        ╚════════════════════════════════════════╝
        `);

        // Primjer sa Toastr ili sličnom bibliotekom:
        // this.toastr.success('Novi termin', 'Appointment Created');
    }

    private getStatusText(status: string): string {
        const statusMap: {[key: string]: string} = {
            'confirmed': '✅ Potvrđen',
            'pending': '⏳ Na čekanju',
            'cancelled': '❌ Otkazan',
            'completed': '✅ Završen'
        };
        return statusMap[status] || status;
    }
}

// ==================== FRONTEND - HTML TEMPLATE ====================

/* FILE: frontend/src/app/components/appointments/appointments.component.html

<div class="appointments-container">
    <!-- Socket Status Indicator -->
    <div [class.connected]="isSocketConnected" class="socket-status">
        <span *ngIf="isSocketConnected" class="badge badge-success">
            🔵 Socket Povezan
        </span>
        <span *ngIf="!isSocketConnected" class="badge badge-danger">
            ⚫ Socket Nije Povezan
        </span>
    </div>

    <!-- Live Notifications -->
    <div *ngIf="newAppointmentNotifications.length > 0" class="notifications">
        <div *ngFor="let notif of newAppointmentNotifications; let i = index" 
             [class]="'alert alert-' + notif.type">
            <strong>⚡ LIVE OBAVIJEST:</strong> {{ notif.message }}
            <small class="text-muted">{{ notif.timestamp | date:'short' }}</small>
        </div>
    </div>

    <!-- Appointment List -->
    <div class="appointments-list">
        <h3>Moji Termini</h3>
        <table>
            <tbody>
                <tr *ngFor="let appt of appointments">
                    <td>{{ appt.patientName || 'N/A' }}</td>
                    <td>{{ appt.dateTime }}</td>
                    <td>
                        <span [class]="'badge badge-' + (appt.status === 'confirmed' ? 'success' : 'warning')">
                            {{ appt.status }}
                        </span>
                    </td>
                    <td>
                        <button (click)="updateAppointmentStatus(appt.id)" class="btn btn-sm btn-primary">
                            Ažuriraj
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Create New Appointment -->
    <button (click)="createNewAppointment()" class="btn btn-primary">
        Kreiraj Novi Termin
    </button>
</div>

*/

// ==================== TEST SCRIPT ====================

// Zalijepiti u browser console za brzu test Socket konekcije:

console.log('%c🧪 SOCKET TEST SCRIPT', 'font-size: 18px; font-weight: bold; color: #2196F3;');

// Test 1: Je li socket inicijaliziran?
console.log('1️⃣ Socket inicijaliziran:', window.ng.probe(document.body).injector.get(SocketService).isConnected());

// Test 2: Ping test
const socketService = window.ng.probe(document.body).injector.get(SocketService);
socketService.ping()
    .then(res => console.log('✅ Ping Success:', res))
    .catch(err => console.error('❌ Ping Failed:', err));

// Test 3: Sluša live event-a
socketService.getAppointmentCreatedObservable().subscribe(event => {
    console.log('%c⚡ LIVE EVENT RECEIVED!', 'font-size: 16px; color: green; font-weight: bold;');
    console.log('Appointment:', event);
});

console.log('%c✅ Socket Test Pokrenut - Čekam na real-time event-e...', 'color: green; font-weight: bold;');

// ==================== ZAVRŠETAK ====================
// Kopiraj ovaj kod gdje trebas!
