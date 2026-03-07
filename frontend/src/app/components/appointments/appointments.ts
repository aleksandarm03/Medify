import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { Appointment } from '../../models/appointment.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css'
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  error = signal('');
  showCreateModal = signal(false);
  statusFilter = signal('');

  newAppointment = signal({
    patientId: '',
    appointmentDate: '',
    reason: ''
  });

  patients = signal<any[]>([]);
  isDoctor = signal(false);
  isPatient = signal(false);

  private destroy$ = new Subject<void>();

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.showCreateModal.set(false);
    this.error.set('');
    
    // Subscribe na korisnika i učitaj termine kada se postavi uloga
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.isDoctor.set(user.role === 'doctor');
          this.isPatient.set(user.role === 'patient');
          // Učitaj termine samo nakon što su role-ovi postavljeni
          this.loadAppointments();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAppointments() {
    this.loading.set(true);
    this.error.set('');
    const endpoint = this.isDoctor() 
      ? this.appointmentService.getAppointmentsByDoctor(this.statusFilter() || undefined)
      : this.appointmentService.getAppointmentsByPatient(this.statusFilter() || undefined);

    endpoint.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri učitavanju termina');
        this.loading.set(false);
      }
    });
  }

  createAppointment() {
    const current = this.newAppointment();
    if (!current.patientId || !current.appointmentDate || !current.reason) {
      this.error.set('Molimo popunite sva polja');
      return;
    }

    this.loading.set(true);
    this.appointmentService.createAppointment({
      patientId: current.patientId,
      appointmentDate: new Date(current.appointmentDate),
      reason: current.reason
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.newAppointment.set({ patientId: '', appointmentDate: '', reason: '' });
        this.loadAppointments();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri kreiranju termina');
        this.loading.set(false);
      }
    });
  }

  updateStatus(id: string, status: string) {
    this.appointmentService.updateAppointmentStatus(id, status as any).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri ažuriranju statusa');
      }
    });
  }

  deleteAppointment(id: string) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj termin?')) {
      return;
    }

    this.appointmentService.deleteAppointment(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri brisanju termina');
      }
    });
  }

  cancelAppointmentWithConfirm(id: string) {
    if (!confirm('Da li ste sigurni da želite da otkazete ovaj termin?')) {
      return;
    }
    this.updateStatus(id, 'canceled');
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'scheduled': 'status-scheduled',
      'completed': 'status-completed',
      'canceled': 'status-canceled'
    };
    return classes[status] || '';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'scheduled': 'Zakazan',
      'completed': 'Završen',
      'canceled': 'Otkazan'
    };
    return texts[status] || status;
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('sr-RS');
  }

  updateStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.loadAppointments();
  }

  updatePatientId(value: string) {
    const current = this.newAppointment();
    this.newAppointment.set({ ...current, patientId: value });
  }

  updateAppointmentDate(value: string) {
    const current = this.newAppointment();
    this.newAppointment.set({ ...current, appointmentDate: value });
  }

  updateReason(value: string) {
    const current = this.newAppointment();
    this.newAppointment.set({ ...current, reason: value });
  }
}




