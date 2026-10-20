import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export type ResumeListItem = {
  id: string;
  title: string;
  templateId: string;
  updatedAt: string;
  locales: string[];
  roleTitle: string | null;
  revisionCount: number;
};

export type ResumeLocalization = {
  locale: string;
  roleTitle: string | null;
  summary: string | null;
  sectionLabels: Record<string, string>;
  consentText: string | null;
  content: Record<string, unknown>;
};

export type ResumeDetails = {
  id: string;
  title: string;
  templateId: string;
  updatedAt: string;
  language: string;
  personalData: Record<string, unknown>;
  localizations: ResumeLocalization[];
  _count: { revisions: number };
};

export type ResumeRevision = {
  id: string;
  revisionNumber: number;
  name: string | null;
  reason: string;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class ResumeApiService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<{
      resumes: ResumeListItem[];
      limits: { documents: number; versions: number };
    }>('/api/resumes', { withCredentials: true });
  }

  create(input: { title: string; locale: string; roleTitle?: string }) {
    return this.http.post<ResumeDetails>('/api/resumes', input, { withCredentials: true });
  }

  update(
    id: string,
    input: {
      title?: string;
      locale: string;
      roleTitle?: string;
      summary?: string;
      consentText?: string;
      personalData?: Record<string, unknown>;
      content?: Record<string, unknown>;
    },
  ) {
    return this.http.patch<{ resume: ResumeDetails }>(`/api/resumes/${id}`, input, {
      withCredentials: true,
    });
  }

  getOne(id: string) {
    return this.http.get<{ resume: ResumeDetails; limits: { versions: number } }>(
      `/api/resumes/${id}`,
      { withCredentials: true },
    );
  }

  listRevisions(id: string) {
    return this.http.get<{ revisions: ResumeRevision[]; limit: number }>(
      `/api/resumes/${id}/revisions`,
      { withCredentials: true },
    );
  }

  createRevision(id: string, name?: string) {
    return this.http.post<{ revision: ResumeRevision; limit: number }>(
      `/api/resumes/${id}/revisions`,
      { name: name || undefined },
      { withCredentials: true },
    );
  }

  restoreRevision(id: string, revisionNumber: number) {
    return this.http.post<{ resume: ResumeDetails }>(
      `/api/resumes/${id}/revisions/${revisionNumber}/restore`,
      {},
      { withCredentials: true },
    );
  }
}
