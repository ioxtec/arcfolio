import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type AuthResponse = { user: AuthUser };

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }, { withCredentials: true });
  }

  register(email: string, password: string, displayName: string) {
    return this.http.post<AuthResponse>(
      '/api/auth/register',
      { email, password, displayName },
      { withCredentials: true },
    );
  }

  me() {
    return this.http.get<AuthResponse>('/api/auth/me', { withCredentials: true });
  }

  logout() {
    return this.http.post<{ success: true }>('/api/auth/logout', {}, { withCredentials: true });
  }
}
