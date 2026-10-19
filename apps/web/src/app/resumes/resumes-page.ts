import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ResumeApiService, ResumeListItem } from './resume-api.service';

const LOCALES = [
  ['pl-PL', 'Polski'],
  ['en-GB', 'English (UK)'],
  ['en-US', 'English (US)'],
  ['de-DE', 'Deutsch'],
  ['fr-FR', 'Français'],
  ['es-ES', 'Español'],
  ['it-IT', 'Italiano'],
  ['sv-SE', 'Svenska'],
] as const;

@Component({
  selector: 'app-resumes-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './resumes-page.html',
  styleUrl: './resumes-page.scss',
})
export class ResumesPage {
  private readonly api = inject(ResumeApiService);
  private readonly router = inject(Router);
  protected readonly resumes = signal<ResumeListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly showCreate = signal(false);
  protected readonly creating = signal(false);
  protected readonly limits = signal({ documents: 5, versions: 10 });
  protected readonly locales = LOCALES;
  protected title = '';
  protected roleTitle = '';
  protected locale = 'pl-PL';

  constructor() { this.load(); }

  protected localeCode(locale: string): string {
    return locale.split('-')[0].toUpperCase();
  }

  protected templateName(templateId: string): string {
    return ({ modern: 'Nowoczesny', classic: 'Klasyczny', minimal: 'Minimalny' } as Record<string, string>)[templateId] ?? templateId;
  }

  protected savedAgo(value: string): string {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 1) return 'przed chwilą';
    if (minutes < 60) return `${minutes} min temu`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} godz. temu`;
    return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' }).format(new Date(value));
  }

  protected create(): void {
    const title = this.title.trim();
    if (title.length < 2 || this.creating()) return;
    this.creating.set(true);
    this.error.set('');
    this.api.create({ title, locale: this.locale, roleTitle: this.roleTitle.trim() || title }).subscribe({
      next: (resume) => {
        this.showCreate.set(false);
        this.creating.set(false);
        this.title = '';
        this.roleTitle = '';
        void this.router.navigate(['/workspace/resumes', resume.id]);
      },
      error: (response) => {
        this.error.set(response?.error?.message || 'Nie udało się utworzyć dokumentu.');
        this.creating.set(false);
      },
    });
  }

  private load(): void {
    this.api.list().subscribe({
      next: ({ resumes, limits }) => {
        this.resumes.set(resumes);
        this.limits.set(limits);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać dokumentów.');
        this.loading.set(false);
      },
    });
  }
}
