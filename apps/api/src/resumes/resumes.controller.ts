import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/auth.guards.js';
import type { PublicUser } from '../auth/auth.types.js';
import { CreateResumeRevisionDto } from './dto/create-resume-revision.dto.js';
import { CreateResumeDto } from './dto/create-resume.dto.js';
import { ResumesService } from './resumes.service.js';

type AuthenticatedRequest = Request & { user: PublicUser };

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.resumesService.list(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateResumeDto,
  ) {
    return this.resumesService.create(request.user.id, input);
  }

  @Get(':id')
  getOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.resumesService.getOne(request.user.id, id);
  }

  @Get(':id/revisions')
  listRevisions(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.resumesService.listRevisions(request.user.id, id);
  }

  @Post(':id/revisions')
  createRevision(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: CreateResumeRevisionDto,
  ) {
    return this.resumesService.createRevision(request.user.id, id, input);
  }

  @Post(':id/revisions/:revisionNumber/restore')
  restoreRevision(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('revisionNumber') revisionNumber: string,
  ) {
    return this.resumesService.restoreRevision(
      request.user.id,
      id,
      Number(revisionNumber),
    );
  }
}
