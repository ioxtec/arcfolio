import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../database/prisma.service.js';
import { AuthService } from './auth.service.js';

const user = {
  id: 'f68bfc26-50ef-4ca2-8ed7-f440fcefc67a',
  email: 'anna@example.com',
  passwordHash: null,
  displayName: 'Anna Kowalska',
  avatarUrl: null,
  emailVerifiedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createService() {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    authIdentity: {
      findUnique: vi.fn(),
    },
  };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as never,
  );

  return { service, prisma, jwt };
}

describe('AuthService', () => {
  it('normalizes the email and hashes a password during registration', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => ({ ...user, ...data }));

    const result = await service.register({
      email: ' Anna@Example.com ',
      password: 'bezpieczne-haslo',
      displayName: ' Anna Kowalska ',
    });

    expect(result.email).toBe('anna@example.com');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'anna@example.com',
        displayName: 'Anna Kowalska',
        passwordHash: expect.not.stringContaining('bezpieczne-haslo'),
      }),
    });
  });

  it('rejects registration when the email already exists', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      service.register({ email: user.email, password: 'bezpieczne-haslo' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('accepts a valid password', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash: await hash('bezpieczne-haslo', 4),
    });

    await expect(
      service.login({ email: user.email, password: 'bezpieczne-haslo' }),
    ).resolves.toMatchObject({ email: user.email });
  });

  it('returns the same error for an unknown email and a wrong password', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nikt@example.com', password: 'niepoprawne' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
