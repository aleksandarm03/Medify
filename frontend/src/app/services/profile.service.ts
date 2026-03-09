import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private apiService: ApiService) {}

  getProfile(): Observable<User> {
    return this.apiService.get<User>('/profile');
  }

  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.apiService.put<User>('/profile', profileData);
  }
}
