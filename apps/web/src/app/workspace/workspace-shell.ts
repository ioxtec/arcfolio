import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthApiService, AuthUser } from '../auth/auth-api.service';
import { BRAND_CONFIG } from '../core/config/brand.config';
import { ThemeToggle } from '../core/theme/theme-toggle';

@Component({
  selector: 'app-workspace-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeToggle],
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.scss',
})
export class WorkspaceShell {
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

  protected initials(): string {
    const source = this.user()?.displayName || this.user()?.email || 'A';
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  protected logout(): void {
    this.authApi.logout().subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
