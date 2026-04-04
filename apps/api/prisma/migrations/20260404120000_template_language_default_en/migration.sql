-- New templates default to English (LTR); existing rows unchanged.
ALTER TABLE "templates" ALTER COLUMN "language" SET DEFAULT 'en';
