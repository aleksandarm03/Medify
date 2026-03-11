import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
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
  searchTerm = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  sortBy = signal<'dateDesc' | 'dateAsc' | 'statusAsc'>('dateDesc');

  visibleAppointments = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const fromDate = this.dateFrom() ? new Date(this.dateFrom()) : null;
    const toDate = this.dateTo() ? new Date(this.dateTo()) : null;

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    const filtered = this.appointments().filter((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const doctorName = `${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.trim().toLowerCase();
      const patientName = `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.trim().toLowerCase();
      const reason = (appointment.reason || '').toLowerCase();
      const status = (appointment.status || '').toLowerCase();

      const matchesTerm = !term
        || reason.includes(term)
        || doctorName.includes(term)
        || patientName.includes(term)
        || status.includes(term);

      const matchesFrom = !fromDate || appointmentDate >= fromDate;
      const matchesTo = !toDate || appointmentDate <= toDate;

      return matchesTerm && matchesFrom && matchesTo;
    });

    return [...filtered].sort((a, b) => {
      if (this.sortBy() === 'dateAsc') {
        return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
      }

      if (this.sortBy() === 'statusAsc') {
        return (a.status || '').localeCompare(b.status || '');
      }

      return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
    });
  });

  newAppointment = signal({
    doctorId: '',
    patientJMBG: '',
    appointmentDate: '',
    reason: ''
  });

  patients = signal<any[]>([]);
  isDoctor = signal(false);
  isPatient = signal(false);
  currentDoctorId = signal('');

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
          this.currentDoctorId.set(user.role === 'doctor' ? user._id || '' : '');
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

    if (this.isDoctor() && !current.patientJMBG.trim()) {
      this.formError.set('Molimo unesite JMBG pacijenta.');
      return;
    }

    if (this.isPatient() && !current.doctorId) {
      this.formError.set('Molimo izaberite doktora.');
      return;
    }

    this.loading.set(true);
    
    const appointmentData = this.isDoctor()
      ? {
          patientJMBG: current.patientJMBG.trim(),
          appointmentDate: new Date(current.appointmentDate),
          reason: current.reason
        }
      : {
          doctorId: current.doctorId,
          appointmentDate: new Date(current.appointmentDate),
          reason: current.reason
        };

    this.appointmentService.createAppointment(appointmentData as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.closeCreateModal();
          this.newAppointment.set({ doctorId: '', patientJMBG: '', appointmentDate: '', reason: '' });
          this.loadAppointments();
        },
        error: (err) => {
          console.error('[Appointments] Create error:', err);
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
    this.newAppointment.set({ doctorId: '', patientJMBG: '', appointmentDate: '', reason: '' });
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

  updateSearchTerm(value: string) {
    this.searchTerm.set(value);
  }

  updateDateFrom(value: string) {
    this.dateFrom.set(value);
  }

  updateDateTo(value: string) {
    this.dateTo.set(value);
  }

  updateSortBy(value: 'dateDesc' | 'dateAsc' | 'statusAsc') {
    this.sortBy.set(value);
  }

  clearFiltersAndSorting() {
    this.searchTerm.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.sortBy.set('dateDesc');
  }

  updateDoctorId(value: string) {
    const current = this.newAppointment();
    this.newAppointment.set({ ...current, doctorId: value });
  }

  updatePatientJMBG(value: string) {
    const current = this.newAppointment();
    this.newAppointment.set({ ...current, patientJMBG: value });
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




