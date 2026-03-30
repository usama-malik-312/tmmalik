-- AlterEnum
ALTER TYPE "ActivityEntityType" ADD VALUE 'template';

-- AlterTable
ALTER TABLE "activities" ADD COLUMN "actorUserId" INTEGER;
ALTER TABLE "activities" ADD COLUMN "actorNameSnapshot" TEXT;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "activities_actorUserId_idx" ON "activities"("actorUserId");
