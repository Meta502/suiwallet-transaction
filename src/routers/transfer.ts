import { TransactionType } from "@prisma/client"
import { Router } from "express"
import type { Request, Response } from "express"
import prisma from "../engines/prisma"
import { getRabbitMQInstance } from "../engines/rabbitmq"

const transferRouter = Router()
transferRouter.post("/", async (req: Request, res: Response) => {
  const { sourceId, targetId, amount } = req.body

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

  return res.status(201).json()
})

export default transferRouter
