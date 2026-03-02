import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './doctors.html',
  styleUrl: './doctors.css'
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  loading = false;
  error = '';
  searchSpecialization = '';
  searchName = '';

  constructor(private doctorService: DoctorService) {}

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.loading = true;
    this.error = '';
    
    if (this.searchSpecialization || this.searchName) {
      this.doctorService.searchDoctors(
        this.searchSpecialization || undefined,
        this.searchName || undefined
      ).subscribe({
        next: (data) => {
          this.doctors = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Greška pri pretrazi doktora';
          this.loading = false;
        }
      });
    } else {
      this.doctorService.getAllDoctors().subscribe({
        next: (data) => {
          this.doctors = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Greška pri učitavanju doktora';
          this.loading = false;
        }
      });
    }
  }

  search() {
    this.loadDoctors();
  }

  clearSearch() {
    this.searchSpecialization = '';
    this.searchName = '';
    this.loadDoctors();
  }
}




