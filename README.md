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

## Production deployment

Production runs as two containers behind Caddy:

- `arcfolio-web` serves the Angular application and proxies `/api` to NestJS.
- `arcfolio-api` connects to PostgreSQL through the private `arcfolio_backend` Docker network.

The server keeps application secrets in `/opt/arcfolio/app.env`. They are not stored in Git or GitHub Actions. Database backups are created before every migration and retained for 14 days by default.

The `Deploy production` GitHub Actions workflow builds immutable images in GHCR and deploys only from `main` (or through an explicit manual run). Configure the protected `production` environment with these secrets:

- `MIKRUS_HOST`
- `MIKRUS_PORT`
- `MIKRUS_USER`
- `MIKRUS_SSH_KEY`

The public health endpoint is `https://arcfolio.ryzko.pl/api/health`.

The Cloudflare DNS record for `arcfolio` must use the Mikrus server's dedicated IPv6 address (`AAAA`, proxied). The shared IPv4 address does not route ports 80/443 directly to this VPS.

For production Google sign-in, add this authorized redirect URI to the OAuth client and then fill `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `/opt/arcfolio/app.env`:

```text
https://arcfolio.ryzko.pl/api/auth/google/callback
```
