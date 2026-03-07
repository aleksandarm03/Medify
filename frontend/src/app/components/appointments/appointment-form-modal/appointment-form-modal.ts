import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

interface AppointmentDraft {
  patientId: string;
  appointmentDate: string;
  reason: string;
}

@Component({
  selector: 'app-appointment-form-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-form-modal.html',
  styleUrl: './appointment-form-modal.css'
})
export class AppointmentFormModalComponent {
  @Input() isOpen = false;
  @Input() isDoctor = false;
  @Input() isPatient = false;
  @Input() doctors: any[] = [];
  @Input() appointment: AppointmentDraft = {
    patientId: '',
    appointmentDate: '',
    reason: ''
  };
  @Input() minDate = '';
  @Input() loading = false;
  @Input() error = '';

  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();
  @Output() patientIdChange = new EventEmitter<string>();
  @Output() appointmentDateChange = new EventEmitter<string>();
  @Output() reasonChange = new EventEmitter<string>();

  onOverlayClick() {
    this.close.emit();
  }

  onSubmit() {
    this.submitForm.emit();
  }

  onPatientChange(value: string) {
    this.patientIdChange.emit(value);
  }

  onDateChange(value: string) {
    this.appointmentDateChange.emit(value);
  }

  onReasonChange(value: string) {
    this.reasonChange.emit(value);
  }
}
