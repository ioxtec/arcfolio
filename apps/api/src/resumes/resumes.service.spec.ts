import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../database/prisma.service.js';
import { ResumePolicyService } from './resume-policy.service.js';
import { ResumesService } from './resumes.service.js';

const resume = {
  id: '9c9cc688-50ef-43e8-90fb-18c74995a55f',
  userId: 'aaea1188-b6b5-4485-ada0-0929bedba1db',
  title: 'Senior Angular Developer',
  language: 'pl-PL',
  personalData: {},
  summary: null,
  templateId: 'modern',
  themeSettings: {},
  sectionOrder: [],
  revisionSequence: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  localizations: [
    {
      id: '1f343a43-ea76-461f-a752-930e9fa3bfca',
      resumeId: '9c9cc688-50ef-43e8-90fb-18c74995a55f',
      locale: 'pl-PL',
      roleTitle: 'Senior Angular Developer',
      summary: null,
      sectionLabels: {},
      consentText: null,
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  experiences: [],
  educations: [],
  skills: [],
};

describe('ResumesService', () => {
  it('rejects creating documents over the plan limit', async () => {
    const prisma = {
      resume: { count: vi.fn().mockResolvedValue(5) },
    } as unknown as PrismaService;
    const service = new ResumesService(prisma, new ResumePolicyService());

    await expect(
      service.create(resume.userId, {
        title: resume.title,
        locale: 'pl-PL',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates the next immutable revision with a monotonic number', async () => {
    const transaction = {
      resume: {
        findFirst: vi.fn().mockResolvedValue(resume),
        update: vi.fn().mockResolvedValue({ ...resume, revisionSequence: 8 }),
      },
      resumeRevision: {
        count: vi.fn().mockResolvedValue(7),
        create: vi.fn().mockImplementation(({ data }) => ({
          id: 'revision-id',
          revisionNumber: data.revisionNumber,
          name: data.name,
          reason: 'manual',
          createdAt: new Date(),
        })),
      },
    };
    const prisma = {
      $transaction: vi.fn().mockImplementation((callback) => callback(transaction)),
    } as unknown as PrismaService;
    const service = new ResumesService(prisma, new ResumePolicyService());

    const result = await service.createRevision(resume.userId, resume.id, {
      name: 'CV dla Acme',
    });

    expect(result.revision.revisionNumber).toBe(8);
    expect(result.revision.name).toBe('CV dla Acme');
    expect(transaction.resumeRevision.create).toHaveBeenCalledOnce();
  });

  it('updates the current draft and its selected localization', async () => {
    const update = vi.fn().mockResolvedValue(resume);
    const prisma = {
      resume: {
        findFirst: vi.fn().mockResolvedValue(resume),
        update,
      },
    } as unknown as PrismaService;
    const service = new ResumesService(prisma, new ResumePolicyService());

    await service.update(resume.userId, resume.id, {
      locale: 'pl-PL',
      roleTitle: 'Lead Frontend Developer',
      summary: '<b>Tworzę dostępne aplikacje.</b>',
      personalData: { firstName: 'Anna', city: 'Warszawa' },
      content: { experience: '<ul><li>Arcfolio</li></ul>' },
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: resume.id },
        data: expect.objectContaining({
          language: 'pl-PL',
          personalData: { firstName: 'Anna', city: 'Warszawa' },
          localizations: {
            upsert: expect.objectContaining({
              where: { resumeId_locale: { resumeId: resume.id, locale: 'pl-PL' } },
            }),
          },
        }),
      }),
    );
  });
});
