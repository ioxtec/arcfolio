import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    const apiUrl = process.env.API_PUBLIC_URL ?? 'http://localhost:3000/api';
    super({
      clientID:
        process.env.GOOGLE_CLIENT_ID || 'google-client-id-not-configured',
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        'google-client-secret-not-configured',
      callbackURL: `${apiUrl}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new ServiceUnavailableException(
        'Google nie udostępnił adresu e-mail.',
      );
    }

    return this.authService.findOrCreateGoogleUser({
      providerAccountId: profile.id,
      email,
      displayName: profile.displayName || null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
  }
}
