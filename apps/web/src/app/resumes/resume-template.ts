import { ResumeDetails, ResumeLocalization } from './resume-api.service';

export type ResumeTemplateId = 'classic' | 'modern' | 'sidebar';

export const RESUME_TEMPLATES: ReadonlyArray<{
  id: ResumeTemplateId;
  name: string;
  description: string;
}> = [
  { id: 'classic', name: 'Klasyczny', description: 'Elegancki, jednokolumnowy i bardzo czytelny.' },
  { id: 'modern', name: 'Nowoczesny', description: 'Mocny nagłówek i uporządkowany układ dwóch kolumn.' },
  { id: 'sidebar', name: 'Kolumnowy', description: 'Grafitowy panel boczny na kontakt i kompetencje.' },
];

export type ResumeViewModel = {
  fullName: string;
  initials: string;
  roleTitle: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
  interests: string;
  consent: string;
  labels: Record<string, string>;
};

export function normalizeTemplateId(value: string): ResumeTemplateId {
  return value === 'classic' || value === 'sidebar' ? value : 'modern';
}

export function resumeViewModel(resume: ResumeDetails): ResumeViewModel {
  const localization = activeLocalization(resume);
  const data = resume.personalData ?? {};
  const firstName = stringValue(data['firstName']);
  const lastName = stringValue(data['lastName']);
  const fullName = `${firstName} ${lastName}`.trim() || resume.title;
  const content = localization?.content ?? {};

  return {
    fullName,
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'CV',
    roleTitle: localization?.roleTitle || resume.title,
    email: stringValue(data['email']),
    phone: stringValue(data['phone']),
    city: stringValue(data['city']),
    summary: localization?.summary || '',
    experience: stringValue(content['experience']),
    education: stringValue(content['education']),
    skills: stringValue(content['skills']),
    languages: stringValue(content['languages']),
    interests: stringValue(content['interests']),
    consent: localization?.consentText || '',
    labels: localization?.sectionLabels ?? {},
  };
}

export function htmlToText(value: string): string {
  if (!value) return '';
  const element = document.createElement('div');
  element.innerHTML = value
    .replace(/<(p|div|h[1-6])[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<br\s*\/?>/gi, '\n');
  return (element.textContent ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function activeLocalization(resume: ResumeDetails): ResumeLocalization | undefined {
  return resume.localizations.find((item) => item.locale === resume.language) ?? resume.localizations[0];
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
