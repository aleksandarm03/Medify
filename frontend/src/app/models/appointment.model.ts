export interface Appointment {
  _id?: string;
  doctor: any;
  patient: any;
  appointmentDate: Date;
  reason: string;
  status: 'scheduled' | 'completed' | 'canceled';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAppointmentRequest {
  patientId: string;
  appointmentDate: Date;
  reason: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate?: Date;
  reason?: string;
  status?: 'scheduled' | 'completed' | 'canceled';
}




