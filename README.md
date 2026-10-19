# Career document platform

Working product name: **Arcfolio**.

The repository uses neutral technical names so the product can be renamed without changing application structure, package names, database names, or API routes.

## Applications

- `apps/web` — Angular web application
- `apps/api` — NestJS API with Prisma
- PostgreSQL — local database defined in `compose.yaml`

## Local development

1. Install Node.js 24 and Docker.
2. Copy `.env.example` to `.env` and `apps/api/.env`.
3. Run `npm install`.
4. Run `docker compose up -d`.
5. Run `npm run db:migrate -- --name init`.
6. Run `npm run dev`.

Web: `http://localhost:4200`  
API health check: `http://localhost:3000/api/health`

## Renaming the product

Change `productName` in `apps/web/src/app/core/config/brand.config.ts`. Technical identifiers intentionally do not contain the product name.
