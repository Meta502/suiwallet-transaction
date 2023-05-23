import { Channel, ConsumeMessage } from "amqplib"
import dotenv from "dotenv"
import { getRabbitMQInstance } from "../engines/rabbitmq"
import { TransactionType, TransactionStatus } from "@prisma/client"
import prisma from "../engines/prisma"
import transferHandler from "./handlers/transferHandler"
import topUpHandler from "./handlers/topUpHandler"
import virtualAccountHandler from "./handlers/virtualAccountHandler"
import virtualAccountWithdrawalHandler from "./handlers/virtualAccountWithdrawalHandler"

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
    return topUpHandler(transaction)
  }

  if (type === TransactionType.TRANSFER) {
    return transferHandler(transaction)
  }

  if (type === TransactionType.VIRTUAL_ACCOUNT) {
    return virtualAccountHandler(transaction)
  }

  if (type === TransactionType.VIRTUAL_ACCOUNT_WITHDRAWAL) {
    return virtualAccountWithdrawalHandler(transaction)
  }
}



const consumer = (channel: Channel) => (msg: ConsumeMessage | null) => {
  if (msg) {
    const payload = JSON.parse(
      msg.content.toString()
    ) as { id: string, type: TransactionType }

    setTimeout(() => {
      handler(
        payload.id,
        payload.type,
      )
        .then(() => {
          channel.ack(msg)
        })
        .catch((e) => {
          console.error(e)
          channel.ack(msg)
        })
    }, 5000)
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

