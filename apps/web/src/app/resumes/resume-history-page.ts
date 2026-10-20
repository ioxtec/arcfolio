import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ResumeApiService, ResumeDetails, ResumeRevision } from './resume-api.service';
import { ResumeEditorModal } from './resume-editor-modal';

@Component({
  selector: 'app-resume-history-page',
  imports: [FormsModule, RouterLink, ResumeEditorModal],
  templateUrl: './resume-history-page.html',
  styleUrl: './resume-history-page.scss',
})
export class ResumeHistoryPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ResumeApiService);
  protected readonly resume = signal<ResumeDetails | null>(null);
  protected readonly revisions = signal<ResumeRevision[]>([]);
  protected readonly selected = signal<ResumeRevision | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly showSave = signal(false);
  protected readonly showRestore = signal(false);
  protected readonly showEditor = signal(false);
  protected limit = 10;
  protected versionName = '';
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() { this.load(); }

  protected localeCode(locale: string): string { return locale.split('-')[0].toUpperCase(); }
  protected activeLocale(): string { return this.resume()?.localizations[0]?.locale ?? 'pl-PL'; }

  protected formattedDate(value: string): string {
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
  }

  protected saveVersion(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api.createRevision(this.id, this.versionName.trim()).subscribe({
      next: ({ revision }) => {
        this.revisions.update((items) => [revision, ...items]);
        this.selected.set(revision);
        this.versionName = '';
        this.showSave.set(false);
        this.busy.set(false);
      },
      error: (response) => {
        this.error.set(response?.error?.message || 'Nie udało się zapisać wersji.');
        this.busy.set(false);
      },
    });
  }

  protected confirmRestore(): void {
    const revision = this.selected();
    if (!revision || this.busy()) return;
    this.busy.set(true);
    this.api.restoreRevision(this.id, revision.revisionNumber).subscribe({
      next: ({ resume }) => {
        this.resume.set(resume);
        this.showRestore.set(false);
        this.busy.set(false);
      },
      error: (response) => {
        this.error.set(response?.error?.message || 'Nie udało się przywrócić wersji.');
        this.showRestore.set(false);
        this.busy.set(false);
      },
    });
  }

  protected applySavedResume(resume: ResumeDetails): void {
    this.resume.set(resume);
  }

  private load(): void {
    forkJoin({ document: this.api.getOne(this.id), history: this.api.listRevisions(this.id) }).subscribe({
      next: ({ document, history }) => {
        this.resume.set(document.resume);
        this.revisions.set(history.revisions);
        this.limit = history.limit;
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać dokumentu.');
        this.loading.set(false);
      },
    });
  }
}
