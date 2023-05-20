import client, { Connection } from "amqplib"

let connection: Connection

export const getRabbitMQInstance = async () => {
  if (!connection) {
    connection = await client.connect(
      String(process.env.RABBITMQ_HOST)
    )
  }

  return connection
}

