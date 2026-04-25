export interface Appointment {
  _id?: string;
  doctor: any;
  patient: any;
  appointmentDate: Date;
  reason: string;
  status: 'scheduled' | 'completed' | 'canceled';
  canceledByRole?: 'doctor' | 'patient' | 'admin' | 'system' | 'unknown' | null;
  canceledByUser?: string | null;
  cancellationReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAppointmentRequest {
  patientId?: string;
  patientJMBG?: string;
  doctorId?: string;
  appointmentDate: Date;
  reason: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate?: Date;
  reason?: string;
  status?: 'scheduled' | 'completed' | 'canceled';
}




