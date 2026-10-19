FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace api --include-workspace-root=false

COPY apps/api apps/api
RUN npm run prisma:generate --workspace api \
    && npm run build --workspace api

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev --workspace api --include-workspace-root=false \
    && npm cache clean --force

COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/src/generated apps/api/src/generated
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma7.config.ts apps/api/prisma7.config.ts

WORKDIR /app/apps/api

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/main.js"]
