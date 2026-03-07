import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalRecordService } from '../../../services/medical-record.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-medical-records',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-medical-records.html',
  styleUrl: './admin-medical-records.css'
})
export class AdminMedicalRecordsComponent implements OnInit, OnDestroy {
  records = signal<any[]>([]);
  loading = signal(false);
  error = signal('');

  private destroy$ = new Subject<void>();

  constructor(private medicalRecordService: MedicalRecordService) {}

  ngOnInit() {
    this.loadAllMedicalRecords();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllMedicalRecords() {
    this.loading.set(true);
    this.error.set('');
    this.medicalRecordService.getAllMedicalRecords()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.records.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri učitavanju medicinskih kartona');
          this.loading.set(false);
        }
      });
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  truncateText(text: string, length: number = 50): string {
    if (!text) return '-';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
