import { Transaction, TransactionStatus } from "@prisma/client";
import prisma from "../../engines/prisma";
import sendNotification from "../utils/sendNotification";

export default function topUpHandler(transaction: Transaction & { metadata: any }) {
  const accountUpdate = prisma.account.update({
    where: {
      id: transaction.accountId
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

  return prisma.$transaction([
    transactionUpdate,
    accountUpdate,
  ])
    .then(() => {
      sendNotification(
        transaction.accountId,
        {
          title: "Top-Up Successful",
          description: `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(transaction.metadata?.amount)} has been added to your account`,
          status: "success"
        }
      )
    })
}
