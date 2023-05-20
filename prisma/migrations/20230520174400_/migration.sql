/*
  Warnings:

  - Added the required column `metadata` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TOPUP', 'TRANSFER', 'VIRTUAL_ACCOUNT');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "metadata" JSONB NOT NULL,
ADD COLUMN     "recipientId" TEXT NOT NULL,
ADD COLUMN     "senderId" TEXT NOT NULL,
ADD COLUMN     "type" "TransactionType" NOT NULL;
