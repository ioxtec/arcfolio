import { Module } from '@nestjs/common';
import { ResumePolicyService } from './resume-policy.service.js';
import { ResumesController } from './resumes.controller.js';
import { ResumesService } from './resumes.service.js';

@Module({
  controllers: [ResumesController],
  providers: [ResumePolicyService, ResumesService],
})
export class ResumesModule {}
