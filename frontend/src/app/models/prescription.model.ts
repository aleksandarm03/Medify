export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  _id?: string;
}

export interface Prescription {
  _id?: string;
  patient: any;
  doctor: any;
  medicalRecord?: any;
  appointment?: any;
  medications: Medication[];
  issueDate: Date;
  validUntil?: Date;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePrescriptionRequest {
  patientId: string;
  medicalRecordId?: string;
  appointmentId?: string;
  medications: Medication[];
  validUntil?: Date;
  notes?: string;
}




