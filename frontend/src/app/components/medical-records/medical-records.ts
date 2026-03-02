import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicalRecordService } from '../../services/medical-record.service';
import { AuthService } from '../../services/auth.service';
import { MedicalRecord } from '../../models/medical-record.model';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-records.html',
  styleUrl: './medical-records.css'
})
export class MedicalRecordsComponent implements OnInit {
  records: MedicalRecord[] = [];
  loading = false;
  error = '';
  showCreateModal = false;
  isDoctor = false;
  isNurse = false;
  isPatient = false;

  newRecord = {
    patientId: '',
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    examinationNotes: '',
    treatment: '',
    recommendations: '',
    bloodPressure: '',
    heartRate: 0,
    temperature: 0,
    weight: 0,
    height: 0,
    followUpDate: ''
  };

  constructor(
    private medicalRecordService: MedicalRecordService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.isDoctor = user?.role === 'doctor';
    this.isNurse = user?.role === 'nurse';
    this.isPatient = user?.role === 'patient';
    
    if (this.isPatient) {
      this.loadPatientRecords(user?._id!);
    }
  }

  loadPatientRecords(patientId: string) {
    this.loading = true;
    this.medicalRecordService.getMedicalRecordsByPatient(patientId).subscribe({
      next: (data) => {
        this.records = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri učitavanju kartona';
        this.loading = false;
      }
    });
  }

  createRecord() {
    if (!this.newRecord.patientId || !this.newRecord.diagnosis) {
      this.error = 'Molimo popunite obavezna polja (ID pacijenta i dijagnozu)';
      return;
    }

    this.loading = true;
    const recordData: any = {
      patientId: this.newRecord.patientId,
      diagnosis: this.newRecord.diagnosis
    };

    if (this.newRecord.appointmentId) recordData.appointmentId = this.newRecord.appointmentId;
    if (this.newRecord.symptoms) recordData.symptoms = this.newRecord.symptoms.split(',').map(s => s.trim());
    if (this.newRecord.examinationNotes) recordData.examinationNotes = this.newRecord.examinationNotes;
    if (this.newRecord.treatment) recordData.treatment = this.newRecord.treatment;
    if (this.newRecord.recommendations) recordData.recommendations = this.newRecord.recommendations;
    if (this.newRecord.followUpDate) recordData.followUpDate = new Date(this.newRecord.followUpDate);

    if (this.newRecord.bloodPressure || this.newRecord.heartRate || this.newRecord.temperature || this.newRecord.weight || this.newRecord.height) {
      recordData.vitalSigns = {};
      if (this.newRecord.bloodPressure) recordData.vitalSigns.bloodPressure = this.newRecord.bloodPressure;
      if (this.newRecord.heartRate) recordData.vitalSigns.heartRate = this.newRecord.heartRate;
      if (this.newRecord.temperature) recordData.vitalSigns.temperature = this.newRecord.temperature;
      if (this.newRecord.weight) recordData.vitalSigns.weight = this.newRecord.weight;
      if (this.newRecord.height) recordData.vitalSigns.height = this.newRecord.height;
    }

    this.medicalRecordService.createMedicalRecord(recordData).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.resetForm();
        if (this.isPatient) {
          this.loadPatientRecords(this.newRecord.patientId);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri kreiranju kartona';
        this.loading = false;
      }
    });
  }

  resetForm() {
    this.newRecord = {
      patientId: '',
      appointmentId: '',
      diagnosis: '',
      symptoms: '',
      examinationNotes: '',
      treatment: '',
      recommendations: '',
      bloodPressure: '',
      heartRate: 0,
      temperature: 0,
      weight: 0,
      height: 0,
      followUpDate: ''
    };
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('sr-RS');
  }
}




