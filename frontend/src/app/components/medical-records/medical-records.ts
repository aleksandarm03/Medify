import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicalRecordService } from '../../services/medical-record.service';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { MedicalRecord } from '../../models/medical-record.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type MedicalRecordForm = {
  patientId: string;
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  examinationNotes: string;
  treatment: string;
  recommendations: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  followUpDate: string;
};

function createEmptyForm(): MedicalRecordForm {
  return {
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

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-records.html',
  styleUrl: './medical-records.css'
})
export class MedicalRecordsComponent implements OnInit, OnDestroy {
  records = signal<MedicalRecord[]>([]);
  loading = signal(false);
  error = signal('');
  showCreateModal = signal(false);
  isDoctor = signal(false);
  isNurse = signal(false);
  isPatient = signal(false);
  prefilledDoctorName = signal('');
  prefilledPatientName = signal('');
  isPrefilledFromAppointment = signal(false);
  newRecord = signal<MedicalRecordForm>(createEmptyForm());

  private destroy$ = new Subject<void>();

  constructor(
    private medicalRecordService: MedicalRecordService,
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.isDoctor.set(user?.role === 'doctor');
    this.isNurse.set(user?.role === 'nurse');
    this.isPatient.set(user?.role === 'patient');

    if (user) {
      this.prefilledDoctorName.set(`${user.firstName || ''} ${user.lastName || ''}`.trim());
    }

    if (this.isPatient()) {
      this.loadPatientRecords(user?._id!);
    }

    if (this.isDoctor()) {
      this.loadDoctorRecords(user?._id!);
    }

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const appointmentId = params.get('appointmentId');
        const shouldOpenCreate = params.get('openCreate') === '1';

        if (shouldOpenCreate && appointmentId && this.isDoctor()) {
          this.prefillFormFromAppointment(appointmentId);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  prefillFormFromAppointment(appointmentId: string) {
    this.loading.set(true);
    this.error.set('');

    this.appointmentService.getAppointmentById(appointmentId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (appointment) => {
        const patientId = appointment.patient?._id || '';
        this.newRecord.update(current => ({
          ...current,
          patientId,
          appointmentId: appointment._id || ''
        }));
        if (patientId) {
          this.loadPatientRecords(patientId);
        }
        this.prefilledPatientName.set(`${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.trim());
        this.showCreateModal.set(true);
        this.isPrefilledFromAppointment.set(true);
        this.loading.set(false);

        // Očisti query params da se modal ne otvara ponovo na refresh-u.
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri pripremi medicinskog zapisa iz termina');
        this.loading.set(false);
      }
    });
  }

  openCreateModalManual() {
    this.showCreateModal.set(true);
    this.isPrefilledFromAppointment.set(false);
    this.prefilledPatientName.set('');
    this.error.set('');
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.error.set('');
    this.resetForm();
  }

  openCreatePrescription(record: MedicalRecord) {
    const patientId = record.patient?._id;
    const medicalRecordId = record._id;
    if (!patientId || !medicalRecordId) {
      this.error.set('Nedostaju podaci za kreiranje recepta iz kartona.');
      return;
    }

    this.router.navigate(['/prescriptions'], {
      queryParams: {
        openCreate: '1',
        patientId,
        medicalRecordId,
        appointmentId: record.appointment?._id || ''
      }
    });
  }

  markMedicalRecordAsNotNeeded() {
    this.closeCreateModal();
    this.router.navigate(['/appointments']);
  }

  loadPatientRecords(patientId: string) {
    this.loading.set(true);
    this.medicalRecordService.getMedicalRecordsByPatient(patientId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri učitavanju kartona');
        this.loading.set(false);
      }
    });
  }

  loadDoctorRecords(doctorId: string) {
    this.loading.set(true);
    this.medicalRecordService.getMedicalRecordsByDoctor(doctorId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri učitavanju kartona');
        this.loading.set(false);
      }
    });
  }

  createRecord() {
    const current = this.newRecord();

    if (!current.patientId || !current.diagnosis) {
      this.error.set('Molimo popunite obavezna polja (ID pacijenta i dijagnozu)');
      return;
    }

    this.loading.set(true);
    const recordData: any = {
      patientId: current.patientId,
      diagnosis: current.diagnosis
    };

    if (current.appointmentId) recordData.appointmentId = current.appointmentId;
    if (current.symptoms) recordData.symptoms = current.symptoms.split(',').map(s => s.trim());
    if (current.examinationNotes) recordData.examinationNotes = current.examinationNotes;
    if (current.treatment) recordData.treatment = current.treatment;
    if (current.recommendations) recordData.recommendations = current.recommendations;
    if (current.followUpDate) recordData.followUpDate = new Date(current.followUpDate);

    if (current.bloodPressure || current.heartRate || current.temperature || current.weight || current.height) {
      recordData.vitalSigns = {};
      if (current.bloodPressure) recordData.vitalSigns.bloodPressure = current.bloodPressure;
      if (current.heartRate) recordData.vitalSigns.heartRate = current.heartRate;
      if (current.temperature) recordData.vitalSigns.temperature = current.temperature;
      if (current.weight) recordData.vitalSigns.weight = current.weight;
      if (current.height) recordData.vitalSigns.height = current.height;
    }

    this.medicalRecordService.createMedicalRecord(recordData).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const patientIdForReload = current.patientId;
        this.closeCreateModal();
        if (patientIdForReload) {
          this.loadPatientRecords(patientIdForReload);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri kreiranju kartona');
        this.loading.set(false);
      }
    });
  }

  updateTextField(field: keyof MedicalRecordForm, value: string) {
    this.newRecord.update(current => ({
      ...current,
      [field]: value
    }));
  }

  updateNumberField(field: keyof MedicalRecordForm, value: number | string | null) {
    const numericValue = typeof value === 'number' ? value : Number(value);
    this.newRecord.update(current => ({
      ...current,
      [field]: Number.isFinite(numericValue) ? numericValue : 0
    }));
  }

  resetForm() {
    this.isPrefilledFromAppointment.set(false);
    this.prefilledPatientName.set('');
    this.newRecord.set(createEmptyForm());
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('sr-RS');
  }
}




