import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  user: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
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
    return this.user?.role === 'patient';
  }

  isDoctor() {
    return this.user?.role === 'doctor';
  }

  isNurse() {
    return this.user?.role === 'nurse';
  }

  isAdmin() {
    return this.user?.role === 'admin';
  }
}




