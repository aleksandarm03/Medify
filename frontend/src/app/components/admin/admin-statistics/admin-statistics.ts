import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';
import { DoctorService } from '../../../services/doctor.service';
import { Appointment } from '../../../models/appointment.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DoctorStats {
  doctorId: string;
  doctorName: string;
  total: number;
  scheduled: number;
  completed: number;
  canceled: number;
  completionRate: number;
  cancellationRate: number;
}

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-statistics.html',
  styleUrl: './admin-statistics.css'
})
export class AdminStatisticsComponent implements OnInit, OnDestroy {
  doctorStats = signal<DoctorStats[]>([]);
  loading = signal(false);
  error = signal('');
  
  totalAppointments = signal(0);
  totalScheduled = signal(0);
  totalCompleted = signal(0);
  totalCanceled = signal(0);

  private destroy$ = new Subject<void>();

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.loadStatistics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistics() {
    this.loading.set(true);
    this.error.set('');

    this.appointmentService.getAllAppointments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.calculateStatistics(appointments);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri učitavanju statistike');
          this.loading.set(false);
        }
      });
  }

  private calculateStatistics(appointments: Appointment[]) {
    // Grupiraj termine po doktoru
    const statsMap = new Map<string, DoctorStats>();

    appointments.forEach(apt => {
      if (!apt.doctor) return;

      const doctorId = apt.doctor._id || '';
      const doctorName = `${apt.doctor.firstName} ${apt.doctor.lastName}`;

      if (!statsMap.has(doctorId)) {
        statsMap.set(doctorId, {
          doctorId,
          doctorName,
          total: 0,
          scheduled: 0,
          completed: 0,
          canceled: 0,
          completionRate: 0,
          cancellationRate: 0
        });
      }

      const stats = statsMap.get(doctorId)!;
      stats.total++;

      switch (apt.status) {
        case 'scheduled':
          stats.scheduled++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'canceled':
          stats.canceled++;
          break;
      }
    });

    // Izračunaj procente
    statsMap.forEach(stats => {
      stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      stats.cancellationRate = stats.total > 0 ? Math.round((stats.canceled / stats.total) * 100) : 0;
    });

    // Sortiraj po doktoru
    const sortedStats = Array.from(statsMap.values()).sort((a, b) =>
      a.doctorName.localeCompare(b.doctorName)
    );

    this.doctorStats.set(sortedStats);

    // Izračunaj ukupne statistike
    this.totalAppointments.set(appointments.length);
    this.totalScheduled.set(appointments.filter(a => a.status === 'scheduled').length);
    this.totalCompleted.set(appointments.filter(a => a.status === 'completed').length);
    this.totalCanceled.set(appointments.filter(a => a.status === 'canceled').length);
  }

  getCompletionClass(rate: number): string {
    if (rate >= 80) return 'rate-excellent';
    if (rate >= 60) return 'rate-good';
    if (rate >= 40) return 'rate-fair';
    return 'rate-poor';
  }

  getCancellationClass(rate: number): string {
    if (rate <= 10) return 'rate-excellent';
    if (rate <= 20) return 'rate-good';
    if (rate <= 30) return 'rate-fair';
    return 'rate-poor';
  }
}
