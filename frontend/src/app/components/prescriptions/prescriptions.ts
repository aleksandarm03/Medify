import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PrescriptionService } from '../../services/prescription.service';
import { AuthService } from '../../services/auth.service';
import { Prescription, Medication } from '../../models/prescription.model';
import { MedicalRecord } from '../../models/medical-record.model';
import { MedicalRecordService } from '../../services/medical-record.service';
import { AppointmentService } from '../../services/appointment.service';
import { catchError, forkJoin, of } from 'rxjs';

function resolvePatientName(patient: any, patientSnapshot?: { firstName?: string; lastName?: string }): string {
  const firstName = patient?.firstName || patientSnapshot?.firstName || '';
  const lastName = patient?.lastName || patientSnapshot?.lastName || '';
  return `${firstName} ${lastName}`.trim();
}

function resolveDoctorName(doctor: any, doctorSnapshot?: { firstName?: string; lastName?: string }): string {
  const firstName = doctor?.firstName || doctorSnapshot?.firstName || '';
  const lastName = doctor?.lastName || doctorSnapshot?.lastName || '';
  return `${firstName} ${lastName}`.trim();
}

function normalizePrescription(prescription: Prescription): Prescription {
  const normalized = { ...prescription } as any;

  if (!normalized.patient && normalized.patientSnapshot) {
    normalized.patient = {
      _id: normalized.patientSnapshot.patientId || '',
      firstName: normalized.patientSnapshot.firstName || '',
      lastName: normalized.patientSnapshot.lastName || ''
    };
  }

  if (!normalized.doctor && normalized.doctorSnapshot) {
    normalized.doctor = {
      _id: normalized.doctorSnapshot.doctorId || '',
      firstName: normalized.doctorSnapshot.firstName || '',
      lastName: normalized.doctorSnapshot.lastName || '',
      specialization: normalized.doctorSnapshot.specialization || ''
    };
  }

  return normalized;
}

function resolveRecordPatientId(record: MedicalRecord): string {
  const patient = record.patient as any;
  if (typeof patient === 'string') {
    return patient;
  }
  if (patient?._id) {
    return String(patient._id);
  }
  if (record.patientSnapshot?.patientId) {
    return String(record.patientSnapshot.patientId);
  }
  return '';
}

function normalizeMedicalRecord(record: MedicalRecord): MedicalRecord {
  const patientId = resolveRecordPatientId(record);
  if (!patientId) {
    return record;
  }

  const patient = record.patient as any;
  return {
    ...record,
    patient: {
      _id: patientId,
      firstName: typeof patient === 'object' ? (patient?.firstName || '') : (record.patientSnapshot?.firstName || ''),
      lastName: typeof patient === 'object' ? (patient?.lastName || '') : (record.patientSnapshot?.lastName || '')
    }
  };
}

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prescriptions.html',
  styleUrl: './prescriptions.css'
})
export class PrescriptionsComponent implements OnInit {
  prescriptions = signal<Prescription[]>([]);
  loading = signal(false);
  pageError = signal('');
  formError = signal('');
  statusFilter = signal('');
  searchTerm = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  sortBy = signal<'issueDateDesc' | 'issueDateAsc' | 'statusAsc'>('issueDateDesc');
  showCreateModal = signal(false);
  isDoctor = signal(false);
  isPatient = signal(false);
  doctorMedicalRecords = signal<MedicalRecord[]>([]);
  filteredMedicalRecords = signal<MedicalRecord[]>([]);
  examinedPatients = signal<any[]>([]);
  addMedicationPrescriptionId = signal<string | null>(null);
  addMedicationError = signal('');
  addMedicationDraft = signal<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  visiblePrescriptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const fromDate = this.dateFrom() ? new Date(this.dateFrom()) : null;
    const toDate = this.dateTo() ? new Date(this.dateTo()) : null;

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    const filtered = this.prescriptions().filter((prescription) => {
      const issueDate = new Date(prescription.issueDate);
      const patientName = resolvePatientName(prescription.patient, prescription.patientSnapshot).toLowerCase();
      const doctorName = resolveDoctorName(prescription.doctor, (prescription as any).doctorSnapshot).toLowerCase();
      const notes = (prescription.notes || '').toLowerCase();
      const status = (prescription.status || '').toLowerCase();
      const medicationsText = (prescription.medications || [])
        .map((med) => `${med.name || ''} ${med.dosage || ''} ${med.frequency || ''} ${med.duration || ''}`.toLowerCase())
        .join(' ');

      const matchesTerm = !term
        || patientName.includes(term)
        || doctorName.includes(term)
        || notes.includes(term)
        || status.includes(term)
        || medicationsText.includes(term);

      const matchesFrom = !fromDate || issueDate >= fromDate;
      const matchesTo = !toDate || issueDate <= toDate;

      return matchesTerm && matchesFrom && matchesTo;
    });

    return [...filtered].sort((a, b) => {
      if (this.sortBy() === 'issueDateAsc') {
        return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
      }

      if (this.sortBy() === 'statusAsc') {
        return (a.status || '').localeCompare(b.status || '');
      }

      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    });
  });

  newPrescription = signal({
    patientId: '',
    medicalRecordId: '',
    appointmentId: '',
    medications: [] as Medication[],
    validUntil: '',
    notes: ''
  });

  newMedication = signal<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  constructor(
    private prescriptionService: PrescriptionService,
    private authService: AuthService,
    private medicalRecordService: MedicalRecordService,
    private appointmentService: AppointmentService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.isDoctor.set(user?.role === 'doctor');
    this.isPatient.set(user?.role === 'patient');
    
    if (this.isPatient()) {
      this.loadPatientPrescriptions(user?._id!);
    }

    if (this.isDoctor() && user?._id) {
      this.loading.set(true);
      this.loadDoctorMedicalRecords(user._id);
      this.loadExaminedPatientsFromAppointments();
    }

    this.route.queryParamMap.subscribe(params => {
      const shouldOpenCreate = params.get('openCreate') === '1';
      if (!shouldOpenCreate || !this.isDoctor()) {
        return;
      }

      const patientId = params.get('patientId') || '';
      const medicalRecordId = params.get('medicalRecordId') || '';
      const appointmentId = params.get('appointmentId') || '';

      this.openCreateModal();
      const current = this.newPrescription();
      this.newPrescription.set({
        ...current,
        patientId,
        medicalRecordId,
        appointmentId
      });
      this.ensurePatientOption(patientId);
      this.filterMedicalRecordsForPatient(patientId);

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    });
  }

  loadDoctorMedicalRecords(doctorId: string) {
    this.medicalRecordService.getMedicalRecordsByDoctor(doctorId).subscribe({
      next: (records) => {
        const normalizedRecords = records.map(normalizeMedicalRecord);
        this.doctorMedicalRecords.set(normalizedRecords);
        this.mergePatientsIntoExamined(normalizedRecords.map(record => record.patient));
        this.filterMedicalRecordsForPatient(this.newPrescription().patientId);
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greška pri učitavanju pacijenata i kartona');
      }
    });
  }

  loadExaminedPatientsFromAppointments() {
    this.appointmentService.getAppointmentsByDoctor('completed').subscribe({
      next: (appointments) => {
        this.mergePatientsIntoExamined(appointments.map(appointment => appointment.patient));
      },
      error: () => {
        // Ne prekidamo flow kreiranja recepta ako ovaj poziv ne uspe.
      }
    });
  }

  mergePatientsIntoExamined(patients: any[]) {
    const byPatient = new Map<string, any>();

    for (const existing of this.examinedPatients()) {
      if (existing?._id) {
        byPatient.set(existing._id, existing);
      }
    }

    for (const patient of patients) {
      const patientId = typeof patient === 'string' ? patient : patient?._id;
      if (!patientId) {
        continue;
      }
      if (!byPatient.has(patientId)) {
        byPatient.set(patientId, typeof patient === 'string' ? { _id: patientId } : patient);
      }
    }

    this.examinedPatients.set(Array.from(byPatient.values()));

    if (this.isDoctor()) {
      this.loadPrescriptionsForExaminedPatients();
    }
  }

  loadPrescriptionsForExaminedPatients() {
    const patients = this.examinedPatients().filter((patient) => !!patient?._id);
    const status = this.statusFilter() || undefined;

    if (patients.length === 0) {
      this.prescriptions.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.pageError.set('');

    const requests = patients.map((patient) =>
      this.prescriptionService.getPrescriptionsByPatient(patient._id, status).pipe(
        catchError(() => of([] as Prescription[]))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const byId = new Map<string, Prescription>();

        for (const prescriptionList of results) {
          for (const prescription of prescriptionList) {
            const normalizedPrescription = normalizePrescription(prescription);
            if (normalizedPrescription?._id) {
              byId.set(normalizedPrescription._id, normalizedPrescription);
            }
          }
        }

        const merged = Array.from(byId.values()).sort((a, b) => {
          const first = new Date(a.issueDate).getTime();
          const second = new Date(b.issueDate).getTime();
          return second - first;
        });

        this.prescriptions.set(merged);
        this.loading.set(false);
      },
      error: () => {
        this.pageError.set('Greška pri učitavanju recepata.');
        this.loading.set(false);
      }
    });
  }

  ensurePatientOption(patientId: string) {
    if (!patientId) {
      return;
    }

    const exists = this.examinedPatients().some((p) => p?._id === patientId);
    if (exists) {
      return;
    }

    this.examinedPatients.set([
      ...this.examinedPatients(),
      {
        _id: patientId,
        firstName: 'Pacijent',
        lastName: `#${patientId.slice(0, 6)}`
      }
    ]);
  }

  loadPatientPrescriptions(patientId: string) {
    this.loading.set(true);
    const status = this.statusFilter() || undefined;

    this.prescriptionService.getPrescriptionsByPatient(patientId, status).subscribe({
      next: (data) => {
        this.prescriptions.set(data.map(normalizePrescription));
        this.loading.set(false);
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greška pri učitavanju recepata');
        this.loading.set(false);
      }
    });
  }

  addMedication() {
    this.formError.set('');
    const med = this.newMedication();

    if (med.name && med.dosage && med.frequency && med.duration) {
      this.newPrescription.update((current) => ({
        ...current,
        medications: [...current.medications, { ...med }]
      }));
      this.newMedication.set({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
      return;
    }

    this.formError.set('Popuni sva obavezna polja za lek (naziv, doza, učestalost, trajanje).');
  }

  hasMedicationDraft(): boolean {
    const med = this.newMedication();
    return !!(
      med.name.trim() ||
      med.dosage.trim() ||
      med.frequency.trim() ||
      med.duration.trim() ||
      med.instructions?.trim()
    );
  }

  tryAppendDraftMedication(): boolean {
    const med = this.newMedication();
    const name = med.name.trim();
    const dosage = med.dosage.trim();
    const frequency = med.frequency.trim();
    const duration = med.duration.trim();
    const instructions = med.instructions?.trim() || '';

    if (!name && !dosage && !frequency && !duration && !instructions) {
      return false;
    }

    if (!name || !dosage || !frequency || !duration) {
      this.formError.set('Nedovršen lek: popuni naziv, dozu, učestalost i trajanje ili obriši unos.');
      return false;
    }

    this.newPrescription.update((current) => ({
      ...current,
      medications: [
        ...current.medications,
        { name, dosage, frequency, duration, instructions }
      ]
    }));

    this.newMedication.set({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    return true;
  }

  removeMedication(index: number) {
    this.newPrescription.update((current) => ({
      ...current,
      medications: current.medications.filter((_, i) => i !== index)
    }));
  }

  openCreateModal() {
    this.formError.set('');
    this.showCreateModal.set(true);
    this.filterMedicalRecordsForPatient(this.newPrescription().patientId);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.resetForm();
  }

  onPatientChange(patientId: string) {
    this.formError.set('');
    this.newPrescription.update((current) => ({
      ...current,
      patientId,
      medicalRecordId: '',
      appointmentId: ''
    }));
    this.filterMedicalRecordsForPatient(patientId);
  }

  onMedicalRecordChange(medicalRecordId: string) {
    this.formError.set('');
    const selectedRecord = this.filteredMedicalRecords().find(r => r._id === medicalRecordId);
    const recordPatientId = selectedRecord ? resolveRecordPatientId(selectedRecord) : '';
    if (recordPatientId) {
      this.newPrescription.update((current) => ({
        ...current,
        patientId: recordPatientId,
        medicalRecordId
      }));
      this.ensurePatientOption(recordPatientId);
      this.filterMedicalRecordsForPatient(recordPatientId);
    } else {
      this.newPrescription.update((current) => ({ ...current, medicalRecordId }));
    }

    const appointment = selectedRecord?.appointment as any;
    const appointmentId = typeof appointment === 'string'
      ? appointment
      : (appointment?._id ? String(appointment._id) : '');

    this.newPrescription.update((current) => ({
      ...current,
      appointmentId
    }));
  }

  filterMedicalRecordsForPatient(patientId: string) {
    if (!patientId) {
      this.filteredMedicalRecords.set([]);
      return;
    }

    this.filteredMedicalRecords.set(this.doctorMedicalRecords().filter(
      (record) => resolveRecordPatientId(record) === patientId
    ));
  }

  updateAppointmentId(value: string) {
    this.newPrescription.update((current) => ({ ...current, appointmentId: value }));
    this.formError.set('');
  }

  updateValidUntil(value: string) {
    this.newPrescription.update((current) => ({ ...current, validUntil: value }));
  }

  updateNotes(value: string) {
    this.newPrescription.update((current) => ({ ...current, notes: value }));
  }

  updateMedicationField(field: keyof Medication, value: string) {
    this.newMedication.update((current) => ({ ...current, [field]: value }));
    this.formError.set('');
  }

  createPrescription() {
    this.formError.set('');

    // Ako je korisnik uneo lek ali nije kliknuo "Dodaj lek", dodaj ga automatski.
    if (this.hasMedicationDraft()) {
      const appended = this.tryAppendDraftMedication();
      if (!appended && this.formError()) {
        return;
      }
    }

    const current = this.newPrescription();

    if (!current.patientId && current.medicalRecordId) {
      const selectedRecord = this.doctorMedicalRecords().find(r => r._id === current.medicalRecordId);
      const recordPatientId = selectedRecord ? resolveRecordPatientId(selectedRecord) : '';
      if (recordPatientId) {
        this.newPrescription.update((state) => ({ ...state, patientId: recordPatientId }));
      }
    }

    const normalized = this.newPrescription();

    if (!normalized.patientId) {
      this.formError.set('Molimo izaberite pacijenta.');
      return;
    }

    if (normalized.medications.length === 0) {
      this.formError.set('Molimo dodajte najmanje jedan lek.');
      return;
    }

    this.loading.set(true);
    const prescriptionData: any = {
      patientId: normalized.patientId,
      medications: normalized.medications
    };

    if (normalized.medicalRecordId) prescriptionData.medicalRecordId = normalized.medicalRecordId;
    if (normalized.appointmentId) prescriptionData.appointmentId = normalized.appointmentId;
    if (normalized.validUntil) prescriptionData.validUntil = new Date(normalized.validUntil);
    if (normalized.notes) prescriptionData.notes = normalized.notes;

    this.prescriptionService.createPrescription(prescriptionData).subscribe({
      next: () => {
        const createdForPatientId = normalized.patientId;
        this.closeCreateModal();

        // Nakon reset-a forme koristimo sačuvan ID pacijenta.
        if (this.isPatient() && createdForPatientId) {
          this.loadPatientPrescriptions(createdForPatientId);
        }

        // Doktoru osveži celu listu recepata svih pregledanih pacijenata.
        if (this.isDoctor()) {
          this.loadPrescriptionsForExaminedPatients();
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.message || 'Greška pri kreiranju recepta');
        this.loading.set(false);
      }
    });
  }

  isAddingMedicationTo(prescriptionId?: string): boolean {
    return !!prescriptionId && this.addMedicationPrescriptionId() === prescriptionId;
  }

  openAddMedicationPanel(prescriptionId: string) {
    if (this.addMedicationPrescriptionId() === prescriptionId) {
      this.closeAddMedicationPanel();
      return;
    }

    this.addMedicationPrescriptionId.set(prescriptionId);
    this.addMedicationError.set('');
    this.addMedicationDraft.set({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  }

  closeAddMedicationPanel() {
    this.addMedicationPrescriptionId.set(null);
    this.addMedicationError.set('');
    this.addMedicationDraft.set({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  }

  updateAddMedicationField(field: keyof Medication, value: string) {
    this.addMedicationDraft.update((current) => ({ ...current, [field]: value }));
    this.addMedicationError.set('');
  }

  submitAddMedication(prescriptionId: string) {
    const medication = this.addMedicationDraft();
    if (!medication.name?.trim() || !medication.dosage?.trim() || !medication.frequency?.trim() || !medication.duration?.trim()) {
      this.addMedicationError.set('Popunite naziv, dozu, učestalost i trajanje leka.');
      return;
    }

    this.loading.set(true);
    this.addMedicationError.set('');

    this.prescriptionService.addMedicationToPrescription(prescriptionId, {
      name: medication.name.trim(),
      dosage: medication.dosage.trim(),
      frequency: medication.frequency.trim(),
      duration: medication.duration.trim(),
      instructions: medication.instructions?.trim() || ''
    }).subscribe({
      next: () => {
        this.closeAddMedicationPanel();
        this.reloadPrescriptions();
        this.loading.set(false);
      },
      error: (err) => {
        this.addMedicationError.set(err.error?.message || 'Greška pri dodavanju leka.');
        this.loading.set(false);
      }
    });
  }

  isMedicationActive(medication: Medication): boolean {
    return !medication.status || medication.status === 'active';
  }

  cancelMedication(prescriptionId: string, medicationId: string) {
    const confirmed = confirm('Da li ste sigurni da želite da otkažete ovaj lek?');
    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.pageError.set('');

    this.prescriptionService.cancelMedication(prescriptionId, medicationId).subscribe({
      next: () => {
        this.reloadPrescriptions();
        this.loading.set(false);
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greška pri otkazivanju leka.');
        this.loading.set(false);
      }
    });
  }

  completePrescription(prescriptionId: string) {
    const confirmed = confirm('Da li ste sigurni da želite da završite ovaj recept?');
    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.pageError.set('');

    this.prescriptionService.updatePrescriptionStatus(prescriptionId, 'completed').subscribe({
      next: () => {
        this.closeAddMedicationPanel();
        this.reloadPrescriptions();
        this.loading.set(false);
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greška pri završavanju recepta.');
        this.loading.set(false);
      }
    });
  }

  updateStatus(id: string, status: 'active' | 'completed' | 'cancelled') {
    if (status === 'completed') {
      this.completePrescription(id);
      return;
    }

    const actionText = status === 'cancelled' ? 'otkažete' : 'promenite status';
    const confirmed = confirm(`Da li ste sigurni da želite da ${actionText} ovaj recept?`);
    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.prescriptionService.updatePrescriptionStatus(id, status).subscribe({
      next: () => {
        this.closeAddMedicationPanel();
        this.reloadPrescriptions();
        this.loading.set(false);
      },
      error: (err) => {
        this.pageError.set(err.error?.message || 'Greška pri ažuriranju statusa');
        this.loading.set(false);
      }
    });
  }

  private reloadPrescriptions(): void {
    if (this.isPatient() && this.authService.getCurrentUser()?._id) {
      this.loadPatientPrescriptions(this.authService.getCurrentUser()!._id!);
      return;
    }

    if (this.isDoctor()) {
      this.loadPrescriptionsForExaminedPatients();
    }
  }

  updateStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.pageError.set('');

    const user = this.authService.getCurrentUser();

    if (this.isPatient() && user?._id) {
      this.loadPatientPrescriptions(user._id);
      return;
    }

    if (this.isDoctor()) {
      this.loadPrescriptionsForExaminedPatients();
      return;
    }

    this.prescriptions.set([]);
  }

  resetForm() {
    this.newPrescription.set({
      patientId: '',
      medicalRecordId: '',
      appointmentId: '',
      medications: [],
      validUntil: '',
      notes: ''
    });
    this.filteredMedicalRecords.set([]);
    this.newMedication.set({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    this.formError.set('');
  }

  formatPatientName(patient: any): string {
    return resolvePatientName(patient);
  }

  formatMedicalRecordOption(record: MedicalRecord): string {
    const visit = record.visitDate ? this.formatDate(record.visitDate) : 'bez datuma';
    return `${visit} - ${record.diagnosis || 'Bez dijagnoze'}`;
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

  updateSearchTerm(value: string) {
    this.searchTerm.set(value);
  }

  updateDateFrom(value: string) {
    this.dateFrom.set(value);
  }

  updateDateTo(value: string) {
    this.dateTo.set(value);
  }

  updateSortBy(value: string) {
    if (value === 'issueDateAsc' || value === 'statusAsc' || value === 'issueDateDesc') {
      this.sortBy.set(value);
    }
  }

  clearFiltersAndSorting() {
    this.searchTerm.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.sortBy.set('issueDateDesc');
  }
}




