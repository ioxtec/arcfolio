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
5. Run `npm run db:migrate`.
6. Run `npm run dev`.

Web: `http://localhost:4200`  
API health check: `http://localhost:3000/api/health`

## Authentication

Email/password authentication works after the PostgreSQL migration is applied. Sessions use an HTTP-only cookie.

To enable Google sign-in, create a Google OAuth 2.0 web client and set these values in `apps/api/.env`:

```dotenv
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

For local development, add this authorized redirect URI to the Google client:

```text
http://localhost:3000/api/auth/google/callback
```

`AUTH_JWT_SECRET` must be replaced with a long random value outside local development.

## Renaming the product

Change `productName` in `apps/web/src/app/core/config/brand.config.ts`. Technical identifiers intentionally do not contain the product name.
