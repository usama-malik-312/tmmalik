-- CreateEnum
CREATE TYPE "public"."CaseStatus" AS ENUM ('draft', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cnic" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Case" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "caseType" TEXT NOT NULL,
    "status" "public"."CaseStatus" NOT NULL DEFAULT 'draft',
    "propertyDetails" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_cnic_key" ON "public"."Client"("cnic");

-- CreateIndex
CREATE INDEX "Case_clientId_idx" ON "public"."Case"("clientId");

-- AddForeignKey
ALTER TABLE "public"."Case" ADD CONSTRAINT "Case_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
