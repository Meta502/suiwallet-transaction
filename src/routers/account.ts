import { Router, Request, Response } from "express"
import prisma from "../engines/prisma"

const accountRouter = Router()

accountRouter.get("/:accountId", async (req: Request, res: Response) => {
  const { accountId } = req.params

  const account = await prisma.account.findUnique({
    where: {
      id: accountId
    }
  })

  return res.status(200).json(account)
})

accountRouter.post("/:accountId", async (req: Request, res: Response) => {
  const { accountId } = req.params

  const account = await prisma.account.create({
    data: {
      id: accountId,
      balance: 0,
    }
  })

  return res.status(201).json(account)
})

export default accountRouter
