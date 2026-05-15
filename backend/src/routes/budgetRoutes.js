import express from 'express'
import prisma from '../prisma/client.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      include: {
        category: true,
        user: true
      }
    })

    res.json(budgets)
  } catch (error) {
    res.status(500).json({
      message: 'Gagal mengambil budget',
      error: error.message
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      category_id,
      limit_amount,
      period,
      start_date,
      end_date
    } = req.body

    const budget = await prisma.budget.create({
      data: {
        user_id,
        category_id,
        limit_amount: Number(limit_amount),
        period,
        start_date: new Date(start_date),
        end_date: new Date(end_date)
      }
    })

    res.json(budget)
  } catch (error) {
    res.status(500).json({
      message: 'Gagal membuat budget',
      error: error.message
    })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const {
      category_id,
      limit_amount,
      spent_amount,
      period,
      start_date,
      end_date
    } = req.body

    const data = {}

    if (category_id !== undefined) data.category_id = category_id
    if (limit_amount !== undefined) data.limit_amount = Number(limit_amount)
    if (spent_amount !== undefined) data.spent_amount = Number(spent_amount)
    if (period !== undefined) data.period = period
    if (start_date !== undefined) data.start_date = new Date(start_date)
    if (end_date !== undefined) data.end_date = new Date(end_date)

    const budget = await prisma.budget.update({
      where: { id },
      data
    })

    res.json({
      message: 'Budget berhasil diupdate',
      budget
    })
  } catch (error) {
    res.status(500).json({
      message: 'Gagal update budget',
      error: error.message
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.budget.delete({
      where: { id }
    })

    res.json({
      message: 'Budget berhasil dihapus'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Gagal hapus budget',
      error: error.message
    })
  }
})

export default router