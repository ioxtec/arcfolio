import { Injectable } from '@angular/core';
import type { Content, ContentColumns, TDocumentDefinitions } from 'pdfmake/interfaces';
import { ResumeDetails } from './resume-api.service';
import { htmlToText, normalizeTemplateId, ResumeTemplateId, resumeViewModel } from './resume-template';

@Injectable({ providedIn: 'root' })
export class ResumePdfService {
  async download(resume: ResumeDetails, templateOverride?: ResumeTemplateId): Promise<void> {
    const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]);
    (pdfMake as unknown as { vfs: Record<string, string> }).vfs =
      (pdfFonts as unknown as { pdfMake?: { vfs: Record<string, string> } }).pdfMake?.vfs ??
      (pdfFonts as unknown as Record<string, string>);

    const template = templateOverride ?? normalizeTemplateId(resume.templateId);
    pdfMake.createPdf(this.definition(resume, template)).download(`${this.fileName(resume.title)}.pdf`);
  }

  private definition(resume: ResumeDetails, template: ResumeTemplateId): TDocumentDefinitions {
    const model = resumeViewModel(resume);
    const labels = model.labels;
    const section = (label: string, html: string, accent = '#2b3033'): Content[] => {
      const text = htmlToText(html);
      if (!text) return [];
      return [
        { text: label.toUpperCase(), style: 'sectionTitle', color: accent },
        { text, style: 'body', margin: [0, 0, 0, 13] },
      ];
    };
    const contact = [model.phone, model.email, model.city].filter(Boolean).join('  •  ');
    const main = [
      ...section(labels['summary'] || 'Podsumowanie', model.summary),
      ...section(labels['experience'] || 'Doświadczenie zawodowe', model.experience),
      ...section(labels['education'] || 'Wykształcenie', model.education),
    ];
    const extras = [
      ...section(labels['skills'] || 'Umiejętności', model.skills, '#d9514b'),
      ...section(labels['languages'] || 'Języki', model.languages, '#d9514b'),
      ...section(labels['interests'] || 'Zainteresowania', model.interests, '#d9514b'),
    ];

    let content: Content[];
    if (template === 'classic') {
      content = [
        { text: model.fullName, style: 'classicName', alignment: 'center' },
        { text: model.roleTitle.toUpperCase(), style: 'role', alignment: 'center' },
        { text: contact, style: 'contact', alignment: 'center', margin: [0, 8, 0, 18] },
        ...main,
        ...extras,
      ];
    } else if (template === 'modern') {
      content = [
        {
          table: {
            widths: ['*', 180],
            body: [[
              { stack: [{ text: model.fullName, style: 'heroName', color: '#ffffff' }, { text: model.roleTitle.toUpperCase(), style: 'heroRole', color: '#ffffff' }], fillColor: '#24282b', margin: [18, 18, 10, 18] },
              { text: contact.replace(/  •  /g, '\n'), style: 'heroContact', color: '#e6e8e9', fillColor: '#24282b', margin: [10, 20, 18, 18] },
            ]],
          },
          layout: 'noBorders',
          margin: [-36, -36, -36, 26],
        },
        { columns: [{ width: '*', stack: main }, { width: 165, stack: extras, margin: [22, 0, 0, 0] }] } as ContentColumns,
      ];
    } else {
      const sidebar: Content[] = [
        { text: 'KONTAKT', style: 'sidebarTitle' },
        { text: contact.replace(/  •  /g, '\n'), style: 'sidebarText', margin: [0, 0, 0, 20] },
        ...extras,
      ];
      const rightColumn: Content[] = [
        { text: model.fullName, style: 'heroName' },
        { text: model.roleTitle.toUpperCase(), style: 'role', margin: [0, 4, 0, 22] },
        ...main,
      ];
      content = [
        {
          table: {
            widths: [160, '*'],
            body: [[
              { stack: sidebar, fillColor: '#2b3033', color: '#ffffff', margin: [12, 22, 12, 22] },
              { stack: rightColumn, margin: [22, 20, 12, 20] },
            ]],
          },
          layout: 'noBorders',
          margin: [-36, -36, -36, 0],
        },
      ];
    }

    if (model.consent) {
      content.push({
        text: htmlToText(model.consent),
        style: 'consent',
        margin: [template === 'sidebar' ? 160 : 0, 16, 0, 0],
      });
    }

    return {
      pageSize: 'A4',
      pageMargins: [36, 36, 36, 34],
      background: template === 'sidebar'
        ? () => ({
            canvas: [{ type: 'rect', x: 0, y: 0, w: 160, h: 842, color: '#2b3033' }],
            absolutePosition: { x: 0, y: 0 },
          })
        : undefined,
      content,
      defaultStyle: { font: 'Roboto', fontSize: 9, color: '#303437', lineHeight: 1.3 },
      styles: {
        classicName: { fontSize: 30, bold: true, color: '#202326' },
        heroName: { fontSize: 29, bold: true, color: '#202326' },
        role: { fontSize: 10, characterSpacing: 2.2, color: '#3f4549' },
        heroRole: { fontSize: 10, characterSpacing: 2.2 },
        heroContact: { fontSize: 8.5, lineHeight: 1.65, alignment: 'right' },
        contact: { fontSize: 8.5, color: '#62686d' },
        sectionTitle: { fontSize: 10, bold: true, characterSpacing: 1.5, margin: [0, 4, 0, 6] },
        body: { fontSize: 9.2, lineHeight: 1.35 },
        sidebarTitle: { fontSize: 10, bold: true, characterSpacing: 1.5, color: '#ffffff', margin: [0, 4, 0, 7] },
        sidebarText: { fontSize: 8.5, color: '#ffffff', lineHeight: 1.55 },
        consent: { fontSize: 6.8, color: '#858b90', alignment: 'center', lineHeight: 1.2 },
      },
      info: { title: resume.title, author: model.fullName, subject: model.roleTitle },
    };
  }

  private fileName(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cv';
  }
}
