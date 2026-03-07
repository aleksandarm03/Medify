import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment } from '../../../models/appointment.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-appointments.html',
  styleUrl: './admin-appointments.css'
})
export class AdminAppointmentsComponent implements OnInit, OnDestroy {
  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  error = signal('');
  statusFilter = signal('');

  private destroy$ = new Subject<void>();

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.loadAllAppointments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllAppointments() {
    this.loading.set(true);
    this.error.set('');
    this.appointmentService.getAllAppointments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  updateStatusFilter(status: string) {
    this.statusFilter.set(status);
  }

  getFilteredAppointments() {
    if (!this.statusFilter()) {
      return this.appointments();
    }
    return this.appointments().filter(apt => apt.status === this.statusFilter());
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'status-scheduled';
      case 'completed':
        return 'status-completed';
      case 'canceled':
        return 'status-canceled';
      default:
        return 'status-unknown';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'Zakazan';
      case 'completed':
        return 'Završen';
      case 'canceled':
        return 'Otkazan';
      default:
        return status;
    }
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
