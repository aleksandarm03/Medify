import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../services/doctor.service';
import { Doctor, DoctorAvailability } from '../../models/doctor.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './doctor-detail.html',
  styleUrl: './doctor-detail.css'
})
export class DoctorDetailComponent implements OnInit, OnDestroy {
  doctor = signal<Doctor | null>(null);
  availability = signal<DoctorAvailability[]>([]);
  loading = signal(false);
  error = signal('');

  private destroy$ = new Subject<void>();
  private doctorId = '';

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.doctorId = params['id'];
      if (this.doctorId) {
        this.loadDoctorDetails();
        this.loadDoctorAvailability();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDoctorDetails() {
    this.loading.set(true);
    this.error.set('');
    
    this.doctorService.getDoctorById(this.doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.doctor.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri učitavanju doktora');
          this.loading.set(false);
        }
      });
  }

  loadDoctorAvailability() {
    this.doctorService.getDoctorAvailability(this.doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.availability.set(data);
        },
        error: (err) => {
          console.error('Greška pri učitavanju dostupnosti:', err);
        }
      });
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
    return days[dayOfWeek] || '';
  }

  getAvailabilityStatus(item: DoctorAvailability): string {
    return item.isAvailable ? 'Dostupan' : 'Nedostupan';
  }

  formatTime(time: string): string {
    return time || '-';
  }
}
