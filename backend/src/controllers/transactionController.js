import prisma from '../config/prisma.js'

export const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, notes, transactionDate } = req.body

    const transaction = await prisma.transaction.create({
      data: {
        title,
        amount: parseFloat(amount),
        type,
        notes,
        transactionDate: new Date(transactionDate),
        userId: req.userId
      }
    })

    res.status(201).json(transaction)

  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}

export const getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(transactions)

  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.transaction.delete({
      where: { id }
    })

    res.json({
      message: 'Transaction deleted'
    })

  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}