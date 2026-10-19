-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'pl',
    "personal_data" JSONB NOT NULL DEFAULT '{}',
    "summary" TEXT,
    "template_id" TEXT NOT NULL DEFAULT 'classic',
    "theme_settings" JSONB NOT NULL DEFAULT '{}',
    "section_order" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "location" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" JSONB NOT NULL DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "educations" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "institution" TEXT NOT NULL,
    "field" TEXT,
    "degree" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities"("user_id");
CREATE UNIQUE INDEX "auth_identities_provider_provider_account_id_key" ON "auth_identities"("provider", "provider_account_id");
CREATE INDEX "resumes_user_id_idx" ON "resumes"("user_id");
CREATE INDEX "experiences_resume_id_sort_order_idx" ON "experiences"("resume_id", "sort_order");
CREATE INDEX "educations_resume_id_sort_order_idx" ON "educations"("resume_id", "sort_order");
CREATE INDEX "skills_resume_id_sort_order_idx" ON "skills"("resume_id", "sort_order");

ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "educations" ADD CONSTRAINT "educations_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skills" ADD CONSTRAINT "skills_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
