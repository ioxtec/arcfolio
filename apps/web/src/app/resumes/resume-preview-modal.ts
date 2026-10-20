import { Component, inject, input, output, signal } from '@angular/core';
import { ResumeApiService, ResumeDetails } from './resume-api.service';
import { ResumeDocumentPreview } from './resume-document-preview';
import { ResumePdfService } from './resume-pdf.service';
import { normalizeTemplateId, RESUME_TEMPLATES, ResumeTemplateId } from './resume-template';

@Component({
  selector: 'app-resume-preview-modal',
  imports: [ResumeDocumentPreview],
  templateUrl: './resume-preview-modal.html',
  styleUrl: './resume-preview-modal.scss',
})
export class ResumePreviewModal {
  private readonly api = inject(ResumeApiService);
  private readonly pdf = inject(ResumePdfService);
  readonly resume = input.required<ResumeDetails>();
  readonly closed = output<void>();
  readonly saved = output<ResumeDetails>();

  protected readonly templates = RESUME_TEMPLATES;
  protected readonly selected = signal<ResumeTemplateId>('modern');
  protected readonly saving = signal(false);
  protected readonly downloading = signal(false);
  protected readonly error = signal('');

  constructor() {
    queueMicrotask(() => this.selected.set(normalizeTemplateId(this.resume().templateId)));
  }

  protected choose(template: ResumeTemplateId): void {
    this.selected.set(template);
  }

  protected saveTemplate(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.api.update(this.resume().id, {
      locale: this.resume().language,
      templateId: this.selected(),
    }).subscribe({
      next: ({ resume }) => {
        this.saved.emit(resume);
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Nie udało się zapisać szablonu.');
        this.saving.set(false);
      },
    });
  }

  protected async download(): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(true);
    this.error.set('');
    try {
      await this.pdf.download(this.resume(), this.selected());
    } catch {
      this.error.set('Nie udało się wygenerować pliku PDF.');
    } finally {
      this.downloading.set(false);
    }
  }
}
