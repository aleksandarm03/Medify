import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { MedicalRecord, CreateMedicalRecordRequest, LabResult } from '../models/medical-record.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  constructor(private api: ApiService) {}

  createMedicalRecord(data: CreateMedicalRecordRequest): Observable<MedicalRecord> {
    return this.api.post<MedicalRecord>('/medical-records', data);
  }

  getMedicalRecordsByPatient(patientId: string): Observable<MedicalRecord[]> {
    return this.api.get<MedicalRecord[]>(`/medical-records/patient/${patientId}`);
  }

  getMedicalRecordsByDoctor(doctorId: string): Observable<MedicalRecord[]> {
    return this.api.get<MedicalRecord[]>(`/medical-records/doctor/${doctorId}`);
  }

  getMedicalRecordById(id: string): Observable<MedicalRecord> {
    return this.api.get<MedicalRecord>(`/medical-records/${id}`);
  }

  updateMedicalRecord(id: string, data: Partial<CreateMedicalRecordRequest>): Observable<MedicalRecord> {
    return this.api.put<MedicalRecord>(`/medical-records/${id}`, data);
  }

  addLabResult(id: string, labResult: { testName: string; result: string; normalRange?: string }): Observable<MedicalRecord> {
    return this.api.post<MedicalRecord>(`/medical-records/${id}/lab-results`, labResult);
  }

  getAllMedicalRecords(): Observable<MedicalRecord[]> {
    return this.api.get<MedicalRecord[]>('/medical-records/all');
  }
}




