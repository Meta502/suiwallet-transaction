import { Account, Transaction, TransactionStatus, VirtualAccountStatus } from "@prisma/client";
import prisma from "../../engines/prisma";
import sendNotification from "../utils/sendNotification";

export default async function virtualAccountHandler(transaction: Transaction & { account: Account, metadata: any }) {
  const sourceBalance = transaction.account.balance
  if (!transaction.metadata?.virtualAccountId) throw Error("Malformed transfer request")

  const virtualAccount = await prisma.virtualAccount.findUnique({
    where: {
      id: transaction.metadata.virtualAccountId
    }
  })

  if (!virtualAccount) {
    sendNotification(transaction.accountId, {
      title: "Virtual Account Not Found",
      description: "Please check your VA payment code and try again",
      status: "error",
    })
    throw Error("Invalid virtual account")
  }

  if (Number(sourceBalance) < Number(virtualAccount.amount)) {
    sendNotification(transaction.accountId, {
      title: "You do not have enough money in your account",
      description: "Please top-up your account and try again",
      status: "error",
    })
    throw Error("Not enough balance")
  }

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
    .then(() => {
      sendNotification(
        transaction.accountId,
        {
          title: "Virtual Account Payment Successful",
          description: `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(transaction.metadata?.amount)} has been deducted from your account`,
          status: "success"
        }
      )
      sendNotification(
        virtualAccount.accountId,
        {
          title: "Your Virtual Account Was Paid",
          description: `Your VA "${virtualAccount.description}" has been paid and can now be withdrawed`,
          status: "success",
        }
      )
    })
}
