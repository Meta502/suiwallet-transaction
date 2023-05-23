import { TransactionType } from "@prisma/client"
import { Router } from "express"
import type { Request, Response } from "express"
import prisma from "../engines/prisma"
import { getRabbitMQInstance } from "../engines/rabbitmq"

const transferRouter = Router()
transferRouter.post("/", async (req: Request, res: Response) => {
  const { sourceId, targetId, amount } = req.body

  const account = await prisma.account.findUnique({
    where: {
      id: sourceId
    }
  })

  const targetAccount = await prisma.account.findUnique({
    where: {
      id: targetId
    }
  })

  if (!account) {
    return res.status(400).json({ message: "Source account not found" })
  }

  if (!targetAccount) {
    return res.status(400).json({ message: "Target account not found" })
  }

  if (Number(account?.balance) < Number(amount)) {
    return res.status(400).json({ message: "Not enough money" })
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.TRANSFER,
      metadata: {
        targetId,
        amount,
      },
      accountId: sourceId,
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
    message: "Transfer successful"
  })
})

export default transferRouter
