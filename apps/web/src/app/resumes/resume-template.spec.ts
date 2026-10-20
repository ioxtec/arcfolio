import { describe, expect, it } from 'vitest';
import { htmlToText, normalizeTemplateId } from './resume-template';

describe('resume template helpers', () => {
  it('falls back to the modern template for unknown values', () => {
    expect(normalizeTemplateId('classic')).toBe('classic');
    expect(normalizeTemplateId('sidebar')).toBe('sidebar');
    expect(normalizeTemplateId('legacy-template')).toBe('modern');
  });

  it('keeps meaningful line breaks when converting editor HTML for PDF', () => {
    const html = 'Polski - ojczysty<div>Angielski - C1</div><div><br></div><ul><li>Angular</li><li>TypeScript</li></ul>';

    expect(htmlToText(html)).toBe('Polski - ojczysty\nAngielski - C1\n\n• Angular\n• TypeScript');
  });
});
