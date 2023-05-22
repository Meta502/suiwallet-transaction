import fetch from "node-fetch"

export default function sendNotification(
  userId: string,
  data: {
    title: string,
    description: string,
    status: string,
  }
) {
  fetch(`${process.env.WEBSOCKET_SERVICE_URL}/send-data`, {
    method: "POST",
    body: JSON.stringify({
      userId,
      data
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
}
