import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Doctor, DoctorAvailability, CreateAvailabilityRequest } from '../models/doctor.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  constructor(private api: ApiService) {}

  getAllDoctors(): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('/doctors');
  }

  searchDoctors(specialization?: string, name?: string): Observable<Doctor[]> {
    const params: string[] = [];
    if (specialization) params.push(`specialization=${specialization}`);
    if (name) params.push(`name=${name}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.api.get<Doctor[]>(`/doctors/search${query}`);
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.api.get<Doctor>(`/doctors/${id}`);
  }

  setDoctorAvailability(doctorId: string, data: CreateAvailabilityRequest): Observable<DoctorAvailability> {
    return this.api.post<DoctorAvailability>(`/doctors/${doctorId}/availability`, data);
  }

  getDoctorAvailability(doctorId: string): Observable<DoctorAvailability[]> {
    return this.api.get<DoctorAvailability[]>(`/doctors/${doctorId}/availability`);
  }

  getAvailableSlots(doctorId: string, date: string): Observable<{ date: string; availableSlots: string[] }> {
    return this.api.get<{ date: string; availableSlots: string[] }>(`/doctors/${doctorId}/available-slots?date=${date}`);
  }

  updateAvailability(availabilityId: string, data: Partial<CreateAvailabilityRequest>): Observable<DoctorAvailability> {
    return this.api.put<DoctorAvailability>(`/doctors/availability/${availabilityId}`, data);
  }

  deleteAvailability(availabilityId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/doctors/availability/${availabilityId}`);
  }
}




