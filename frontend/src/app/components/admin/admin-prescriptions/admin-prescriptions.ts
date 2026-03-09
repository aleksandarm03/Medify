import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrescriptionService } from '../../../services/prescription.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-prescriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-prescriptions.html',
  styleUrl: './admin-prescriptions.css'
})
export class AdminPrescriptionsComponent implements OnInit, OnDestroy {
  prescriptions = signal<any[]>([]);
  loading = signal(false);
  error = signal('');

  private destroy$ = new Subject<void>();

  constructor(private prescriptionService: PrescriptionService) {}

  ngOnInit() {
    this.loadAllPrescriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllPrescriptions() {
    this.loading.set(true);
    this.error.set('');
    this.prescriptionService.getAllPrescriptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.prescriptions.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri učitavanju recepata');
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

  formatMedicationNames(medications: any): string {
    if (!Array.isArray(medications) || medications.length === 0) {
      return '-';
    }

    return medications
      .map((med) => med?.name)
      .filter(Boolean)
      .join(', ') || '-';
  }

  formatMedicationDosages(medications: any): string {
    if (!Array.isArray(medications) || medications.length === 0) {
      return '-';
    }

    return medications
      .map((med) => med?.dosage)
      .filter(Boolean)
      .join(', ') || '-';
  }

  formatMedicationDurations(medications: any): string {
    if (!Array.isArray(medications) || medications.length === 0) {
      return '-';
    }

    return medications
      .map((med) => med?.duration)
      .filter(Boolean)
      .join(', ') || '-';
  }

  truncateText(text: string, length: number = 50): string {
    if (!text) return '-';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
