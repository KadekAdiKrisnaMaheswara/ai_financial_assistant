import express from 'express'
import prisma from '../prisma/client.js'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: {
        user_id: req.userId,
      },
      include: {
        category: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    res.json(budgets)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal mengambil budget' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      category_id,
      limit_amount,
      period,
      start_date,
      end_date,
    } = req.body

    const budget = await prisma.budget.create({
      data: {
        user_id: req.userId,
        category_id,
        limit_amount,
        period,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
      },
      include: {
        category: true,
      },
    })

    res.status(201).json(budget)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal membuat budget' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        user_id: req.userId,
      },
    })

    if (!existingBudget) {
      return res.status(404).json({ message: 'Budget tidak ditemukan' })
    }

    const {
      category_id,
      limit_amount,
      period,
      start_date,
      end_date,
    } = req.body

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        category_id,
        limit_amount,
        period,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
      },
      include: {
        category: true,
      },
    })

    res.json(budget)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal update budget' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        user_id: req.userId,
      },
    })

    if (!existingBudget) {
      return res.status(404).json({ message: 'Budget tidak ditemukan' })
    }

    await prisma.budget.delete({
      where: { id },
    })

    res.json({ message: 'Budget berhasil dihapus' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal hapus budget' })
  }
})

export default router