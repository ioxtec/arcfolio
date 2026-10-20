import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const SUPPORTED_LOCALES = [
  'pl-PL',
  'en-GB',
  'en-US',
  'de-DE',
  'fr-FR',
  'es-ES',
  'it-IT',
  'sv-SE',
] as const;

export class CreateResumeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsIn(SUPPORTED_LOCALES)
  locale!: (typeof SUPPORTED_LOCALES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  roleTitle?: string;
}
