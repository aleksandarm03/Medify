import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminDashboardData } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  data = signal<AdminDashboardData | null>(null);
  loading = signal(true);
  error = signal('');

  // Computed values
  totalAppointments = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return d.appointmentsByStatus.scheduled + 
           d.appointmentsByStatus.completed + 
           d.appointmentsByStatus.canceled;
  });

  completionRate = computed(() => {
    const d = this.data();
    if (!d) return 0;
    const total = this.totalAppointments();
    if (total === 0) return 0;
    return Math.round((d.appointmentsByStatus.completed / total) * 100);
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.error.set('');

    this.adminService.getDashboardData().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Greška pri učitavanju dashboard-a');
        this.loading.set(false);
        console.error('Dashboard error:', err);
      }
    });
  }

  approveUser(userId: string) {
    if (!confirm('Da li ste sigurni da želite da odobrite ovog korisnika?')) {
      return;
    }

    this.adminService.approveUser(userId).subscribe({
      next: () => {
        this.loadDashboard(); // Reload data
      },
      error: (err) => {
        alert('Greška pri odobravanju korisnika');
        console.error('Approve error:', err);
      }
    });
  }

  rejectUser(userId: string) {
    if (!confirm('Da li ste sigurni da želite da odbijete ovog korisnika?')) {
      return;
    }

    this.adminService.rejectUser(userId).subscribe({
      next: () => {
        this.loadDashboard(); // Reload data
      },
      error: (err) => {
        alert('Greška pri odbijanju korisnika');
        console.error('Reject error:', err);
      }
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrator',
      doctor: 'Doktor',
      patient: 'Pacijent'
    };
    return labels[role] || role;
  }

  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      admin: 'badge-admin',
      doctor: 'badge-doctor',
      patient: 'badge-patient'
    };
    return classes[role] || '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
