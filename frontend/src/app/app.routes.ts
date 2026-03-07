import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent),
    canActivate: [authGuard(false)] // Dozvoli pristup samo izlogovanim korisnicima
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent),
    canActivate: [authGuard(false)] // Dozvoli pristup samo izlogovanim korisnicima
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard(true)], // Zahteva autentifikaciju
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./components/appointments/appointments').then(m => m.AppointmentsComponent)
      },
      {
        path: 'medical-records',
        loadComponent: () => import('./components/medical-records/medical-records').then(m => m.MedicalRecordsComponent)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./components/prescriptions/prescriptions').then(m => m.PrescriptionsComponent)
      },
      {
        path: 'doctors',
        loadComponent: () => import('./components/doctors/doctors').then(m => m.DoctorsComponent)
      },
       {
         path: 'doctors/:id',
         loadComponent: () => import('./components/doctors/doctor-detail').then(m => m.DoctorDetailComponent)
       },
      {
        path: 'availability',
        loadComponent: () => import('./components/availability/availability').then(m => m.AvailabilityComponent),
        canActivate: [roleGuard(['doctor', 'admin'])]
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users').then(m => m.UsersComponent),
        canActivate: [roleGuard(['admin'])]
      }
    ]
  }
];
