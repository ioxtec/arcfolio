import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService, AuthUser } from '../auth/auth-api.service';
import { BRAND_CONFIG } from '../core/config/brand.config';
import { ThemeToggle } from '../core/theme/theme-toggle';

@Component({
  selector: 'app-workspace-page',
  imports: [ThemeToggle],
  template: `
    <main class="workspace">
      <header><strong>{{ brand.productName }}</strong><app-theme-toggle /></header>
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
    ':host{--page:#f5f7fb;--surface:#fff;--ink:#08122d;--muted:#65708a;--line:#dfe4ee;--accent:#3157dc;--control-bg:#fff;display:block;min-height:100dvh;background:var(--page);color:var(--ink);font-family:Inter,system-ui,sans-serif}',
    ':host-context([data-theme=dark]){--page:#1d2124;--surface:#292e32;--ink:#f3f4f5;--muted:#a4a8ab;--line:#3a3f43;--accent:#7d91f5;--control-bg:#292e32}',
    '.workspace{max-width:720px;margin:0 auto;padding:48px 24px}header{display:flex;align-items:center;justify-content:space-between}strong{color:var(--accent);font-size:1.5rem}section{margin-top:120px;padding:40px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}p{color:var(--muted)}h1{margin:8px 0 32px}section button{padding:12px 18px;border:0;border-radius:10px;background:var(--accent);color:#fff;font:inherit;font-weight:700;cursor:pointer}',
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
