import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './database/prisma.module.js';
import { ResumesModule } from './resumes/resumes.module.js';

@Module({
  imports: [PrismaModule, AuthModule, ResumesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
