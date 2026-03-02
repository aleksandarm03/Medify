import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { Appointment } from '../../models/appointment.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css'
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  loading = false;
  error = '';
  showCreateModal = false;
  statusFilter = '';

  newAppointment = {
    patientId: '',
    appointmentDate: '',
    reason: ''
  };

  patients: any[] = [];
  isDoctor = false;
  isPatient = false;

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.isDoctor = user?.role === 'doctor';
    this.isPatient = user?.role === 'patient';
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading = true;
    this.error = '';
    const endpoint = this.isDoctor 
      ? this.appointmentService.getAppointmentsByDoctor(this.statusFilter || undefined)
      : this.appointmentService.getAppointmentsByPatient(this.statusFilter || undefined);

    endpoint.subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri učitavanju termina';
        this.loading = false;
      }
    });
  }

  createAppointment() {
    if (!this.newAppointment.patientId || !this.newAppointment.appointmentDate || !this.newAppointment.reason) {
      this.error = 'Molimo popunite sva polja';
      return;
    }

    this.loading = true;
    this.appointmentService.createAppointment({
      patientId: this.newAppointment.patientId,
      appointmentDate: new Date(this.newAppointment.appointmentDate),
      reason: this.newAppointment.reason
    }).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.newAppointment = { patientId: '', appointmentDate: '', reason: '' };
        this.loadAppointments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri kreiranju termina';
        this.loading = false;
      }
    });
  }

  updateStatus(id: string, status: string) {
    this.appointmentService.updateAppointmentStatus(id, status as any).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri ažuriranju statusa';
      }
    });
  }

  deleteAppointment(id: string) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj termin?')) {
      return;
    }

    this.appointmentService.deleteAppointment(id).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri brisanju termina';
      }
    });
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
}




