import dotenv from "dotenv"
import express from "express"
import inquiryRouter from "./routers/inquiry"
import topUpRouter from "./routers/topUp"

dotenv.config()

const app = express()
const port = process.env.port || 3005


app.use(express.json())

app.get("/", (req, res) => {
  res.json("OK")
})

app.use("/inquiry", inquiryRouter)
app.use("/top-up", topUpRouter)

app.listen(port, () => {
  console.log("HTTP server listening on port " + port)
})

