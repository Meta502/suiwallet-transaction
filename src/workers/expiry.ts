import { TransactionStatus } from "@prisma/client";
import prisma from "../engines/prisma";
import { getRedisClientInstance } from "../engines/redis";
import dotenv from "dotenv"

dotenv.config()

const main = async () => {
  const redisClient = await getRedisClientInstance()
  redisClient.subscribe("__keyevent@0__:expired", async (message) => {
    const id = message.split(":")[1]
    await prisma.transaction.update({
      where: {
        id,
      },
      data: {
        status: TransactionStatus.EXPIRED
      }
    })
  })
}

main()

