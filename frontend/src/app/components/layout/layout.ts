import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent {
  menuOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
    this.closeMenu();
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  getRoleLabel() {
    const role = this.getCurrentUser()?.role;
    const labels: Record<string, string> = {
      admin: 'Administrator',
      doctor: 'Doktor',
      nurse: 'Medicinska sestra',
      patient: 'Pacijent'
    };

    return role ? labels[role] || role : 'Korisnik';
  }

  getProfileImage() {
    const role = this.getCurrentUser()?.role;

    if (role === 'admin') {
      return '/images/admin.png';
    }
    if (role === 'doctor') {
      return '/images/doctor.png';
    }

    return '/images/patient.png';
  }
}




