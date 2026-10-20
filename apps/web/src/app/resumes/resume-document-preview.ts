import { Component, computed, input } from '@angular/core';
import { ResumeDetails } from './resume-api.service';
import {
  normalizeTemplateId,
  ResumeTemplateId,
  resumeViewModel,
} from './resume-template';

@Component({
  selector: 'app-resume-document-preview',
  templateUrl: './resume-document-preview.html',
  styleUrl: './resume-document-preview.scss',
})
export class ResumeDocumentPreview {
  readonly resume = input.required<ResumeDetails>();
  readonly template = input<ResumeTemplateId | null>(null);
  readonly compact = input(false);

  protected readonly model = computed(() => resumeViewModel(this.resume()));
  protected readonly templateId = computed(() => this.template() ?? normalizeTemplateId(this.resume().templateId));
  protected readonly contact = computed(() => {
    const model = this.model();
    return [model.phone, model.email, model.city].filter(Boolean);
  });

  protected label(id: string, fallback: string): string {
    return this.model().labels[id] || fallback;
  }
}
