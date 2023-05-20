import { RedisClientType, createClient } from "redis"

let client: RedisClientType;

export const getRedisClientInstance = async () => {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_HOST
    })

    client.on("error", err => console.error("Redis Client Error", err))
    client.on("connect", () => {
      console.log("Redis Client connected successfully")
    })
    client.on("ready", () => {
      client.configSet("notify-keyspace-events", "Ex")
    })
    await client.connect()
  }

  return client
}
