-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "createdNow" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedNow" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
