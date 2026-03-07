import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { Appointment } from '../../models/appointment.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppointmentFormModalComponent } from './appointment-form-modal/appointment-form-modal';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, AppointmentFormModalComponent],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css'
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  pageError = signal('');
  formError = signal('');
  showCreateModal = signal(false);
  statusFilter = signal('');
  minDate = signal(new Date().toISOString().split('T')[0]);

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
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.showCreateModal.set(false);
    this.pageError.set('');
    this.formError.set('');
    
    // Subscribe na korisnika i učitaj termine kada se postavi uloga
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.isDoctor.set(user.role === 'doctor');
          this.isPatient.set(user.role === 'patient');
          // Učitaj termine samo nakon što su role-ovi postavljeni
          this.loadAppointments();
          // Ako je pacijent, učitaj dostupne doktore
          if (user.role === 'patient') {
            this.loadDoctors();
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDoctors() {
    this.doctorService.getAllDoctors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doctors) => {
          this.patients.set(doctors);
        },
        error: (err) => {
          console.error('Greška pri učitavanju doktora:', err);
        }
      });
  }

  loadAppointments() {
    this.loading.set(true);
    this.pageError.set('');
    const endpoint = this.isDoctor() 
      ? this.appointmentService.getAppointmentsByDoctor(this.statusFilter() || undefined)
      : this.appointmentService.getAppointmentsByPatient(this.statusFilter() || undefined);

    endpoint.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greška pri učitavanju termina');
        this.loading.set(false);
      }
    });
  }

  createAppointment() {
    this.formError.set('');
    const current = this.newAppointment();
    if (!current.appointmentDate || !current.reason) {
      this.formError.set('Molimo popunite sva polja.');
      return;
    }

    // Za doktore: trebam patientId, za pacijente: trebam doctorId
    if (this.isDoctor() && !current.patientId) {
      this.formError.set('Molimo unesite ID pacijenta.');
      return;
    }

    if (this.isPatient() && !current.patientId) {
      this.formError.set('Molimo izaberite doktora.');
      return;
    }

    this.loading.set(true);
    
    // Pripremi podatke u zavisnosti od uloge
    const appointmentData = this.isDoctor()
      ? {
          patientId: current.patientId,
          appointmentDate: new Date(current.appointmentDate),
          reason: current.reason
        }
      : {
          doctorId: current.patientId, // Za pacijente, patientId polje sadrži doctorId
          appointmentDate: new Date(current.appointmentDate),
          reason: current.reason
        };

    this.appointmentService.createAppointment(appointmentData as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeCreateModal();
          this.newAppointment.set({ patientId: '', appointmentDate: '', reason: '' });
          this.loadAppointments();
        },
        error: (err) => {
          this.formError.set(err.error?.message || 'Greška pri kreiranju termina.');
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
        this.pageError.set(err.error?.message || 'Greška pri ažuriranju statusa');
      }
    });
  }

  completeAndCreateMedicalRecord(appointment: Appointment) {
    const appointmentId = appointment._id;
    if (!appointmentId) {
      this.pageError.set('Neispravan termin: nedostaje ID termina.');
      return;
    }

    this.appointmentService.updateAppointmentStatus(appointmentId, 'completed').pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.router.navigate(['/medical-records'], {
          queryParams: {
            appointmentId,
            openCreate: '1'
          }
        });
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greška pri završavanju termina');
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
        this.pageError.set(err.error?.message || 'Greška pri brisanju termina');
      }
    });
  }

  cancelAppointmentWithConfirm(id: string) {
    if (!confirm('Da li ste sigurni da želite da otkazete ovaj termin?')) {
      return;
    }
    this.updateStatus(id, 'canceled');
  }

  openCreateModal() {
    this.formError.set('');
    this.newAppointment.set({ patientId: '', appointmentDate: '', reason: '' });
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.formError.set('');
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
    this.pageError.set('');
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




