import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { DoctorAvailability, CreateAvailabilityRequest } from '../../models/doctor.model';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability.html',
  styleUrl: './availability.css'
})
export class AvailabilityComponent implements OnInit {
  availabilities: DoctorAvailability[] = [];
  loading = false;
  error = '';
  showCreateModal = false;

  newAvailability: CreateAvailabilityRequest = {
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    breakStart: '',
    breakEnd: '',
    appointmentDuration: 30
  };

  daysOfWeek = [
    { value: 0, name: 'Nedelja' },
    { value: 1, name: 'Ponedeljak' },
    { value: 2, name: 'Utorak' },
    { value: 3, name: 'Sreda' },
    { value: 4, name: 'Četvrtak' },
    { value: 5, name: 'Petak' },
    { value: 6, name: 'Subota' }
  ];

  doctorId = '';

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.doctorId = user?._id || '';
    this.loadAvailability();
  }

  loadAvailability() {
    this.loading = true;
    this.doctorService.getDoctorAvailability(this.doctorId).subscribe({
      next: (data) => {
        this.availabilities = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri učitavanju dostupnosti';
        this.loading = false;
      }
    });
  }

  createAvailability() {
    if (!this.newAvailability.startTime || !this.newAvailability.endTime) {
      this.error = 'Molimo popunite početno i završno vreme';
      return;
    }

    this.loading = true;
    this.doctorService.setDoctorAvailability(this.doctorId, this.newAvailability).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.resetForm();
        this.loadAvailability();
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri kreiranju dostupnosti';
        this.loading = false;
      }
    });
  }

  deleteAvailability(id: string) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu dostupnost?')) {
      return;
    }

    this.doctorService.deleteAvailability(id).subscribe({
      next: () => {
        this.loadAvailability();
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri brisanju dostupnosti';
      }
    });
  }

  resetForm() {
    this.newAvailability = {
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      breakStart: '',
      breakEnd: '',
      appointmentDuration: 30
    };
  }

  getDayName(dayOfWeek: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayOfWeek);
    return day?.name || '';
  }
}




