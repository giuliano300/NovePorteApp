import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

interface AuthResponse { authenticated: boolean; message?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private authenticated = false;

  session(): Observable<boolean> {
    return this.http.get<AuthResponse>('/api/auth/session').pipe(
      map(result => result.authenticated), tap(value => this.authenticated = value), catchError(() => of(false))
    );
  }
  login(password: string): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', { password }).pipe(map(() => undefined), tap(() => this.authenticated = true));
  }
  logout(): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/logout', {}).pipe(map(() => undefined), tap(() => this.authenticated = false));
  }
}
