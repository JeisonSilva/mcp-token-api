import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  list(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/users`);
  }

  changeRole(id: number, role: 'operator' | 'admin'): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/users/${id}/role`, { role });
  }
}
