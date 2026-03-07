import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { DoctorService } from '../../../services/doctor.service';

interface AppointmentDraft {
  doctorId: string;
  patientJMBG: string;
  appointmentDate: string;
  reason: string;
}

interface AvailableSlot {
  value: string;
  label: string;
}

@Component({
  selector: 'app-appointment-form-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-form-modal.html',
  styleUrl: './appointment-form-modal.css'
})
export class AppointmentFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() isDoctor = false;
  @Input() isPatient = false;
  @Input() doctors: any[] = [];
  @Input() appointment: AppointmentDraft = {
    doctorId: '',
    patientJMBG: '',
    appointmentDate: '',
    reason: ''
  };
  @Input() doctorId = '';
  @Input() minDate = '';
  @Input() loading = false;
  @Input() error = '';

  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();
  @Output() doctorIdChange = new EventEmitter<string>();
  @Output() patientJMBGChange = new EventEmitter<string>();
  @Output() appointmentDateChange = new EventEmitter<string>();
  @Output() reasonChange = new EventEmitter<string>();

  selectedDate = signal('');
  selectedDoctor = signal('');
  selectedTimeSlot = signal('');
  availableSlots = signal<AvailableSlot[]>([]);
  loadingSlots = signal(false);
  slotsError = signal('');

  constructor(private doctorService: DoctorService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (!changes['isOpen'].currentValue) {
        this.resetAvailability();
      } else {
        this.selectedDoctor.set(this.appointment.doctorId || '');
      }
    }
  }

  resetAvailability() {
    this.selectedDate.set('');
    this.selectedDoctor.set('');
    this.selectedTimeSlot.set('');
    this.availableSlots.set([]);
    this.slotsError.set('');
  }

  onOverlayClick() {
    this.close.emit();
  }

  onSubmit() {
    this.submitForm.emit();
  }

  onDoctorChange(value: string) {
    this.selectedDoctor.set(value);
    this.doctorIdChange.emit(value);
    this.selectedDate.set('');
    this.selectedTimeSlot.set('');
    this.availableSlots.set([]);
    this.slotsError.set('');
  }

  onPatientJMBGChange(value: string) {
    this.patientJMBGChange.emit(value);
  }

  onDateChange(value: string) {
    this.selectedDate.set(value);
    this.selectedTimeSlot.set('');

    const targetDoctorId = this.isDoctor ? this.doctorId : this.selectedDoctor();
    if (targetDoctorId && value) {
      this.loadAvailableSlots(targetDoctorId, value);
    }
  }

  onTimeSlotSelect(slot: string) {
    this.selectedTimeSlot.set(slot);
    this.appointmentDateChange.emit(slot);
  }

  onReasonChange(value: string) {
    this.reasonChange.emit(value);
  }

  loadAvailableSlots(doctorId: string, date: string) {
    this.loadingSlots.set(true);
    this.slotsError.set('');
    this.availableSlots.set([]);

    this.doctorService.getAvailableSlots(doctorId, date).subscribe({
      next: (data) => {
        const timeSlots = data.availableSlots.map((isoString: string) => {
          const slotDate = new Date(isoString);
          const hours = String(slotDate.getHours()).padStart(2, '0');
          const minutes = String(slotDate.getMinutes()).padStart(2, '0');
          return {
            value: isoString,
            label: `${hours}:${minutes}`
          };
        });

        this.availableSlots.set(timeSlots);
        if (timeSlots.length === 0) {
          this.slotsError.set('Nema dostupnih termina za izabrani datum.');
        }
        this.loadingSlots.set(false);
      },
      error: (err) => {
        this.slotsError.set(err.error?.message || 'Greška pri učitavanju dostupnih termina.');
        this.loadingSlots.set(false);
      }
    });
  }
}
