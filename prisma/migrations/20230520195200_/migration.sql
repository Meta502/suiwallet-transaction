/*
  Warnings:

  - You are about to drop the column `createdNow` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedNow` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "createdNow",
DROP COLUMN "updatedNow",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
