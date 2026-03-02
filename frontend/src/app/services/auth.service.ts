import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/user.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'medify_token';
  private userKey = 'medify_user';

  constructor(private api: ApiService) {
    if (typeof window !== 'undefined') {
      this.loadStoredUser();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.tokenKey, response.token);
          // Decode token to get osnovne podatke o korisniku iz JWT-a
          try {
            const payload = JSON.parse(atob(response.token.split('.')[1]));
            const user: User = {
              _id: payload._id,
              firstName: payload.firstName,
              lastName: payload.lastName,
              role: payload.role
            } as User;
            localStorage.setItem(this.userKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
          } catch (error) {
            console.error('Error decoding token:', error);
          }
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.api.post<User>('/auth/register', userData).pipe(
      tap(user => {
        // After registration, user needs to login
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }


  private loadStoredUser(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error loading stored user:', error);
      }
    }
  }

  getAllUsers(): Observable<User[]> {
    return this.api.get<User[]>('/auth/users');
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role || '') : false;
  }
}

