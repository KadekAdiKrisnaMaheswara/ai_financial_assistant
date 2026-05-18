import express from 'express'
import prisma from '../prisma/client.js'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const goals = await prisma.financialGoal.findMany({
      where: {
        user_id: req.userId,
      },
      include: {
        transactions: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    res.json(goals)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal mengambil goals' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      target_amount,
      current_amount,
      deadline,
    } = req.body

    const goal = await prisma.financialGoal.create({
      data: {
        user_id: req.userId,
        name,
        target_amount,
        current_amount: current_amount || 0,
        deadline: deadline ? new Date(deadline) : null,
        status: 'active',
      },
    })

    res.status(201).json(goal)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal membuat goal' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const existingGoal = await prisma.financialGoal.findFirst({
      where: {
        id,
        user_id: req.userId,
      },
    })

    if (!existingGoal) {
      return res.status(404).json({ message: 'Goal tidak ditemukan' })
    }

    const {
      name,
      target_amount,
      current_amount,
      deadline,
      status,
    } = req.body

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: {
        name,
        target_amount,
        current_amount,
        deadline: deadline ? new Date(deadline) : null,
        status,
      },
    })

    res.json(goal)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal update goal' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const existingGoal = await prisma.financialGoal.findFirst({
      where: {
        id,
        user_id: req.userId,
      },
    })

    if (!existingGoal) {
      return res.status(404).json({ message: 'Goal tidak ditemukan' })
    }

    await prisma.financialGoal.delete({
      where: { id },
    })

    res.json({ message: 'Goal berhasil dihapus' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Gagal hapus goal' })
  }
})

export default router