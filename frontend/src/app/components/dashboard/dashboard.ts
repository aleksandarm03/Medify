import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { catchError, finalize, take, takeUntil } from 'rxjs/operators';
import { AppointmentService } from '../../services/appointment.service';
import { MedicalRecordService } from '../../services/medical-record.service';
import { PrescriptionService } from '../../services/prescription.service';
import { DoctorService } from '../../services/doctor.service';
import { forkJoin, of } from 'rxjs';
import { User } from '../../models/user.model';
import { Appointment } from '../../models/appointment.model';

interface DashboardStat {
  label: string;
  value: number | string;
  hint: string;
}

interface AppointmentStatusSummary {
  scheduled: number;
  completed: number;
  canceled: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user = signal<any>(null);
  isLoading = signal(false);
  statsLoading = signal(false);
  lastRefresh = signal<Date>(new Date());
  stats = signal<DashboardStat[]>([]);
  appointmentStatus = signal<AppointmentStatusSummary | null>(null);
  statsError = signal('');

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private appointmentService: AppointmentService,
    private medicalRecordService: MedicalRecordService,
    private prescriptionService: PrescriptionService,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    // Ako je korisnik admin, preusmeri na admin dashboard
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.refreshDashboard();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshDashboard() {
    this.isLoading.set(true);

    // Uzimamo samo jednu vrednost da izbegnemo višestruke aktivne pretplate.
    this.authService.currentUser$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(user => {
        this.user.set(user);
        this.lastRefresh.set(new Date());
        this.isLoading.set(false);
        this.loadStatsForCurrentRole(user);
      });
  }

  private loadStatsForCurrentRole(user: User | null): void {
    this.statsError.set('');
    this.appointmentStatus.set(null);

    if (!user) {
      this.stats.set([]);
      this.statsError.set('Korisnik nije učitan. Osvežite stranicu.');
      return;
    }

    if (!user._id) {
      this.stats.set([]);
      this.statsError.set('Nedostaje identifikator korisnika za učitavanje statistika.');
      return;
    }

    this.statsLoading.set(true);

    if (user.role === 'patient') {
      this.loadPatientStats(user);
      return;
    }

    if (user.role === 'doctor') {
      this.loadDoctorStats(user);
      return;
    }

    this.statsLoading.set(false);
    this.stats.set([]);
  }

  private loadPatientStats(user: User): void {
    forkJoin({
      appointments: this.appointmentService.getAppointmentsByPatient().pipe(catchError(() => of([]))),
      records: this.medicalRecordService.getMedicalRecordsByPatient(user._id!).pipe(catchError(() => of([]))),
      activePrescriptions: this.prescriptionService.getActivePrescriptions(user._id!).pipe(catchError(() => of([])))
    })
      .pipe(finalize(() => this.statsLoading.set(false)))
      .subscribe(({ appointments, records, activePrescriptions }) => {
        const status = this.createAppointmentStatusSummary(appointments);
        const upcoming = appointments.filter(a => a.status === 'scheduled' && this.isUpcoming(a.appointmentDate)).length;

        this.appointmentStatus.set(status);
        this.stats.set([
          { label: 'Ukupno termina', value: appointments.length, hint: 'Svi tvoji zabeleženi termini' },
          { label: 'Predstojeći termini', value: upcoming, hint: 'Zakazani termini u narednom periodu' },
          { label: 'Aktivni recepti', value: activePrescriptions.length, hint: 'Recepti koji su trenutno važeći' },
          { label: 'Medicinski kartoni', value: records.length, hint: 'Broj unetih medicinskih kartona' }
        ]);
      });
  }

  private loadDoctorStats(user: User): void {
    forkJoin({
      appointments: this.appointmentService.getAppointmentsByDoctor().pipe(catchError(() => of([]))),
      records: this.medicalRecordService.getMedicalRecordsByDoctor(user._id!).pipe(catchError(() => of([]))),
      availability: this.doctorService.getDoctorAvailability(user._id!).pipe(catchError(() => of([])))
    })
      .pipe(finalize(() => this.statsLoading.set(false)))
      .subscribe(({ appointments, records, availability }) => {
        const status = this.createAppointmentStatusSummary(appointments);
        const today = appointments.filter(a => this.isToday(a.appointmentDate)).length;

        this.appointmentStatus.set(status);
        this.stats.set([
          { label: 'Ukupno termina', value: appointments.length, hint: 'Svi termini koji su povezani sa tobom' },
          { label: 'Termini danas', value: today, hint: 'Broj termina za današnji dan' },
          { label: 'Kreirani kartoni', value: records.length, hint: 'Medicinski kartoni koje si unela/o' },
          { label: 'Definisane dostupnosti', value: availability.length, hint: 'Koliko rasporeda dostupnosti je postavljeno' }
        ]);
      });
  }

  private createAppointmentStatusSummary(appointments: Appointment[]): AppointmentStatusSummary {
    return appointments.reduce(
      (acc, appointment) => {
        if (appointment.status === 'scheduled') {
          acc.scheduled += 1;
        } else if (appointment.status === 'completed') {
          acc.completed += 1;
        } else if (appointment.status === 'canceled') {
          acc.canceled += 1;
        }
        return acc;
      },
      { scheduled: 0, completed: 0, canceled: 0 }
    );
  }

  private isUpcoming(dateValue: Date): boolean {
    return new Date(dateValue).getTime() >= Date.now();
  }

  private isToday(dateValue: Date): boolean {
    const date = new Date(dateValue);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
  }

  getRoleName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'admin': 'Administrator',
      'doctor': 'Doktor',
      'patient': 'Pacijent'
    };
    return roleNames[role] || role;
  }

  isPatient() {
    return this.user()?.role === 'patient';
  }

  isDoctor() {
    return this.user()?.role === 'doctor';
  }

  isAdmin() {
    return this.user()?.role === 'admin';
  }
}




