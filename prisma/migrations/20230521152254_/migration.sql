-- CreateEnum
CREATE TYPE "VirtualAccountStatus" AS ENUM ('UNPAID', 'PAID', 'WITHDRAWED');

-- CreateTable
CREATE TABLE "VirtualAccount" (
    "id" TEXT NOT NULL,
    "paymentCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "VirtualAccountStatus" NOT NULL,

    CONSTRAINT "VirtualAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VirtualAccount_paymentCode_key" ON "VirtualAccount"("paymentCode");
