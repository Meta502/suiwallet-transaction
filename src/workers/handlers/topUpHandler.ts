import { Transaction, TransactionStatus } from "@prisma/client";
import prisma from "../../engines/prisma";

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
}
