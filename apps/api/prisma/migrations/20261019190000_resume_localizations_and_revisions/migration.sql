ALTER TABLE "resumes" ADD COLUMN "revision_sequence" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "resume_localizations" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "role_title" TEXT,
    "summary" TEXT,
    "section_labels" JSONB NOT NULL DEFAULT '{}',
    "consent_text" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "resume_localizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "resume_revisions" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "name" TEXT,
    "reason" TEXT NOT NULL DEFAULT 'manual',
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resume_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resume_localizations_resume_id_idx" ON "resume_localizations"("resume_id");
CREATE UNIQUE INDEX "resume_localizations_resume_id_locale_key" ON "resume_localizations"("resume_id", "locale");
CREATE INDEX "resume_revisions_resume_id_created_at_idx" ON "resume_revisions"("resume_id", "created_at");
CREATE UNIQUE INDEX "resume_revisions_resume_id_revision_number_key" ON "resume_revisions"("resume_id", "revision_number");

ALTER TABLE "resume_localizations" ADD CONSTRAINT "resume_localizations_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resume_revisions" ADD CONSTRAINT "resume_revisions_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
