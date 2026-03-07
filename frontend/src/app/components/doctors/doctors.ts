import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../models/doctor.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './doctors.html',
  styleUrl: './doctors.css'
})
export class DoctorsComponent implements OnInit, OnDestroy {
  doctors = signal<Doctor[]>([]);
  loading = signal(false);
  error = signal('');
  searchSpecialization = signal('');
  searchName = signal('');

  private destroy$ = new Subject<void>();

  constructor(private doctorService: DoctorService) {}

  ngOnInit() {
    this.loadDoctors();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDoctors() {
    this.loading.set(true);
    this.error.set('');
    
    if (this.searchSpecialization() || this.searchName()) {
      this.doctorService.searchDoctors(
        this.searchSpecialization() || undefined,
        this.searchName() || undefined
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: (data) => {
          this.doctors.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri pretrazi doktora');
          this.loading.set(false);
        }
      });
    } else {
      this.doctorService.getAllDoctors().pipe(takeUntil(this.destroy$)).subscribe({
        next: (data) => {
          this.doctors.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri učitavanju doktora');
          this.loading.set(false);
        }
      });
    }
  }

  search() {
    this.loadDoctors();
  }

  clearSearch() {
    this.searchSpecialization.set('');
    this.searchName.set('');
    this.loadDoctors();
  }

  updateSearchSpecialization(value: string) {
    this.searchSpecialization.set(value);
  }

  updateSearchName(value: string) {
    this.searchName.set(value);
  }
}




