import express from 'express'
import prisma from '../prisma/client.js'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: req.userId
      },
      include: {
        category: true,
        goal: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    res.json(transactions)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal mengambil transaction' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      category_id,
      goal_id,
      amount,
      type,
      description,
      transaction_date,
      notes
    } = req.body

    const transaction = await prisma.transaction.create({
      data: {
        user_id: req.userId,
        category_id,
        goal_id: goal_id || null,
        amount,
        type,
        description,
        transaction_date: new Date(transaction_date),
        notes
      },
      include: {
        category: true
      }
    })

    res.status(201).json(transaction)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal membuat transaction' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        user_id: req.userId
      }
    })

    if (!existingTransaction) {
      return res.status(404).json({
        message: 'Transaction tidak ditemukan'
      })
    }

    const {
      category_id,
      amount,
      type,
      description,
      transaction_date,
      notes
    } = req.body

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        category_id,
        amount,
        type,
        description,
        transaction_date: transaction_date
          ? new Date(transaction_date)
          : undefined,
        notes
      },
      include: {
        category: true
      }
    })

    res.json(transaction)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal update transaction' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        user_id: req.userId
      }
    })

    if (!existingTransaction) {
      return res.status(404).json({
        message: 'Transaction tidak ditemukan'
      })
    }

    await prisma.transaction.delete({
      where: { id }
    })

    res.json({ message: 'Transaction berhasil dihapus' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal hapus transaction' })
  }
})

export default router