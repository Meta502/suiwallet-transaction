/*
  Warnings:

  - You are about to drop the column `recipientId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "recipientId",
DROP COLUMN "senderId";
