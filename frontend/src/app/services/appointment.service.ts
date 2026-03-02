import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../models/appointment.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(private api: ApiService) {}

  createAppointment(data: CreateAppointmentRequest): Observable<Appointment> {
    return this.api.post<Appointment>('/appointments', data);
  }

  getAppointmentsByDoctor(status?: string): Observable<Appointment[]> {
    const endpoint = status ? `/appointments/doctor?status=${status}` : '/appointments/doctor';
    return this.api.get<Appointment[]>(endpoint);
  }

  getAppointmentsByPatient(status?: string): Observable<Appointment[]> {
    const endpoint = status ? `/appointments/patient?status=${status}` : '/appointments/patient';
    return this.api.get<Appointment[]>(endpoint);
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.api.get<Appointment>(`/appointments/${id}`);
  }

  updateAppointmentStatus(id: string, status: 'scheduled' | 'completed' | 'canceled'): Observable<Appointment> {
    return this.api.put<Appointment>(`/appointments/${id}/status`, { status });
  }

  updateAppointment(id: string, data: UpdateAppointmentRequest): Observable<Appointment> {
    return this.api.put<Appointment>(`/appointments/${id}`, data);
  }

  deleteAppointment(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/appointments/${id}`);
  }
}




