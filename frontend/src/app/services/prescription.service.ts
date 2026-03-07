import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Prescription, CreatePrescriptionRequest } from '../models/prescription.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  constructor(private api: ApiService) {}

  createPrescription(data: CreatePrescriptionRequest): Observable<Prescription> {
    return this.api.post<Prescription>('/prescriptions', data);
  }

  getPrescriptionsByPatient(patientId: string, status?: string): Observable<Prescription[]> {
    const endpoint = status 
      ? `/prescriptions/patient/${patientId}?status=${status}` 
      : `/prescriptions/patient/${patientId}`;
    return this.api.get<Prescription[]>(endpoint);
  }

  getActivePrescriptions(patientId: string): Observable<Prescription[]> {
    return this.api.get<Prescription[]>(`/prescriptions/patient/${patientId}/active`);
  }

  getPrescriptionById(id: string): Observable<Prescription> {
    return this.api.get<Prescription>(`/prescriptions/${id}`);
  }

  updatePrescriptionStatus(id: string, status: 'active' | 'completed' | 'cancelled'): Observable<Prescription> {
    return this.api.put<Prescription>(`/prescriptions/${id}/status`, { status });
  }

  getAllPrescriptions(): Observable<Prescription[]> {
    return this.api.get<Prescription[]>('/prescriptions/all');
  }
}




