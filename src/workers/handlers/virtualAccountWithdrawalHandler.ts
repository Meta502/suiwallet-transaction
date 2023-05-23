import { Transaction, TransactionStatus } from "@prisma/client"
import prisma from "../../engines/prisma"
import sendNotification from "../utils/sendNotification"

export default async function virtualAccountWithdrawalHandler(transaction: Transaction & { metadata: any }) {
  const virtualAccountId = transaction?.metadata?.virtualAccountId
  if (!transaction.metadata?.virtualAccountId) throw Error("Malformed withdrawal request")

  const virtualAccount = await prisma.virtualAccount.findUnique({
    where: {
      id: virtualAccountId
    }
  })

  if (!virtualAccount || virtualAccount.status !== "PAID") {
    sendNotification(transaction.accountId, {
      title: "This Virtual Account Has Already Been Withdrawn",
      description: "Please try again with another Virtual Account",
      status: "warning",
    })
    return
  }

  const updateVirtualAccount = prisma.virtualAccount.update({
    where: {
      id: virtualAccount.id
    },
    data: {
      status: "WITHDRAWED"
    }
  })

  const updateAccount = prisma.account.update({
    where: {
      id: virtualAccount.accountId
    },
    data: {
      balance: {
        increment: virtualAccount.amount
      }
    }
  })

  const updateTransaction = prisma.transaction.update({
    where: {
      id: transaction.id
    },
    data: {
      status: TransactionStatus.FINISHED
    }
  })

  return prisma.$transaction([
    updateVirtualAccount,
    updateAccount,
    updateTransaction,
  ])
    .then(() => {
      sendNotification(
        transaction.accountId,
        {
          title: "Virtual Account Withdrawal Successful",
          description: `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(transaction.metadata?.amount)} has been added to your account`,
          status: "success"
        }
      )
    })
}
