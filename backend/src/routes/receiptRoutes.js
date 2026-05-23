import express from 'express'
import multer from 'multer'
import fs from 'fs'
import { createWorker } from 'tesseract.js'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()

const upload = multer({
  dest: 'uploads/receipts/',
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('File harus berupa JPG, JPEG, atau PNG'))
    }

    cb(null, true)
  }
})

const parseAmount = (value) => {
  if (!value) return null

  let cleaned = value.replace(/[^\d.,]/g, '')

  if (cleaned.includes(',') && cleaned.split(',')[1]?.length === 3) {
    cleaned = cleaned.replace(/,/g, '')
  } else if (cleaned.includes('.') && cleaned.split('.')[1]?.length === 3) {
    cleaned = cleaned.replace(/\./g, '')
  } else {
    cleaned = cleaned.replace(',', '.')
  }

  return Number(cleaned)
}

const parseMerchantName = (lines) => {
  const joinedText = lines.join(' ').toLowerCase()

  if (joinedText.includes('kopi') && joinedText.includes('kenangan')) {
    return 'Kopi Kenangan'
  }

  const ignoredWords = [
    'total',
    'cash',
    'order',
    'date',
    'wifi',
    'username',
    'password',
    'tax',
    'whatsapp',
    'voucher'
  ]

  const merchantLine = lines.find((line) => {
    const lowerLine = line.toLowerCase()

    return (
      line.length > 3 &&
      !ignoredWords.some((word) => lowerLine.includes(word)) &&
      /[a-zA-Z]/.test(line)
    )
  })

  return merchantLine || 'Belanja dari struk'
}

const parseReceiptText = (text) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const merchantName = parseMerchantName(lines)

  const totalRegex =
    /(?:grand total|total|jumlah|subtotal|amount)\s*[:\-]?\s*(?:rp)?\s*([\d.,]+)/i

  const totalMatch = text.match(totalRegex)

  let amount = null

  if (totalMatch) {
    amount = parseAmount(totalMatch[1])
  }

  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/
  const dateMatch = text.match(dateRegex)

  let transactionDate = new Date()

  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0')
    const month = dateMatch[2].padStart(2, '0')
    let year = dateMatch[3]

    if (year.length === 2) {
      year = `20${year}`
    }

    transactionDate = new Date(`${year}-${month}-${day}`)
  }

  return {
    amount,
    type: 'expense',
    description: merchantName,
    transaction_date: transactionDate,
    notes: text
  }
}

router.post('/scan', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'File struk wajib diupload'
      })
    }

    const worker = await createWorker('eng')

    const result = await worker.recognize(req.file.path)

    await worker.terminate()

    const rawText = result.data.text
    const parsed = parseReceiptText(rawText)

    fs.unlinkSync(req.file.path)

    if (!parsed.amount || Number.isNaN(parsed.amount)) {
      return res.status(400).json({
        message: 'Total transaksi tidak terbaca. Silakan input manual.',
        rawText
      })
    }

    res.json({
      message: 'Struk berhasil discan',
      data: {
        rawText,
        parsed
      }
    })
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      message: error.message
    })
  }
})

export default router