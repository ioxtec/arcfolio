import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from './auth-api.service';

@Component({
  selector: 'app-auth-callback',
  template: '<main>{{ message() }}</main>',
  styles: [
    ':host{display:grid;min-height:100dvh;place-items:center;color:#08122d;font:600 1rem/1.5 Inter,system-ui,sans-serif}',
  ],
})
export class AuthCallback {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  protected readonly message = signal('Kończymy logowanie…');

  constructor() {
    this.authApi.me().subscribe({
      next: () => void this.router.navigateByUrl('/workspace'),
      error: () => {
        this.message.set('Nie udało się dokończyć logowania.');
        setTimeout(() => void this.router.navigateByUrl('/login'), 1800);
      },
    });
  }
}
