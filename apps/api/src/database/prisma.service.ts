import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ??
      'postgresql://cv_app:dev_only_password@localhost:5432/cv_app?schema=public';

    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
