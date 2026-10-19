import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override canActivate(context: ExecutionContext) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new ServiceUnavailableException(
        'Logowanie Google wymaga konfiguracji GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET.',
      );
    }
    return super.canActivate(context);
  }
}
