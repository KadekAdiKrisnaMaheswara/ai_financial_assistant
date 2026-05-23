import express from 'express'
import prisma from '../prisma/client.js'
import { generateResponse } from '../controllers/aiController.js'

const router = express.Router()

// AI Chat endpoint
router.post('/chat', generateResponse)

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