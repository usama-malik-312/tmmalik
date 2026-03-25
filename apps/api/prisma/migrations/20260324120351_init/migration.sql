/*
  Warnings:

  - The primary key for the `Case` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Case` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `clientId` on the `Case` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Case" DROP CONSTRAINT "Case_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."Case" DROP CONSTRAINT "Case_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD CONSTRAINT "Case_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Case_clientId_idx" ON "public"."Case"("clientId");

-- AddForeignKey
ALTER TABLE "public"."Case" ADD CONSTRAINT "Case_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
