import { Router, Request, Response } from "express"
import prisma from "../engines/prisma"
import { TransactionType, VirtualAccountStatus } from "@prisma/client"
import { getRabbitMQInstance } from "../engines/rabbitmq"
import sendNotification from "../workers/utils/sendNotification"

const virtualAccountRouter = Router()
virtualAccountRouter.get("/account/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params

  const virtualAccounts = await prisma.virtualAccount.findMany({
    where: {
      accountId: userId,
      status: {
        not: "WITHDRAWED"
      }
    },
  })

  return res
    .status(200)
    .json(
      virtualAccounts
    )
})

virtualAccountRouter.get("/:paymentCode", async (req: Request, res: Response) => {
  const { paymentCode } = req.params

  const virtualAccount = await prisma.virtualAccount.findUnique({
    where: {
      paymentCode
    }
  })

  return res
    .status(200)
    .json(
      virtualAccount
    )
})

virtualAccountRouter.delete("/withdraw/:virtualAccountId", async (req: Request, res: Response) => {
  const { virtualAccountId } = req.params

  const virtualAccount = await prisma.virtualAccount.findUnique({
    where: {
      id: virtualAccountId
    }
  })

  if (!virtualAccount) {
    return res.status(400).json({
      message: "Invalid virtual account ID"
    })
  }

  if (virtualAccount.status === VirtualAccountStatus.UNPAID) {
    await prisma.virtualAccount.delete({
      where: {
        id: virtualAccountId,
      },
    })

    sendNotification(virtualAccount.accountId, {
      title: "Your virtual account has been successfully deleted",
      description: "",
      status: "success"
    })

    return res.status(200).json({
      message: "Virtual account has been deleted"
    })
  }

  if (virtualAccount.status === VirtualAccountStatus.WITHDRAWED) {
    return res.status(400).json({
      message: "Virtual account has already been withdraw"
    })
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.VIRTUAL_ACCOUNT_WITHDRAWAL,
      metadata: {
        virtualAccountId: virtualAccount.id,
        amount: Number(virtualAccount.amount),
      },
      account: {
        connect: {
          id: virtualAccount.accountId
        }
      }
    }
  })

  const channel = await getRabbitMQInstance().then((client) => (
    client.createChannel()
  ))

  await channel.assertQueue("transactionQueue")

  channel.sendToQueue("transactionQueue", Buffer.from(
    JSON.stringify({
      id: transaction.id,
      type: transaction.type,
    })
  ))

  return res.status(201).json()
})

virtualAccountRouter.put("/:paymentCode", async (req: Request, res: Response) => {
  const { paymentCode } = req.params
  const { userId } = req.body

  const account = await prisma.account.findUnique({
    where: {
      id: userId
    }
  })

  if (!account) {
    return res.status(400).json({ message: "Source account not found" })
  }

  const virtualAccount = await prisma.virtualAccount.findUnique({
    where: {
      paymentCode
    }
  })

  if (!virtualAccount) {
    return res.status(400).json({ message: "Virtual account not found" })
  }

  if (Number(account?.balance) < Number(virtualAccount.amount)) {
    return res.status(400).json({ message: "Not enough funds" })
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.VIRTUAL_ACCOUNT,
      metadata: {
        virtualAccountId: virtualAccount.id,
        amount: Number(virtualAccount.amount),
      },
      account: {
        connect: {
          id: userId
        }
      }
    }
  })

  const channel = await getRabbitMQInstance().then((client) => (
    client.createChannel()
  ))

  await channel.assertQueue("transactionQueue")

  channel.sendToQueue("transactionQueue", Buffer.from(
    JSON.stringify({
      id: transaction.id,
      type: transaction.type,
    })
  ))

  return res.status(201).json({
    message: "Successfully paid VA"
  })
})

virtualAccountRouter.post("/", async (req: Request, res: Response) => {
  const { userId, title, description, amount } = req.body

  const virtualAccount = await prisma.virtualAccount.create({
    data: {
      title,
      description,
      amount,
      paymentCode: String(
        Math.floor(
          Math.random() * 1000000
        )
      ),
      account: {
        connect: {
          id: userId
        }
      }
    }
  })

  return res.status(201).json(virtualAccount)
})

export default virtualAccountRouter
