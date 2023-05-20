import { Channel, ConsumeMessage } from "amqplib"
import dotenv from "dotenv"
import { getRabbitMQInstance } from "../engines/rabbitmq"
import { TransactionType, TransactionStatus } from "@prisma/client"
import prisma from "../engines/prisma"

dotenv.config()

const handler = async (transactionId: string, type: string) => {
  const transaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId
    },
    include: {
      account: true
    }
  })

  if (!transaction) throw Error("Transaction not found.")
  if (typeof transaction.metadata !== "object" || Array.isArray(transaction.metadata)) throw Error("Malformed transaction metadata")

  await prisma.transaction.update({
    where: {
      id: transaction.id
    },
    data: {
      status: TransactionStatus.PROCESSING
    },
  })

  if (type === TransactionType.TOPUP) {
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

    return Promise.all([accountUpdate, transactionUpdate])
  }
}

const consumer = (channel: Channel) => (msg: ConsumeMessage | null) => {
  if (msg) {
    const payload = JSON.parse(
      msg.content.toString()
    ) as { id: string, type: TransactionType }

    handler(
      payload.id,
      payload.type,
    )
      .then(() => {
        channel.ack(msg)
      })
      .catch((e) => {
        console.error(e)
        channel.nack(msg)
      })
  }
}

const main = async () => {
  const channel = await getRabbitMQInstance().then((client) => (
    client.createChannel()
  ))

  await channel.assertQueue("transactionQueue")
  await channel.consume("transactionQueue", consumer(channel))
}

main()

