-- AlterEnum: extend CaseStatus
ALTER TYPE "CaseStatus" ADD VALUE 'submitted';
ALTER TYPE "CaseStatus" ADD VALUE 'rejected';

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('client', 'case', 'document');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_entityType_entityId_idx" ON "activities"("entityType", "entityId");
