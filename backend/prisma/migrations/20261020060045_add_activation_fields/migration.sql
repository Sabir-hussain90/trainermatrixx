/*
  Warnings:

  - A unique constraint covering the columns `[activationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "activationExpires" TIMESTAMP(3),
ADD COLUMN     "activationToken" TEXT,
ALTER COLUMN "password" SET DEFAULT '',
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "User_activationToken_key" ON "User"("activationToken");

-- CreateIndex
CREATE INDEX "User_activationToken_idx" ON "User"("activationToken");
