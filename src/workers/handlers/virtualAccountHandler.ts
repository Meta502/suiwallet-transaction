import { Account, Transaction, TransactionStatus, VirtualAccountStatus } from "@prisma/client";
import prisma from "../../engines/prisma";

export default async function virtualAccountHandler(transaction: Transaction & { account: Account, metadata: any }) {
  const sourceBalance = transaction.account.balance
  if (!transaction.metadata?.virtualAccountId) throw Error("Malformed transfer request")

  const virtualAccount = await prisma.virtualAccount.findUnique({
    where: {
      id: transaction.metadata.virtualAccountId
    }
  })

  if (!virtualAccount) throw Error("Invalid virtual account")

  if (sourceBalance < virtualAccount.amount) throw Error("Not enough balance")

  const sourceUpdate = prisma.account.update({
    where: {
      id: transaction.accountId
    },
    data: {
      balance: {
        decrement: virtualAccount.amount ?? 0
      }
    }
  })

  const virtualAccountUpdate = prisma.virtualAccount.update({
    where: {
      id: virtualAccount.id
    },
    data: {
      status: VirtualAccountStatus.PAID
    }
  })

  const transactionUpdate = prisma.transaction.update({
    where: {
      id: transaction.id
    },
    data: {
      status: TransactionStatus.FINISHED
    }
  })

  return prisma.$transaction([
    sourceUpdate,
    virtualAccountUpdate,
    transactionUpdate,
  ])
}
