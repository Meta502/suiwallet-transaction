import { Router } from "express"
import { getRedisClientInstance } from "../engines/redis"
import prisma from "../engines/prisma"
import { TransactionStatus, TransactionType } from "@prisma/client"
import { getRabbitMQInstance } from "../engines/rabbitmq"

import type { Request, Response } from "express"

const EXPIRES_IN = 60 * 60 * 4

const topUpRouter = Router()
topUpRouter.post("/", async (req, res) => {
  const { accountId, amount } = req.body
  const redisClient = await getRedisClientInstance()

  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.TOPUP,
      metadata: {
        amount
      },
      account: {
        connect: {
          id: accountId
        }
      }
    }
  })

  await redisClient.set(`topUp:${transaction.id}`, "EX", {
    EX: EXPIRES_IN
  })

  res.status(201).json(transaction)
})

topUpRouter.put("/:transactionId", async (req: Request, res: Response) => {
  const { transactionId } = req.params

  const transaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId,
    }
  })

  if (!transaction) {
    return res.status(404).json({
      message: "Transaction not found",
    })
  }

  if (transaction?.status === TransactionStatus.EXPIRED) {
    return res.status(400).json({
      message: "Transaction expired",
    })
  }

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
    message: ""
  })
})

export default topUpRouter
