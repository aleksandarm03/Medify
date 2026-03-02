export interface LabResult {
  testName: string;
  result: string;
  normalRange?: string;
  date?: Date;
  _id?: string;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
}

export interface MedicalRecord {
  _id?: string;
  patient: any;
  doctor: any;
  appointment?: any;
  visitDate: Date;
  diagnosis: string;
  symptoms?: string[];
  examinationNotes?: string;
  treatment?: string;
  recommendations?: string;
  vitalSigns?: VitalSigns;
  labResults?: LabResult[];
  followUpDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMedicalRecordRequest {
  patientId: string;
  appointmentId?: string;
  diagnosis: string;
  symptoms?: string[];
  examinationNotes?: string;
  treatment?: string;
  recommendations?: string;
  vitalSigns?: VitalSigns;
  labResults?: LabResult[];
  followUpDate?: Date;
}




