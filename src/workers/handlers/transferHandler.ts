import { Account, Transaction, TransactionStatus } from "@prisma/client"
import prisma from "../../engines/prisma"

export default function transferHandler(transaction: Transaction & { account: Account, metadata: any }) {
  const sourceBalance = transaction.account.balance
  if (!transaction.metadata?.amount) throw Error("Malformed transfer request")
  if (Number(sourceBalance) < Number(transaction.metadata?.amount)) {
    throw Error("Insufficient account balance")
  }

  const sourceUpdate = prisma.account.update({
    where: {
      id: transaction.accountId
    },
    data: {
      balance: {
        decrement: Number(transaction.metadata?.amount) ?? 0
      }
    }
  })

  const targetUpdate = prisma.account.update({
    where: {
      id: String(transaction.metadata?.targetId)
    },
    data: {
      balance: {
        decrement: Number(transaction.metadata?.amount) ?? 0
      }
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
    transactionUpdate,
    sourceUpdate,
    targetUpdate,
  ])
}

