import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { CreateResumeRevisionDto } from './dto/create-resume-revision.dto.js';
import type { CreateResumeDto } from './dto/create-resume.dto.js';
import type { UpdateResumeDto } from './dto/update-resume.dto.js';
import { ResumePolicyService } from './resume-policy.service.js';

const DEFAULT_SECTION_LABELS: Record<string, Record<string, string>> = {
  'pl-PL': {
    summary: 'Podsumowanie',
    experience: 'Doświadczenie zawodowe',
    education: 'Wykształcenie',
    skills: 'Umiejętności',
    languages: 'Języki',
    interests: 'Zainteresowania',
  },
  'en-GB': {
    summary: 'Profile',
    experience: 'Work experience',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    interests: 'Interests',
  },
  'en-US': {
    summary: 'Professional summary',
    experience: 'Work experience',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    interests: 'Interests',
  },
};

const DEFAULT_SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'interests',
];

type ResumeSnapshot = {
  title: string;
  language: string;
  personalData: Prisma.InputJsonValue;
  summary: string | null;
  templateId: string;
  themeSettings: Prisma.InputJsonValue;
  sectionOrder: Prisma.InputJsonValue;
  localizations: Array<{
    locale: string;
    roleTitle: string | null;
    summary: string | null;
    sectionLabels: Prisma.InputJsonValue;
    consentText: string | null;
    content: Prisma.InputJsonValue;
  }>;
  experiences?: Array<{
    company: string;
    position: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    description: Prisma.InputJsonValue;
    sortOrder: number;
  }>;
  educations?: Array<{
    institution: string;
    field: string | null;
    degree: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    sortOrder: number;
  }>;
  skills?: Array<{
    name: string;
    level: string | null;
    sortOrder: number;
  }>;
};

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: ResumePolicyService,
  ) {}

  async list(userId: string) {
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        localizations: { select: { locale: true, roleTitle: true } },
        _count: { select: { revisions: true } },
      },
    });

    return {
      resumes: resumes.map((resume) => ({
        id: resume.id,
        title: resume.title,
        templateId: resume.templateId,
        updatedAt: resume.updatedAt,
        locales: resume.localizations.map((item) => item.locale),
        roleTitle: resume.localizations[0]?.roleTitle ?? null,
        revisionCount: resume._count.revisions,
      })),
      limits: {
        documents: this.policy.maxDocuments,
        versions: this.policy.maxVersions,
      },
    };
  }

  async create(userId: string, input: CreateResumeDto) {
    const documentCount = await this.prisma.resume.count({ where: { userId } });
    if (documentCount >= this.policy.maxDocuments) {
      throw new ConflictException(
        `Osiągnięto limit ${this.policy.maxDocuments} dokumentów.`,
      );
    }

    return this.prisma.resume.create({
      data: {
        userId,
        title: input.title.trim(),
        language: input.locale,
        templateId: 'modern',
        sectionOrder: DEFAULT_SECTION_ORDER,
        localizations: {
          create: {
            locale: input.locale,
            roleTitle: input.roleTitle?.trim() || input.title.trim(),
            sectionLabels:
              DEFAULT_SECTION_LABELS[input.locale] ??
              DEFAULT_SECTION_LABELS['en-GB'],
          },
        },
      },
      include: { localizations: true },
    });
  }

  async getOne(userId: string, id: string) {
    const resume = await this.findOwnedResume(userId, id);
    return {
      resume,
      limits: { versions: this.policy.maxVersions },
    };
  }

  async update(userId: string, id: string, input: UpdateResumeDto) {
    await this.assertOwnedResume(userId, id);

    const resume = await this.prisma.resume.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        language: input.locale,
        ...(input.personalData !== undefined
          ? { personalData: input.personalData as Prisma.InputJsonValue }
          : {}),
        localizations: {
          upsert: {
            where: { resumeId_locale: { resumeId: id, locale: input.locale } },
            update: {
              ...(input.roleTitle !== undefined
                ? { roleTitle: input.roleTitle.trim() || null }
                : {}),
              ...(input.summary !== undefined ? { summary: input.summary || null } : {}),
              ...(input.consentText !== undefined
                ? { consentText: input.consentText || null }
                : {}),
              ...(input.content !== undefined
                ? { content: input.content as Prisma.InputJsonValue }
                : {}),
            },
            create: {
              locale: input.locale,
              roleTitle: input.roleTitle?.trim() || null,
              summary: input.summary || null,
              consentText: input.consentText || null,
              content: (input.content ?? {}) as Prisma.InputJsonValue,
              sectionLabels:
                DEFAULT_SECTION_LABELS[input.locale] ??
                DEFAULT_SECTION_LABELS['en-GB'],
            },
          },
        },
      },
      include: { localizations: true, _count: { select: { revisions: true } } },
    });

    return { resume };
  }

  async listRevisions(userId: string, resumeId: string) {
    await this.assertOwnedResume(userId, resumeId);
    const revisions = await this.prisma.resumeRevision.findMany({
      where: { resumeId },
      orderBy: { revisionNumber: 'desc' },
      select: {
        id: true,
        revisionNumber: true,
        name: true,
        reason: true,
        createdAt: true,
      },
    });
    return { revisions, limit: this.policy.maxVersions };
  }

  async createRevision(
    userId: string,
    resumeId: string,
    input: CreateResumeRevisionDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const resume = await transaction.resume.findFirst({
        where: { id: resumeId, userId },
        include: {
          localizations: true,
          experiences: { orderBy: { sortOrder: 'asc' } },
          educations: { orderBy: { sortOrder: 'asc' } },
          skills: { orderBy: { sortOrder: 'asc' } },
        },
      });
      if (!resume) throw new NotFoundException('Nie znaleziono dokumentu.');

      const revisionCount = await transaction.resumeRevision.count({
        where: { resumeId },
      });
      if (revisionCount >= this.policy.maxVersions) {
        throw new ConflictException(
          `Osiągnięto limit ${this.policy.maxVersions} zapisanych wersji.`,
        );
      }

      const sequencedResume = await transaction.resume.update({
        where: { id: resumeId },
        data: { revisionSequence: { increment: 1 } },
      });
      const snapshot = this.makeSnapshot(resume);
      const revision = await transaction.resumeRevision.create({
        data: {
          resumeId,
          revisionNumber: sequencedResume.revisionSequence,
          name: input.name?.trim() || null,
          snapshot: JSON.parse(JSON.stringify(snapshot)),
        },
        select: {
          id: true,
          revisionNumber: true,
          name: true,
          reason: true,
          createdAt: true,
        },
      });
      return { revision, limit: this.policy.maxVersions };
    });
  }

  async restoreRevision(
    userId: string,
    resumeId: string,
    revisionNumber: number,
  ) {
    if (!Number.isInteger(revisionNumber) || revisionNumber < 1) {
      throw new NotFoundException('Nie znaleziono wersji.');
    }

    const revision = await this.prisma.resumeRevision.findFirst({
      where: { resumeId, revisionNumber, resume: { userId } },
    });
    if (!revision) throw new NotFoundException('Nie znaleziono wersji.');
    const snapshot = revision.snapshot as ResumeSnapshot;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.resumeLocalization.deleteMany({ where: { resumeId } });
      await transaction.experience.deleteMany({ where: { resumeId } });
      await transaction.education.deleteMany({ where: { resumeId } });
      await transaction.skill.deleteMany({ where: { resumeId } });
      await transaction.resume.update({
        where: { id: resumeId },
        data: {
          title: snapshot.title,
          language: snapshot.language,
          personalData: snapshot.personalData,
          summary: snapshot.summary,
          templateId: snapshot.templateId,
          themeSettings: snapshot.themeSettings,
          sectionOrder: snapshot.sectionOrder,
          localizations: { create: snapshot.localizations },
          experiences: {
            create: (snapshot.experiences ?? []).map((item) => ({
              ...item,
              startDate: item.startDate ? new Date(item.startDate) : null,
              endDate: item.endDate ? new Date(item.endDate) : null,
            })),
          },
          educations: {
            create: (snapshot.educations ?? []).map((item) => ({
              ...item,
              startDate: item.startDate ? new Date(item.startDate) : null,
              endDate: item.endDate ? new Date(item.endDate) : null,
            })),
          },
          skills: { create: snapshot.skills ?? [] },
        },
      });
    });

    return this.getOne(userId, resumeId);
  }

  private assertOwnedResume(userId: string, id: string) {
    return this.findOwnedResume(userId, id).then(() => undefined);
  }

  private async findOwnedResume(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
      include: { localizations: true, _count: { select: { revisions: true } } },
    });
    if (!resume) throw new NotFoundException('Nie znaleziono dokumentu.');
    return resume;
  }

  private makeSnapshot(resume: {
    title: string;
    language: string;
    personalData: Prisma.JsonValue;
    summary: string | null;
    templateId: string;
    themeSettings: Prisma.JsonValue;
    sectionOrder: Prisma.JsonValue;
    localizations: Array<{
      locale: string;
      roleTitle: string | null;
      summary: string | null;
      sectionLabels: Prisma.JsonValue;
      consentText: string | null;
      content: Prisma.JsonValue;
    }>;
    experiences: Array<{
      company: string;
      position: string;
      location: string | null;
      startDate: Date | null;
      endDate: Date | null;
      isCurrent: boolean;
      description: Prisma.JsonValue;
      sortOrder: number;
    }>;
    educations: Array<{
      institution: string;
      field: string | null;
      degree: string | null;
      startDate: Date | null;
      endDate: Date | null;
      description: string | null;
      sortOrder: number;
    }>;
    skills: Array<{
      name: string;
      level: string | null;
      sortOrder: number;
    }>;
  }): ResumeSnapshot {
    return {
      title: resume.title,
      language: resume.language,
      personalData: this.normalizeJson(resume.personalData),
      summary: resume.summary,
      templateId: resume.templateId,
      themeSettings: this.normalizeJson(resume.themeSettings),
      sectionOrder: this.normalizeJson(resume.sectionOrder),
      localizations: resume.localizations.map((item) => ({
        locale: item.locale,
        roleTitle: item.roleTitle,
        summary: item.summary,
        sectionLabels: this.normalizeJson(item.sectionLabels),
        consentText: item.consentText,
        content: this.normalizeJson(item.content),
      })),
      experiences: resume.experiences.map((item) => ({
        company: item.company,
        position: item.position,
        location: item.location,
        startDate: item.startDate?.toISOString() ?? null,
        endDate: item.endDate?.toISOString() ?? null,
        isCurrent: item.isCurrent,
        description: this.normalizeJson(item.description),
        sortOrder: item.sortOrder,
      })),
      educations: resume.educations.map((item) => ({
        institution: item.institution,
        field: item.field,
        degree: item.degree,
        startDate: item.startDate?.toISOString() ?? null,
        endDate: item.endDate?.toISOString() ?? null,
        description: item.description,
        sortOrder: item.sortOrder,
      })),
      skills: resume.skills.map((item) => ({
        name: item.name,
        level: item.level,
        sortOrder: item.sortOrder,
      })),
    };
  }

  private normalizeJson(value: Prisma.JsonValue): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
  }
}
