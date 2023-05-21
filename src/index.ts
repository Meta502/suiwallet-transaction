import dotenv from "dotenv"
import express from "express"

import inquiryRouter from "./routers/inquiry"
import topUpRouter from "./routers/topUp"
import transferRouter from "./routers/transfer"
import virtualAccountRouter from "./routers/virtualAccount"

dotenv.config()

const app = express()
const port = process.env.port || 3005


app.use(express.json())

app.get("/", (_, res) => {
  res.json("OK")
})

app.use("/inquiry", inquiryRouter)
app.use("/top-up", topUpRouter)
app.use("/transfer", transferRouter)
app.use("/virtual-account", virtualAccountRouter)

app.listen(port, () => {
  console.log("HTTP server listening on port " + port)
})

