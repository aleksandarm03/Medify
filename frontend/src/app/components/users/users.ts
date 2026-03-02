import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri učitavanju korisnika';
        this.loading = false;
      }
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

  hasAnySpecialization(): boolean {
    return this.users.some(u => u.specialization);
  }
}


