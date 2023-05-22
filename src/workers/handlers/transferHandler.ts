import { Account, Transaction, TransactionStatus, TransactionType } from "@prisma/client"
import prisma from "../../engines/prisma"
import sendNotification from "../utils/sendNotification"

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
        increment: Number(transaction.metadata?.amount) ?? 0
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

  const transactionCreation = prisma.transaction.create({
    data: {
      type: TransactionType.TRANSFER,
      status: TransactionStatus.FINISHED,
      metadata: {
        amount: Number(transaction.metadata?.amount),
        receiving: true,
      },
      account: {
        connect: {
          id: String(transaction.metadata?.targetId)
        }
      }
    }
  })

  return prisma.$transaction([
    transactionUpdate,
    sourceUpdate,
    targetUpdate,
    transactionCreation,
  ])
    .then(() => {
      sendNotification(
        transaction.accountId,
        {
          title: "Transfer Successful",
          description: `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(transaction.metadata?.amount)} has been deducted from your account`,
          status: "success"
        }
      )
    })
}

