import express from 'express'
import multer from 'multer'
import fs from 'fs'
import { createWorker } from 'tesseract.js'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()

const upload = multer({
  dest: 'uploads/receipts/',
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('File harus berupa JPG, JPEG, atau PNG'))
    }

    cb(null, true)
  },
})

const cleanOcrText = (text) => {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[|{}[\]<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const getCleanLines = (text) => {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/[|{}[\]<>]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 1)
}

const parseAmount = (value) => {
  if (!value) return null

  const cleaned = String(value).replace(/[^\d]/g, '')

  if (!cleaned) return null

  return Number(cleaned)
}

const parseMerchantName = (lines) => {
  const joinedText = lines.join(' ').toLowerCase()

  const knownMerchants = [
    {
      keywords: ['kopi', 'kenangan'],
      name: 'Kopi Kenangan',
    },
    {
      keywords: ['indomaret'],
      name: 'Indomaret',
    },
    {
      keywords: ['alfamart'],
      name: 'Alfamart',
    },
    {
      keywords: ['alfamidi'],
      name: 'Alfamidi',
    },
    {
      keywords: ['starbucks'],
      name: 'Starbucks',
    },
    {
      keywords: ['kfc'],
      name: 'KFC',
    },
    {
      keywords: ['mcd'],
      name: 'McDonald’s',
    },
  ]

  const matchedMerchant = knownMerchants.find((merchant) =>
    merchant.keywords.every((keyword) => joinedText.includes(keyword))
  )

  if (matchedMerchant) {
    return matchedMerchant.name
  }

  const ignoredWords = [
    'total',
    'subtotal',
    'cash',
    'tunai',
    'debit',
    'credit',
    'kredit',
    'order',
    'date',
    'tanggal',
    'time',
    'waktu',
    'wifi',
    'username',
    'password',
    'tax',
    'pajak',
    'ppn',
    'whatsapp',
    'voucher',
    'receipt',
    'struk',
    'invoice',
    'qty',
    'item',
    'price',
    'harga',
    'change',
    'kembalian',
    'payment',
    'bayar',
  ]

  const merchantLine = lines.find((line) => {
    const lowerLine = line.toLowerCase()
    const hasLetter = /[a-zA-Z]/.test(line)
    const hasTooManyNumbers = (line.match(/\d/g) || []).length > 4

    return (
      line.length >= 3 &&
      line.length <= 40 &&
      hasLetter &&
      !hasTooManyNumbers &&
      !ignoredWords.some((word) => lowerLine.includes(word))
    )
  })

  return merchantLine || 'Belanja dari struk'
}

const normalizeDate = (day, month, year) => {
  const normalizedDay = String(day).padStart(2, '0')
  const normalizedMonth = String(month).padStart(2, '0')
  let normalizedYear = String(year)

  if (normalizedYear.length === 2) {
    normalizedYear = `20${normalizedYear}`
  }

  const date = new Date(`${normalizedYear}-${normalizedMonth}-${normalizedDay}`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  if (
    date.getFullYear() !== Number(normalizedYear) ||
    date.getMonth() + 1 !== Number(normalizedMonth) ||
    date.getDate() !== Number(normalizedDay)
  ) {
    return null
  }

  return `${normalizedYear}-${normalizedMonth}-${normalizedDay}`
}

const parseIndonesianMonth = (monthText) => {
  const normalized = String(monthText || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  const months = {
    jan: '01',
    januari: '01',
    january: '01',

    feb: '02',
    februari: '02',
    february: '02',

    mar: '03',
    maret: '03',
    march: '03',

    apr: '04',
    april: '04',

    mei: '05',
    may: '05',
    liay: '05',
    llay: '05',
    inay: '05',
    rnay: '05',

    jun: '06',
    juni: '06',
    june: '06',

    jul: '07',
    juli: '07',
    july: '07',

    agu: '08',
    ags: '08',
    agust: '08',
    agustus: '08',
    aug: '08',
    august: '08',

    sep: '09',
    sept: '09',
    september: '09',

    okt: '10',
    oktober: '10',
    oct: '10',
    october: '10',

    nov: '11',
    november: '11',

    des: '12',
    desember: '12',
    dec: '12',
    december: '12',
  }

  return months[normalized] || null
}

const extractDateFromText = (text) => {
  const currentYear = new Date().getFullYear()

  const normalizedText = String(text || '')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  console.log('DATE PARSER INPUT:', normalizedText)

  const monthWords =
    'jan|januari|january|feb|februari|february|mar|maret|march|apr|april|mei|may|liay|llay|inay|rnay|jun|juni|june|jul|juli|july|agu|ags|agust|agustus|aug|august|sep|sept|september|okt|oktober|oct|october|nov|november|des|desember|dec|december'

  const numericPatterns = [
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g,
    /\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g,
  ]

  for (const pattern of numericPatterns) {
    const matches = [...normalizedText.matchAll(pattern)]

    for (const match of matches) {
      let parsedDate = null

      if (match[1].length === 4) {
        parsedDate = normalizeDate(match[3], match[2], match[1])
      } else {
        parsedDate = normalizeDate(match[1], match[2], match[3])
      }

      if (parsedDate) {
        console.log('DATE FOUND NUMERIC:', parsedDate)
        return parsedDate
      }
    }
  }

  // Format: 23 Mei 2026 / 23 May 2026
  const dayMonthYearPattern = new RegExp(
    `\\b(\\d{1,2})\\s*[\\/\\-. ]*(${monthWords})\\s*[\\/\\-. ]*(\\d{2,4})\\b`,
    'gi'
  )

  for (const match of normalizedText.matchAll(dayMonthYearPattern)) {
    const day = match[1]
    const month = parseIndonesianMonth(match[2])
    const year = match[3]

    if (!month) continue

    const parsedDate = normalizeDate(day, month, year)

    if (parsedDate) {
      console.log('DATE FOUND DAY MONTH YEAR:', parsedDate)
      return parsedDate
    }
  }

  // Format: May 23 2026 / liay 23 2026
  const monthDayYearPattern = new RegExp(
    `\\b(${monthWords})\\s*[\\/\\-. ]*(\\d{1,2})\\s*[\\/\\-. ,]*(\\d{2,4})\\b`,
    'gi'
  )

  for (const match of normalizedText.matchAll(monthDayYearPattern)) {
    const month = parseIndonesianMonth(match[1])
    const day = match[2]
    const year = match[3]

    if (!month) continue

    const parsedDate = normalizeDate(day, month, year)

    if (parsedDate) {
      console.log('DATE FOUND MONTH DAY YEAR:', parsedDate)
      return parsedDate
    }
  }

  // Format: 23 Mei / 23 May
  const dayMonthWithoutYearPattern = new RegExp(
    `\\b(\\d{1,2})\\s*[\\/\\-. ]*(${monthWords})\\b`,
    'gi'
  )

  for (const match of normalizedText.matchAll(dayMonthWithoutYearPattern)) {
    const day = match[1]
    const month = parseIndonesianMonth(match[2])

    if (!month) continue

    const parsedDate = normalizeDate(day, month, currentYear)

    if (parsedDate) {
      console.log('DATE FOUND DAY MONTH WITHOUT YEAR:', parsedDate)
      return parsedDate
    }
  }

  // Format: May 23 / liay 23
  const monthDayWithoutYearPattern = new RegExp(
    `\\b(${monthWords})\\s*[\\/\\-. ]*(\\d{1,2})\\b`,
    'gi'
  )

  for (const match of normalizedText.matchAll(monthDayWithoutYearPattern)) {
    const month = parseIndonesianMonth(match[1])
    const day = match[2]

    if (!month) continue

    const parsedDate = normalizeDate(day, month, currentYear)

    if (parsedDate) {
      console.log('DATE FOUND MONTH DAY WITHOUT YEAR:', parsedDate)
      return parsedDate
    }
  }

  console.log('DATE NOT FOUND')
  return null
}

const extractAmountFromText = (text) => {
  const lines = getCleanLines(text)

  const amountKeywords = [
    'grand total',
    'total bayar',
    'total payment',
    'total',
    'jumlah',
    'amount',
    'bayar',
    'payment',
    'debit',
    'tunai',
  ]

  const ignoredAmountKeywords = [
    'subtotal',
    'tax',
    'pajak',
    'ppn',
    'diskon',
    'discount',
    'change',
    'kembalian',
    'qty',
    'item',
  ]

  for (const keyword of amountKeywords) {
    const matchingLine = lines.find((line) => {
      const lowerLine = line.toLowerCase()

      return (
        lowerLine.includes(keyword) &&
        !ignoredAmountKeywords.some((ignored) => lowerLine.includes(ignored))
      )
    })

    if (matchingLine) {
      const numberMatches = matchingLine.match(/(?:rp\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,})/gi)

      if (numberMatches && numberMatches.length > 0) {
        const parsedNumbers = numberMatches
          .map((numberText) => parseAmount(numberText))
          .filter((number) => number && number > 0)

        if (parsedNumbers.length > 0) {
          return Math.max(...parsedNumbers)
        }
      }
    }
  }

  const allNumbers = lines
    .flatMap((line) => line.match(/(?:rp\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,})/gi) || [])
    .map((numberText) => parseAmount(numberText))
    .filter((number) => number && number >= 1000)

  if (allNumbers.length === 0) {
    return null
  }

  return Math.max(...allNumbers)
}

const buildSafeNotes = () => {
  return 'Scanned from receipt'
}

const parseReceiptText = (text) => {
  const lines = getCleanLines(text)

  const merchantName = parseMerchantName(lines)
  const amount = extractAmountFromText(text)
  const transactionDate = extractDateFromText(text)

  return {
    amount,
    type: 'expense',
    description: merchantName,
    transaction_date: transactionDate,
    notes: buildSafeNotes(),
  }
}

router.post('/scan', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'File struk wajib diupload',
      })
    }

    const worker = await createWorker('eng')

    await worker.setParameters({
      tessedit_char_whitelist:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/- RpTOTALTotaltotalJUMLAHJumlahjumlahBAYARBayarbayarDATEdatetanggalTanggal',
      preserve_interword_spaces: '1',
    })

    const result = await worker.recognize(req.file.path)

    await worker.terminate()

    const rawText = result.data.text
    const parsed = parseReceiptText(rawText)
    console.log('===== RAW OCR TEXT =====')

    fs.unlinkSync(req.file.path)

    if (!parsed.amount || Number.isNaN(parsed.amount)) {
      return res.status(400).json({
        message: 'Total transaksi tidak terbaca. Silakan input manual.',
        rawText,
      })
    }

    res.json({
      message: 'Struk berhasil discan',
      data: {
        rawText,
        parsed,
      },
    })
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      message: error.message,
    })
  }
})

export default router