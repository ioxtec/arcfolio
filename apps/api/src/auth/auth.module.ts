import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { GoogleAuthGuard, JwtAuthGuard } from './auth.guards.js';
import { AuthService } from './auth.service.js';
import { GoogleStrategy } from './google.strategy.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret:
        process.env.AUTH_JWT_SECRET ??
        'local-development-secret-change-before-production-32chars',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    GoogleAuthGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
