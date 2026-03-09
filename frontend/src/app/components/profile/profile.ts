import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent {
  editMode = false;

  constructor(public authService: AuthService) {}

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
  }

  getRoleLabel() {
    const role = this.currentUser?.role;
    const labels: Record<string, string> = {
      admin: 'Administrator',
      doctor: 'Doktor',
      nurse: 'Medicinska sestra',
      patient: 'Pacijent'
    };

    return role ? labels[role] || role : 'Korisnik';
  }

  getProfileImage() {
    const role = this.currentUser?.role;

    if (role === 'admin') {
      return '/images/admin.png';
    }
    if (role === 'doctor') {
      return '/images/doctor.png';
    }

    return '/images/patient.png';
  }
}
