import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import prisma from '../prisma/client.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        password_hash: hashedPassword,
      },
    })

    res.json({
      message: 'Register berhasil',
      user,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Register gagal',
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: 'User tidak ditemukan',
      })
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!validPassword) {
      return res.status(401).json({
        message: 'Password salah',
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    )

    res.json({
      message: 'Login berhasil',
      token,
      user,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Login gagal',
    })
  }
})

export default router