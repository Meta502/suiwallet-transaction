-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('EXPIRED', 'PENDING', 'PROCESSING', 'FINISHED');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';
