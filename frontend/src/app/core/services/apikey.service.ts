import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from '../models/apikey.model';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  constructor(private http: HttpClient) {}

  list(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(`${environment.apiUrl}/apikeys`);
  }

  create(body: CreateApiKeyRequest): Observable<CreateApiKeyResponse> {
    return this.http.post<CreateApiKeyResponse>(`${environment.apiUrl}/apikeys`, body);
  }

  revoke(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/apikeys/${id}`);
  }
}
