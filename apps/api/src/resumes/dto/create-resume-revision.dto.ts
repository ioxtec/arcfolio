import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateResumeRevisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
