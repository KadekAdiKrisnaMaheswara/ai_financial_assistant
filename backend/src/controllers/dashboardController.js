import prisma from '../config/prisma.js'

export const getDashboardData = async (req, res) => {
  try {

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId
      }
    })

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = totalIncome - totalExpense

    res.json({
      totalIncome,
      totalExpense,
      balance,
      totalTransactions: transactions.length,
      transactions
    })

  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}