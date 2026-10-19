import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import type { PublicUser } from './auth.types.js';
import { GoogleAuthGuard, JwtAuthGuard } from './auth.guards.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

type AuthenticatedRequest = Request & { user: PublicUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.register(input);
    await this.authService.setSessionCookie(response, user);
    return { user };
  }

  @Post('login')
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.login(input);
    await this.authService.setSessionCookie(response, user);
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    this.authService.clearSessionCookie(response);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    await this.authService.setSessionCookie(response, request.user);
    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:4200';
    response.redirect(`${webOrigin}/auth/callback`);
  }
}
