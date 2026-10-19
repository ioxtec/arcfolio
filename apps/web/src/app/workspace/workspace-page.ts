import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService, AuthUser } from '../auth/auth-api.service';
import { BRAND_CONFIG } from '../core/config/brand.config';

@Component({
  selector: 'app-workspace-page',
  template: `
    <main class="workspace">
      <strong>{{ brand.productName }}</strong>
      @if (user()) {
        <section>
          <p>Zalogowano jako</p>
          <h1>{{ user()?.displayName || user()?.email }}</h1>
          <button type="button" (click)="logout()">Wyloguj się</button>
        </section>
      } @else {
        <p>Sprawdzamy sesję…</p>
      }
    </main>
  `,
  styles: [
    ':host{display:block;min-height:100dvh;background:#f5f7fb;color:#08122d;font-family:Inter,system-ui,sans-serif}',
    '.workspace{max-width:720px;margin:0 auto;padding:48px 24px}strong{color:#3157dc;font-size:1.5rem}section{margin-top:120px;padding:40px;border:1px solid #dfe4ee;border-radius:16px;background:#fff}p{color:#65708a}h1{margin:8px 0 32px}button{padding:12px 18px;border:0;border-radius:10px;background:#3157dc;color:#fff;font:inherit;font-weight:700;cursor:pointer}',
  ],
})
export class WorkspacePage {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  protected readonly brand = BRAND_CONFIG;
  protected readonly user = signal<AuthUser | null>(null);

  constructor() {
    this.authApi.me().subscribe({
      next: ({ user }) => this.user.set(user),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  protected logout(): void {
    this.authApi.logout().subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
