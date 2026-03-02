import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrescriptionService } from '../../services/prescription.service';
import { AuthService } from '../../services/auth.service';
import { Prescription, Medication } from '../../models/prescription.model';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prescriptions.html',
  styleUrl: './prescriptions.css'
})
export class PrescriptionsComponent implements OnInit {
  prescriptions: Prescription[] = [];
  loading = false;
  error = '';
  showCreateModal = false;
  isDoctor = false;
  isPatient = false;

  newPrescription = {
    patientId: '',
    medicalRecordId: '',
    appointmentId: '',
    medications: [] as Medication[],
    validUntil: '',
    notes: ''
  };

  newMedication: Medication = {
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  };

  constructor(
    private prescriptionService: PrescriptionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.isDoctor = user?.role === 'doctor';
    this.isPatient = user?.role === 'patient';
    
    if (this.isPatient) {
      this.loadPatientPrescriptions(user?._id!);
    }
  }

  loadPatientPrescriptions(patientId: string) {
    this.loading = true;
    this.prescriptionService.getPrescriptionsByPatient(patientId).subscribe({
      next: (data) => {
        this.prescriptions = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri učitavanju recepata';
        this.loading = false;
      }
    });
  }

  addMedication() {
    if (this.newMedication.name && this.newMedication.dosage && this.newMedication.frequency && this.newMedication.duration) {
      this.newPrescription.medications.push({ ...this.newMedication });
      this.newMedication = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };
    }
  }

  removeMedication(index: number) {
    this.newPrescription.medications.splice(index, 1);
  }

  createPrescription() {
    if (!this.newPrescription.patientId || this.newPrescription.medications.length === 0) {
      this.error = 'Molimo popunite ID pacijenta i dodajte najmanje jedan lek';
      return;
    }

    this.loading = true;
    const prescriptionData: any = {
      patientId: this.newPrescription.patientId,
      medications: this.newPrescription.medications
    };

    if (this.newPrescription.medicalRecordId) prescriptionData.medicalRecordId = this.newPrescription.medicalRecordId;
    if (this.newPrescription.appointmentId) prescriptionData.appointmentId = this.newPrescription.appointmentId;
    if (this.newPrescription.validUntil) prescriptionData.validUntil = new Date(this.newPrescription.validUntil);
    if (this.newPrescription.notes) prescriptionData.notes = this.newPrescription.notes;

    this.prescriptionService.createPrescription(prescriptionData).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.resetForm();
        if (this.isPatient) {
          this.loadPatientPrescriptions(this.newPrescription.patientId);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri kreiranju recepta';
        this.loading = false;
      }
    });
  }

  updateStatus(id: string, status: string) {
    this.prescriptionService.updatePrescriptionStatus(id, status as any).subscribe({
      next: () => {
        if (this.isPatient && this.authService.getCurrentUser()?._id) {
          this.loadPatientPrescriptions(this.authService.getCurrentUser()!._id!);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri ažuriranju statusa';
      }
    });
  }

  resetForm() {
    this.newPrescription = {
      patientId: '',
      medicalRecordId: '',
      appointmentId: '',
      medications: [],
      validUntil: '',
      notes: ''
    };
    this.newMedication = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'active': 'status-active',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classes[status] || '';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'active': 'Aktivan',
      'completed': 'Završen',
      'cancelled': 'Otkazan'
    };
    return texts[status] || status;
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('sr-RS');
  }
}




