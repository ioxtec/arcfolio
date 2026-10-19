import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BRAND_CONFIG } from '../core/config/brand.config';
import { ThemeToggle } from '../core/theme/theme-toggle';
import { AuthApiService } from './auth-api.service';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink, ThemeToggle],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);

  protected readonly brand = BRAND_CONFIG;
  protected readonly mode = signal<'login' | 'register'>(
    this.route.snapshot.data['mode'] === 'register' ? 'register' : 'login',
  );
  protected readonly isRegister = computed(() => this.mode() === 'register');
  protected readonly passwordVisible = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');

  protected readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    const { email, password, displayName } = this.form.getRawValue();
    const request = this.isRegister()
      ? this.authApi.register(email, password, displayName)
      : this.authApi.login(email, password);

    request.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/workspace'),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          typeof error.error?.message === 'string'
            ? error.error.message
            : 'Nie udało się zalogować. Spróbuj ponownie.',
        );
      },
    });
  }

  protected continueWithGoogle(): void {
    window.location.assign('/api/auth/google');
  }

  protected showPasswordResetInfo(): void {
    this.infoMessage.set('Resetowanie hasła dodamy w następnym etapie.');
  }
}
