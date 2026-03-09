import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminDashboardData {
  overview: {
    totalUsers: number;
    totalAppointmentsToday: number;
    totalAppointmentsWeek: number;
    totalAppointmentsMonth: number;
    pendingApprovalsCount: number;
  };
  usersByRole: {
    admin: number;
    doctor: number;
    nurse: number;
    patient: number;
  };
  appointmentsByStatus: {
    scheduled: number;
    completed: number;
    canceled: number;
  };
  pendingApprovals: any[];
  recentUsers: any[];
  recentAppointments: any[];
  topDoctors: any[];
  systemHealth: {
    totalMedicalRecords: number;
    totalPrescriptions: number;
    totalAvailabilities: number;
    activeDoctors: number;
    databaseStatus: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<AdminDashboardData> {
    return this.http.get<AdminDashboardData>(`${this.apiUrl}/dashboard`);
  }

  approveUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-user/${userId}`, {});
  }

  rejectUser(userId: string, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reject-user/${userId}`, { reason });
  }

  toggleUserStatus(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/toggle-user/${userId}`, {});
  }

  getAuditLog(limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/audit-log?limit=${limit}`);
  }
}
