import express from 'express'
import prisma from '../prisma/client.js'
import { generateResponse } from '../controllers/aiController.js'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()

// AI Chat endpoint
router.post('/chat', authMiddleware, generateResponse)

// GET ACTIVE CHAT SESSION FOR AUTHENTICATED USER
router.get('/chat-session/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId

    // Cari sesi chat terbaru milik user
    let session = await prisma.chatSession.findFirst({
      where: {
        user_id: userId
      },
      include: {
        messages: {
          orderBy: {
            created_at: 'asc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Jika belum ada, buat sesi baru secara otomatis
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          user_id: userId,
          title: 'Sesi Asisten Keuangan',
          messages: {
            create: [
              {
                role: 'assistant',
                content: 'Halo! Saya AIVEST, asisten keuangan Anda. Tanyakan tentang anggaran, tabungan, tujuan, atau pengeluaran Anda.'
              },
              {
                role: 'assistant',
                content: 'Saya siap membantu dengan saran cerdas dan ringkas seperti layaknya ruang chat.'
              }
            ]
          }
        },
        include: {
          messages: {
            orderBy: {
              created_at: 'asc'
            }
          }
        }
      })
    }

    res.json(session)
  } catch (error) {
    console.error('Error fetching/creating active session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// CLEAR ACTIVE CHAT SESSION FOR USER
router.delete('/chat-session/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId

    // Hapus seluruh sesi chat milik user (akan men-cascade pesan karena onDelete: Cascade di schema.prisma)
    await prisma.chatSession.deleteMany({
      where: {
        user_id: userId
      }
    })

    res.json({ message: 'Sesi chat berhasil dihapus.' })
  } catch (error) {
    console.error('Error clearing active session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET CHAT SESSIONS
router.get('/chat-sessions', async (req, res) => {
  const sessions = await prisma.chatSession.findMany()

  res.json(sessions)
})

// CREATE CHAT SESSION
router.post('/chat-sessions', async (req, res) => {
  const { user_id, title } = req.body

  const session = await prisma.chatSession.create({
    data: {
      user_id,
      title
    }
  })

  res.json(session)
})

// GET MESSAGES
router.get('/chat-sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params

  const messages = await prisma.chatMessage.findMany({
    where: {
      session_id: sessionId
    },
    orderBy: {
      created_at: 'asc'
    }
  })

  res.json(messages)
})

// CREATE MESSAGE
router.post('/chat-sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params
  const { role, content } = req.body

  const message = await prisma.chatMessage.create({
    data: {
      session_id: sessionId,
      role,
      content
    }
  })

  res.json(message)
})

export default router