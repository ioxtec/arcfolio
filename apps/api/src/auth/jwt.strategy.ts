import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service.js';

type JwtPayload = { sub: string; email: string };

function cookieExtractor(request: Request): string | null {
  return request?.cookies?.auth_session ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey:
        process.env.AUTH_JWT_SECRET ??
        'local-development-secret-change-before-production-32chars',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
