import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  formData = {
    JMBG: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    homeAddress: '',
    phoneNumber: '',
    gender: 'male' as 'male' | 'female',
    role: 'patient' as 'admin' | 'doctor' | 'patient',
    dateOfBirth: '',
    // Doctor fields
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: 0,
    officeNumber: '',
    shift: 'morning' as 'morning' | 'evening' | 'night',
    // Patient fields
    bloodType: '' as '' | 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-',
    allergies: '',
    insuranceNumber: '',
    insuranceCompany: ''
  };
  
  error = signal('');
  loading = signal(false);
  roles = ['patient', 'doctor', 'admin'];
  genders = ['male', 'female'];
  bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  shifts = ['morning', 'evening', 'night'];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get isDoctor() {
    return this.formData.role === 'doctor';
  }

  get isPatient() {
    return this.formData.role === 'patient';
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const registerData: any = {
      JMBG: this.formData.JMBG,
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      password: this.formData.password,
      homeAddress: this.formData.homeAddress,
      phoneNumber: this.formData.phoneNumber,
      gender: this.formData.gender,
      role: this.formData.role
    };

    if (this.formData.dateOfBirth) {
      registerData.dateOfBirth = new Date(this.formData.dateOfBirth);
    }

    if (this.isDoctor) {
      if (this.formData.specialization) registerData.specialization = this.formData.specialization;
      if (this.formData.licenseNumber) registerData.licenseNumber = this.formData.licenseNumber;
      if (this.formData.yearsOfExperience) registerData.yearsOfExperience = this.formData.yearsOfExperience;
      if (this.formData.officeNumber) registerData.officeNumber = this.formData.officeNumber;
      registerData.shift = this.formData.shift;
    }

    if (this.isPatient) {
      if (this.formData.bloodType) registerData.bloodType = this.formData.bloodType;
      if (this.formData.allergies) {
        registerData.allergies = this.formData.allergies.split(',').map(a => a.trim()).filter(a => a);
      }
      if (this.formData.insuranceNumber) registerData.insuranceNumber = this.formData.insuranceNumber;
      if (this.formData.insuranceCompany) registerData.insuranceCompany = this.formData.insuranceCompany;
    }

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registracija uspešna! Automatski ulogovani.');
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Greška pri registraciji');
        this.loading.set(false);
      }
    });
  }

  private validateForm(): boolean {
    if (!this.formData.JMBG || !this.formData.firstName || !this.formData.lastName ||
        !this.formData.password || !this.formData.homeAddress || !this.formData.phoneNumber) {
      this.error.set('Molimo popunite sva obavezna polja');
      return false;
    }

    if (this.formData.password.length < 6) {
      this.error.set('Lozinka mora imati najmanje 6 karaktera');
      return false;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.error.set('Lozinke se ne poklapaju');
      return false;
    }

    return true;
  }
}




