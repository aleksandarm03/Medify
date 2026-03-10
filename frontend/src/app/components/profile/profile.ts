import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  // Signals za state management
  editMode = signal(false);
  loading = signal(false);
  error = signal('');
  successMessage = signal('');
  
  profile = signal<User | null>(null);
  editedProfile = signal<Partial<User>>({});

  // Readonly data
  bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  shiftOptions = [
    { value: 'morning', label: 'Jutarnja' },
    { value: 'evening', label: 'Popodnevna' },
    { value: 'night', label: 'Noćna' }
  ];

  // Computed signals
  currentUser = computed(() => this.authService.getCurrentUser());
  
  roleLabel = computed(() => {
    const role = this.profile()?.role || this.currentUser()?.role;
    const labels: Record<string, string> = {
      admin: 'Administrator',
      doctor: 'Doktor',
      patient: 'Pacijent'
    };
    return role ? labels[role] || role : 'Korisnik';
  });

  profileImage = computed(() => {
    const role = this.profile()?.role || this.currentUser()?.role;
    if (role === 'admin') return '/images/admin.png';
    if (role === 'doctor') return '/images/doctor.png';
    return '/images/patient.png';
  });

  allergiesString = computed(() => {
    const allergies = this.profile()?.allergies;
    if (!allergies || allergies.length === 0) return '-';
    return allergies.join(', ');
  });

  editedAllergiesString = computed(() => {
    const allergies = this.editedProfile().allergies;
    if (!allergies || allergies.length === 0) return '';
    return allergies.join(', ');
  });

  constructor(
    public authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading.set(true);
    this.error.set('');
    
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Greška pri učitavanju profila.');
        this.loading.set(false);
        console.error('Load profile error:', err);
      }
    });
  }

  toggleEditMode() {
    const currentProfile = this.profile();
    const isEditMode = this.editMode();
    
    if (!isEditMode && currentProfile) {
      // Ulazimo u edit mode - kopiraj trenutne podatke
      const edited = { ...currentProfile };
      // Parsuj alergije ako postoje
      if (currentProfile.allergies && Array.isArray(currentProfile.allergies)) {
        edited.allergies = currentProfile.allergies;
      }
      this.editedProfile.set(edited);
    }
    
    this.editMode.set(!isEditMode);
    this.error.set('');
    this.successMessage.set('');
  }

  onAllergiesChange(value: string) {
    const current = this.editedProfile();
    if (value.trim()) {
      this.editedProfile.set({
        ...current,
        allergies: value.split(',').map(a => a.trim()).filter(a => a)
      });
    } else {
      this.editedProfile.set({
        ...current,
        allergies: []
      });
    }
  }

  saveProfile() {
    const edited = this.editedProfile();
    if (!edited) return;

    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    this.profileService.updateProfile(edited).subscribe({
      next: (updatedProfile) => {
        this.profile.set(updatedProfile);
        this.loading.set(false);
        this.successMessage.set('Profil je uspešno ažuriran!');
        this.editMode.set(false);
        
        // Sakrij success poruku posle 3 sekunde
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri ažuriranju profila.');
        this.loading.set(false);
        console.error('Update profile error:', err);
      }
    });
  }

  cancelEdit() {
    this.editMode.set(false);
    this.editedProfile.set({});
    this.error.set('');
    this.successMessage.set('');
  }

  updateEditedField<K extends keyof User>(field: K, value: User[K]) {
    this.editedProfile.update(current => ({
      ...current,
      [field]: value
    }));
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('sr-RS');
  }

  getShiftLabel(shift: string | undefined): string {
    if (!shift) return '-';
    const found = this.shiftOptions.find(s => s.value === shift);
    return found ? found.label : shift;
  }
}
