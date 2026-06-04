import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'mcp_token';
  private readonly USER_KEY = 'mcp_user';

  currentUser = signal<User | null>(this.loadStoredUser());
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {}

  private loadStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, body).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    this.clearSession();
    this.router.navigate(['/login']);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }
}
