import { Component, ElementRef, OnDestroy, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResumeApiService, ResumeDetails } from './resume-api.service';

type SectionId =
  | 'basics'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'interests'
  | 'consent';

type EditorPersonalData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
};

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

@Component({
  selector: 'app-resume-editor-modal',
  imports: [FormsModule],
  templateUrl: './resume-editor-modal.html',
  styleUrl: './resume-editor-modal.scss',
})
export class ResumeEditorModal implements OnInit, OnDestroy {
  private readonly api = inject(ResumeApiService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly resume = input.required<ResumeDetails>();
  readonly closed = output<void>();
  readonly saved = output<ResumeDetails>();

  protected readonly activeSection = signal<SectionId>('basics');
  protected readonly saveState = signal<SaveState>('saved');
  protected readonly sections: Array<{ id: SectionId; label: string }> = [
    { id: 'basics', label: 'Dane podstawowe' },
    { id: 'summary', label: 'Podsumowanie' },
    { id: 'experience', label: 'Doświadczenie' },
    { id: 'education', label: 'Wykształcenie' },
    { id: 'skills', label: 'Umiejętności' },
    { id: 'languages', label: 'Języki' },
    { id: 'interests', label: 'Zainteresowania' },
    { id: 'consent', label: 'Zgoda rekrutacyjna' },
  ];
  protected readonly locales = [
    ['pl-PL', 'Polski'],
    ['en-GB', 'Angielski (UK)'],
    ['en-US', 'Angielski (US)'],
    ['de-DE', 'Niemiecki'],
    ['fr-FR', 'Francuski'],
    ['es-ES', 'Hiszpański'],
    ['it-IT', 'Włoski'],
    ['sv-SE', 'Szwedzki'],
  ];

  protected title = '';
  protected locale = 'pl-PL';
  protected roleTitle = '';
  protected summary = '';
  protected consentText = '';
  protected personalData: EditorPersonalData = {
    firstName: '', lastName: '', email: '', phone: '', city: '',
  };
  protected content: Record<string, string> = {};
  private saveTimer?: ReturnType<typeof setTimeout>;
  private initialized = false;
  private closeAfterSave = false;

  ngOnInit(): void {
    const document = this.resume();
    const localization =
      document.localizations.find((item) => item.locale === document.language) ??
      document.localizations[0];
    const personalData = document.personalData ?? {};

    this.title = document.title;
    this.locale = localization?.locale ?? document.language ?? 'pl-PL';
    this.roleTitle = localization?.roleTitle ?? '';
    this.summary = localization?.summary ?? '';
    this.consentText = localization?.consentText ?? '';
    this.personalData = {
      firstName: this.stringValue(personalData['firstName']),
      lastName: this.stringValue(personalData['lastName']),
      email: this.stringValue(personalData['email']),
      phone: this.stringValue(personalData['phone']),
      city: this.stringValue(personalData['city']),
    };
    this.content = Object.fromEntries(
      Object.entries(localization?.content ?? {}).map(([key, value]) => [key, this.stringValue(value)]),
    );
    this.initialized = true;
  }

  ngOnDestroy(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }

  protected activeIndex(): number {
    return this.sections.findIndex((section) => section.id === this.activeSection());
  }

  protected sectionTitle(): string {
    return this.sections[this.activeIndex()]?.label ?? '';
  }

  protected sectionDescription(): string {
    const descriptions: Record<SectionId, string> = {
      basics: 'Podstawowe informacje widoczne w nagłówku Twojego CV.',
      summary: 'Krótka prezentacja doświadczenia i najważniejszych kompetencji.',
      experience: 'Opisz najważniejsze role, projekty i rezultaty swojej pracy.',
      education: 'Dodaj szkoły, uczelnie, kursy i certyfikaty.',
      skills: 'Wymień technologie i kompetencje istotne dla rekrutera.',
      languages: 'Podaj języki oraz poziom ich znajomości.',
      interests: 'Pokaż zainteresowania, które dobrze uzupełniają Twój profil.',
      consent: 'Treść zgody dopasowana do języka i rynku rekrutacji.',
    };
    return descriptions[this.activeSection()];
  }

  protected nextSection(): void {
    const next = Math.min(this.activeIndex() + 1, this.sections.length - 1);
    this.activeSection.set(this.sections[next].id);
  }

  protected previousSection(): void {
    const previous = Math.max(this.activeIndex() - 1, 0);
    this.activeSection.set(this.sections[previous].id);
  }

  protected selectSection(id: SectionId): void {
    this.activeSection.set(id);
  }

  protected nextLabel(): string {
    const next = this.sections[this.activeIndex() + 1];
    return next ? `Dalej: ${next.label}` : 'Zakończ edycję';
  }

  protected queueSave(): void {
    if (!this.initialized) return;
    this.saveState.set('dirty');
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), 900);
  }

  protected saveNow(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.saveState() === 'saving') return;
    this.saveState.set('saving');
    this.api.update(this.resume().id, {
      title: this.title,
      locale: this.locale,
      roleTitle: this.roleTitle,
      summary: this.summary,
      consentText: this.consentText,
      personalData: this.personalData,
      content: this.content,
    }).subscribe({
      next: ({ resume }) => {
        this.saveState.set('saved');
        this.saved.emit(resume);
        if (this.closeAfterSave) this.closed.emit();
      },
      error: () => {
        this.closeAfterSave = false;
        this.saveState.set('error');
      },
    });
  }

  protected requestClose(): void {
    if (this.saveState() === 'dirty' || this.saveState() === 'error') {
      this.closeAfterSave = true;
      this.saveNow();
      return;
    }
    if (this.saveState() !== 'saving') this.closed.emit();
  }

  protected editorValue(): string {
    switch (this.activeSection()) {
      case 'summary': return this.summary;
      case 'consent': return this.consentText;
      default: return this.content[this.activeSection()] ?? '';
    }
  }

  protected updateEditor(event: Event): void {
    const value = (event.currentTarget as HTMLElement).innerHTML;
    switch (this.activeSection()) {
      case 'summary': this.summary = value; break;
      case 'consent': this.consentText = value; break;
      default: this.content = { ...this.content, [this.activeSection()]: value };
    }
    this.queueSave();
  }

  protected format(command: 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList' | 'undo' | 'redo'): void {
    const editor = this.host.nativeElement.querySelector<HTMLElement>('[data-rich-editor]');
    if (!editor) return;
    editor.focus();
    document.execCommand(command);
    this.updateEditor({ currentTarget: editor } as unknown as Event);
  }

  protected saveLabel(): string {
    const labels: Record<SaveState, string> = {
      saved: 'Zapisano', dirty: 'Niezapisane zmiany', saving: 'Zapisywanie…', error: 'Błąd zapisu',
    };
    return labels[this.saveState()];
  }

  protected localeLabel(): string {
    return this.locales.find((item) => item[0] === this.locale)?.[1] ?? this.locale;
  }

  protected initials(): string {
    return `${this.personalData.firstName.charAt(0)}${this.personalData.lastName.charAt(0)}`.toUpperCase() || 'CV';
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
