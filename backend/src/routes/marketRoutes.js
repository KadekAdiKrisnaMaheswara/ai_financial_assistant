import express from 'express'
import YahooFinance from 'yahoo-finance2'
import authMiddleware from '../middlewares/authMiddleware.js'

const router = express.Router()
const yahooFinance = new YahooFinance()

const formatIDR = (value, isIndex = false) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  if (isIndex) {
    return Number(value).toLocaleString('id-ID', {
      maximumFractionDigits: 2,
    })
  }

  return `Rp ${Number(value).toLocaleString('id-ID', {
    maximumFractionDigits: 0,
  })}`
}

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return `${Number(value).toFixed(2)}%`
}

export const fetchIDXQuote = async (symbol) => {
  try {
    const quote = await yahooFinance.quote(symbol)
    const isIndex = symbol.startsWith('^')

    return {
      symbol,
      name: quote.shortName || quote.longName || symbol,
      price: quote.regularMarketPrice || null,
      change: quote.regularMarketChange || null,
      changePercent: quote.regularMarketChangePercent || null,
      formattedPrice: formatIDR(quote.regularMarketPrice, isIndex),
      formattedChangePercent: formatPercent(quote.regularMarketChangePercent),
      currency: isIndex ? 'INDEX' : quote.currency || 'IDR',
      marketState: quote.marketState || null,
      status: 'ok',
    }
  } catch (error) {
    return {
      symbol,
      name: symbol,
      price: null,
      change: null,
      changePercent: null,
      formattedPrice: '-',
      formattedChangePercent: '-',
      currency: symbol.startsWith('^') ? 'INDEX' : 'IDR',
      marketState: null,
      status: 'error',
      message: error.message,
    }
  }
}

/*
const fetchGoldIDR = async () => {
  try {
    const [goldQuote, usdIdrQuote] = await Promise.all([
      yahooFinance.quote('GC=F'),
      yahooFinance.quote('USDIDR=X'),
    ])

    const goldUsdPerOunce = Number(goldQuote.regularMarketPrice || 0)
    const usdIdr = Number(usdIdrQuote.regularMarketPrice || 0)

    if (!goldUsdPerOunce || !usdIdr) {
      throw new Error('Data harga emas atau kurs USD/IDR tidak tersedia')
    }

    const troyOunceToGram = 31.1034768
    const goldIdrPerOunce = goldUsdPerOunce * usdIdr
    const goldIdrPerGram = goldIdrPerOunce / troyOunceToGram

    return {
      symbol: 'GC=F / USDIDR=X',
      name: 'Emas Global Estimasi IDR',
      price: goldIdrPerOunce,
      priceGram: goldIdrPerGram,
      change: goldQuote.regularMarketChange || null,
      changePercent: goldQuote.regularMarketChangePercent || null,
      formattedPrice: formatIDR(goldIdrPerOunce),
      formattedPriceGram: formatIDR(goldIdrPerGram),
      formattedChangePercent: formatPercent(
        goldQuote.regularMarketChangePercent
      ),
      currency: 'IDR',
      status: 'ok',
      note: 'Estimasi berdasarkan Gold Futures dan kurs USD/IDR dari Yahoo Finance',
    }
  } catch (error) {
    return {
      symbol: 'GC=F / USDIDR=X',
      name: 'Emas Global Estimasi IDR',
      price: null,
      priceGram: null,
      change: null,
      changePercent: null,
      formattedPrice: '-',
      formattedPriceGram: '-',
      formattedChangePercent: '-',
      currency: 'IDR',
      status: 'error',
      message: error.message,
    }
  }
}
*/

export const fetchGoldIDR = async () => {
  try {
    const goldApiUrl = 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/pegadaian/history'
    const response = await fetch(goldApiUrl)
    const result = await response.json()

    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('Data emas tidak tersedia')
    }

    const nonZeroData = result.data.filter(
      (item) => item.sellPrice > 0 && item.buybackPrice > 0
    )
    if (nonZeroData.length === 0) {
      throw new Error('Tidak ada data harga emas valid (non-zero) dari Pegadaian')
    }

    const latest = nonZeroData[0]
    const priceGram = latest.sellPrice / latest.weight
    const buybackPriceGram = latest.buybackPrice / latest.weight

    const prev = nonZeroData[1]
    let change = null
    let changePercent = null
    if (prev) {
      const prevPriceGram = prev.sellPrice / prev.weight
      change = priceGram - prevPriceGram
      changePercent = (change / prevPriceGram) * 100
    }

    return {
      symbol: 'PEGADAIAN.GOLD',
      name: 'Emas Pegadaian',
      price: priceGram,
      priceGram: priceGram,
      buybackPrice: buybackPriceGram,
      change,
      changePercent,
      formattedPrice: formatIDR(priceGram),
      formattedPriceGram: formatIDR(priceGram),
      formattedBuybackPrice: formatIDR(buybackPriceGram),
      formattedChangePercent: formatPercent(changePercent),
      currency: 'IDR',
      status: 'ok',
      note: `Harga emas Pegadaian per gram berdasarkan data tanggal ${latest.recordedDate}`,
    }
  } catch (error) {
    return {
      symbol: 'PEGADAIAN.GOLD',
      name: 'Emas Pegadaian',
      price: null,
      priceGram: null,
      change: null,
      changePercent: null,
      formattedPrice: '-',
      formattedPriceGram: '-',
      formattedChangePercent: '-',
      currency: 'IDR',
      status: 'error',
      message: error.message,
    }
  }
}

export const stockSymbols = [
  '^JKSE',
  'BBCA.JK',
  'BBRI.JK',
  'BMRI.JK',
  'TLKM.JK',
  'ASII.JK',
]

router.get('/snapshot', authMiddleware, async (req, res) => {
  try {
    const [gold, ...stocks] = await Promise.all([
      fetchGoldIDR(),
      ...stockSymbols.map((symbol) => fetchIDXQuote(symbol)),
    ])

    res.json({
      message: 'Market snapshot Indonesia berhasil diambil',
      data: {
        gold,
        stocks,
        updatedAt: new Date().toISOString(),
        source: {
          stocks: 'Yahoo Finance',
          gold: 'Yahoo Finance GC=F + USDIDR=X',
        },
      },
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: error.message || 'Gagal mengambil market snapshot Indonesia',
    })
  }
})

export default router