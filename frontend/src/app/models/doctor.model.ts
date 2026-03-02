export interface Doctor {
  _id?: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  yearsOfExperience?: number;
  officeNumber?: string;
  phoneNumber?: string;
  shift?: 'morning' | 'evening' | 'night';
  licenseNumber?: string;
}

export interface DoctorAvailability {
  _id?: string;
  doctor: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAvailable: boolean;
  breakStart?: string;
  breakEnd?: string;
  appointmentDuration: number; // minutes
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
  breakStart?: string;
  breakEnd?: string;
  appointmentDuration?: number;
}

export interface AvailableSlot {
  time: string;
  available: boolean;
}




