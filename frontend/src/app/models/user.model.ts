export interface User {
  _id?: string;
  JMBG: string;
  firstName: string;
  lastName: string;
  homeAddress: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  dateOfBirth?: Date;
  role: 'admin' | 'doctor' | 'patient';
  createdAt?: Date;
  updatedAt?: Date;
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  officeNumber?: string;
  shift?: 'morning' | 'evening' | 'night';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  allergies?: string[];
  insuranceNumber?: string;
  insuranceCompany?: string;
}

export interface LoginRequest {
  JMBG: string;
  password: string;
}

export interface RegisterRequest {
  JMBG: string;
  firstName: string;
  lastName: string;
  password: string;
  homeAddress: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  role: 'admin' | 'doctor' | 'patient';
  dateOfBirth?: Date;
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  officeNumber?: string;
  shift?: 'morning' | 'evening' | 'night';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  allergies?: string[];
  insuranceNumber?: string;
  insuranceCompany?: string;
}

export interface AuthResponse {
  token: string;
}




