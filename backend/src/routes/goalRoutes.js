import express from 'express'
import prisma from '../prisma/client.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const goals = await prisma.financialGoal.findMany()

  res.json(goals)
})

router.post('/', async (req, res) => {
  const {
    user_id,
    name,
    target_amount,
    current_amount,
    deadline
  } = req.body

  const goal = await prisma.financialGoal.create({
    data: {
      user_id,
      name,
      target_amount,
      current_amount,
      deadline: new Date(deadline)
    }
  })

  res.json(goal)
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const {
      name,
      target_amount,
      current_amount,
      deadline,
      status
    } = req.body

    const data = {}

    if (name !== undefined) data.name = name
    if (target_amount !== undefined) data.target_amount = Number(target_amount)
    if (current_amount !== undefined) data.current_amount = Number(current_amount)
    if (deadline !== undefined) data.deadline = new Date(deadline)
    if (status !== undefined) data.status = status

    const goal = await prisma.financialGoal.update({
      where: { id },
      data
    })

    res.json({
      message: 'Goal berhasil diupdate',
      goal
    })
  } catch (error) {
    res.status(500).json({
      message: 'Gagal update goal',
      error: error.message
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.financialGoal.delete({
      where: { id }
    })

    res.json({
      message: 'Goal berhasil dihapus'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Gagal hapus goal',
      error: error.message
    })
  }
})

export default router