import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import type { Response } from 'express';
import { PrismaService } from '../database/prisma.service.js';
import type { GoogleProfile, PublicUser } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

const SESSION_COOKIE = 'auth_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterDto): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Konto z tym adresem e-mail już istnieje.');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await hash(input.password, 12),
        displayName: input.displayName?.trim() || null,
      },
    });

    return this.toPublicUser(user);
  }

  async login(input: LoginDto): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (
      !user?.passwordHash ||
      !(await compare(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Nieprawidłowy e-mail lub hasło.');
    }

    return this.toPublicUser(user);
  }

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toPublicUser(user) : null;
  }

  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<PublicUser> {
    const identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (identity) {
      return this.toPublicUser(identity.user);
    }

    const email = profile.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    const user = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            displayName: existingUser.displayName ?? profile.displayName,
            avatarUrl: existingUser.avatarUrl ?? profile.avatarUrl,
            emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
            identities: {
              create: {
                provider: 'google',
                providerAccountId: profile.providerAccountId,
              },
            },
          },
        })
      : await this.prisma.user.create({
          data: {
            email,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            emailVerifiedAt: new Date(),
            identities: {
              create: {
                provider: 'google',
                providerAccountId: profile.providerAccountId,
              },
            },
          },
        });

    return this.toPublicUser(user);
  }

  async setSessionCookie(response: Response, user: PublicUser): Promise<void> {
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_TTL_MS,
      path: '/',
    });
  }

  clearSessionCookie(response: Response): void {
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }
}
