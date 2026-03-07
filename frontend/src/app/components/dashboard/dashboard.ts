import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user = signal<any>(null);
  isLoading = signal(false);
  lastRefresh = signal<Date>(new Date());

  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.refreshDashboard();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshDashboard() {
    this.isLoading.set(true);
    
    // Osvežavanje trenutnog korisnika iz trenutnog stanja
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user.set(user);
        this.lastRefresh.set(new Date());
        this.isLoading.set(false);
      });
  }

  getRoleName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'admin': 'Administrator',
      'doctor': 'Doktor',
      'nurse': 'Medicinska sestra',
      'patient': 'Pacijent'
    };
    return roleNames[role] || role;
  }

  isPatient() {
    return this.user()?.role === 'patient';
  }

  isDoctor() {
    return this.user()?.role === 'doctor';
  }

  isNurse() {
    return this.user()?.role === 'nurse';
  }

  isAdmin() {
    return this.user()?.role === 'admin';
  }
}




