import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.use('/api/transactions', transactionRoutes)

app.use('/api/dashboard', dashboardRoutes)

app.get('/', (req, res) => {
  res.send('Backend running...')
})

export default app