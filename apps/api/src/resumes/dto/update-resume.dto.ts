import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SUPPORTED_LOCALES } from './create-resume.dto.js';

export class ResumePersonalDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;
}

export class UpdateResumeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(['classic', 'modern', 'sidebar'])
  templateId?: 'classic' | 'modern' | 'sidebar';

  @IsString()
  @IsIn(SUPPORTED_LOCALES)
  locale!: (typeof SUPPORTED_LOCALES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  roleTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(6000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(6000)
  consentText?: string;

  @IsOptional()
  @IsObject()
  personalData?: ResumePersonalDataDto;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
