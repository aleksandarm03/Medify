import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class UsersComponent implements OnInit, OnDestroy {
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal('');
  showEditModal = signal(false);
  showDeleteConfirm = signal(false);
  selectedUser = signal<User | null>(null);
  
  editForm = signal<Partial<User>>({});

  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers() {
    this.loading.set(true);
    this.error.set('');
    
    this.authService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.users.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri učitavanju korisnika');
          this.loading.set(false);
        }
      });
  }

  openEditModal(user: User) {
    this.selectedUser.set(user);
    this.editForm.set({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      homeAddress: user.homeAddress,
      specialization: user.specialization,
      officeNumber: user.officeNumber,
      shift: user.shift
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedUser.set(null);
    this.editForm.set({});
  }

  saveUser() {
    const user = this.selectedUser();
    if (!user || !user._id) return;

    this.loading.set(true);
    this.authService.updateUser(user._id, this.editForm())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadUsers();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri ažuriranju korisnika');
          this.loading.set(false);
        }
      });
  }

  confirmDelete(user: User) {
    this.selectedUser.set(user);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
    this.selectedUser.set(null);
  }

  deleteUser() {
    const user = this.selectedUser();
    if (!user || !user._id) return;

    this.loading.set(true);
    this.authService.deleteUser(user._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cancelDelete();
          this.loadUsers();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Greška pri brisanju korisnika');
          this.loading.set(false);
        }
      });
  }

  updateFormField(field: string, value: any) {
    this.editForm.update(form => ({ ...form, [field]: value }));
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
    return this.users().some(u => u.specialization);
  }
}


