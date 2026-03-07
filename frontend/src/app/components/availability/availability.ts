import { Component, OnInit, signal } from '@angular/core';
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
  availabilities = signal<DoctorAvailability[]>([]);
  loading = signal(false);
  pageError = signal('');
  formError = signal('');
  showCreateModal = signal(false);

  newAvailability = signal<CreateAvailabilityRequest>({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    breakStart: '',
    breakEnd: '',
    appointmentDuration: 30
  });

  daysOfWeek = [
    { value: 0, name: 'Nedelja' },
    { value: 1, name: 'Ponedeljak' },
    { value: 2, name: 'Utorak' },
    { value: 3, name: 'Sreda' },
    { value: 4, name: 'Četvrtak' },
    { value: 5, name: 'Petak' },
    { value: 6, name: 'Subota' }
  ];

  doctorId = signal('');

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.doctorId.set(user?._id || '');

    if (!this.doctorId()) {
      this.pageError.set('Doktor nije pronadjen. Prijavite se ponovo.');
      return;
    }

    this.loadAvailability();
  }

  loadAvailability() {
    if (!this.doctorId()) {
      return;
    }

    this.loading.set(true);
    this.pageError.set('');

    this.doctorService.getDoctorAvailability(this.doctorId()).subscribe({
      next: (data) => {
        this.availabilities.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greska pri ucitavanju dostupnosti');
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.formError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.formError.set('');
    this.resetForm();
  }

  createAvailability() {
    const current = this.newAvailability();

    if (!current.startTime || !current.endTime) {
      this.formError.set('Molimo popunite pocetno i zavrsno vreme.');
      return;
    }

    if (current.startTime >= current.endTime) {
      this.formError.set('Pocetno vreme mora biti pre zavrsnog vremena.');
      return;
    }

    if ((current.breakStart && !current.breakEnd) || (!current.breakStart && current.breakEnd)) {
      this.formError.set('Za pauzu morate uneti i pocetak i kraj.');
      return;
    }

    if (current.breakStart && current.breakEnd) {
      const start = this.toMinutes(current.startTime);
      const end = this.toMinutes(current.endTime);
      const breakStart = this.toMinutes(current.breakStart);
      const breakEnd = this.toMinutes(current.breakEnd);

      if (breakStart >= breakEnd) {
        this.formError.set('Pocetak pauze mora biti pre kraja pauze.');
        return;
      }

      if (breakStart < start || breakEnd > end) {
        this.formError.set('Pauza mora biti unutar radnog vremena.');
        return;
      }
    }

    const duration = current.appointmentDuration ?? 30;
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
      this.formError.set('Trajanje termina mora biti ceo broj izmedju 5 i 240 minuta.');
      return;
    }

    const dayExists = this.availabilities().some(
      (availability) => availability.dayOfWeek === current.dayOfWeek
    );

    if (dayExists) {
      this.formError.set('Za izabrani dan vec postoji dostupnost. Izmenite ili obrisite postojeci unos.');
      return;
    }

    this.loading.set(true);
    this.formError.set('');

    this.doctorService.setDoctorAvailability(this.doctorId(), current).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadAvailability();
      },
      error: (err) => {
        this.formError.set(err.error?.message || 'Greska pri kreiranju dostupnosti');
        this.loading.set(false);
      }
    });
  }

  deleteAvailability(id: string) {
    if (!confirm('Da li ste sigurni da zelite da obrisete ovu dostupnost?')) {
      return;
    }

    this.loading.set(true);
    this.doctorService.deleteAvailability(id).subscribe({
      next: () => {
        this.loadAvailability();
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greska pri brisanju dostupnosti');
        this.loading.set(false);
      }
    });
  }

  resetForm() {
    this.newAvailability.set({
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      breakStart: '',
      breakEnd: '',
      appointmentDuration: 30
    });
  }

  updateDayOfWeek(value: string) {
    this.newAvailability.update((current) => ({ ...current, dayOfWeek: Number(value) }));
  }

  updateStartTime(value: string) {
    this.newAvailability.update((current) => ({ ...current, startTime: value }));
  }

  updateEndTime(value: string) {
    this.newAvailability.update((current) => ({ ...current, endTime: value }));
  }

  updateBreakStart(value: string) {
    this.newAvailability.update((current) => ({ ...current, breakStart: value }));
  }

  updateBreakEnd(value: string) {
    this.newAvailability.update((current) => ({ ...current, breakEnd: value }));
  }

  updateAppointmentDuration(value: string) {
    const duration = Number(value);
    this.newAvailability.update((current) => ({
      ...current,
      appointmentDuration: Number.isFinite(duration) && duration > 0 ? duration : 30
    }));
  }

  updateIsAvailable(value: boolean) {
    this.newAvailability.update((current) => ({ ...current, isAvailable: value }));
  }

  getDayName(dayOfWeek: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayOfWeek);
    return day?.name || '';
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}




