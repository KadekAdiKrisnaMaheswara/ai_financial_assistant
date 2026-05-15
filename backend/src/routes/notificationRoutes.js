import express from 'express'
import prisma from '../prisma/client.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        created_at: 'desc'
      }
    })

    res.json(notifications)
  } catch (error) {
    res.status(500).json({
      message: 'Gagal mengambil notifications',
      error: error.message
    })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        is_read: true
      }
    })

    res.json({
      message: 'Notification sudah dibaca',
      notification
    })
  } catch (error) {
    res.status(500).json({
      message: 'Gagal update notification',
      error: error.message
    })
  }
})

export default router