import { Router, Request, Response } from "express"
import prisma from "../engines/prisma"

const inquiryRouter = Router()

inquiryRouter.get("/:accountId", async (req: Request, res: Response) => {
  const { accountId } = req.params

  const transaction = await prisma.transaction.findMany({
    where: {
      accountId
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return res.status(200).json(transaction)
})

export default inquiryRouter
