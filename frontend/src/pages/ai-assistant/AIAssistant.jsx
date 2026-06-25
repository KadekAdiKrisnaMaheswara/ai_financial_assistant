import { useEffect, useRef, useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { renderFormattedMessage } from '../../utils/formatChatMessage'
import './AIAssistant.css'

function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Halo! Saya AIVEST, asisten keuangan Anda. Tanyakan tentang anggaran, tabungan, tujuan, atau pengeluaran Anda.',
    },
    {
      id: 2,
      role: 'assistant',
      text: 'Saya siap membantu dengan saran cerdas dan ringkas seperti layaknya ruang chat.',
    },
  ])

  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedMessageId, setExpandedMessageId] = useState(null)

  const [marketData, setMarketData] = useState(null)
  const [marketLoading, setMarketLoading] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMarketSnapshot = async () => {
    try {
      setMarketLoading(true)

      const token = localStorage.getItem('token')

      const response = await fetch('http://localhost:5000/api/market/snapshot', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Gagal mengambil data market')
      }

      const result = await response.json()
      setMarketData(result.data)
    } catch (error) {
      console.error('Market Error:', error)
    } finally {
      setMarketLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketSnapshot()
  }, [])

  const handleSend = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || loading) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null

      if (!user || !user.id) {
        throw new Error('User ID tidak ditemukan. Silakan login kembali.')
      }

      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          user_id: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Gagal mendapatkan respons dari AI')
      }

      const data = await response.json()

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text:
          data.response ||
          'Maaf, saya tidak dapat memproses pertanyaan Anda.',
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: `Maaf, terjadi kesalahan: ${
            error.message || 'Silakan coba lagi nanti.'
          }`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !loading) {
      event.preventDefault()
      handleSend()
    }
  }

  const quickPrompts = [
    'Bantu susun anggaran bulanan saya',
    'Rekomendasi tujuan tabungan terbaik',
    'Analisa pengeluaran saya bulan ini',
    'Tips invest jangka pendek',
  ]

  const marketPrompts = [
    'Apa arti pergerakan IHSG hari ini?',
    'Bagaimana kondisi saham bank besar Indonesia?',
    'Apakah harga emas sedang menarik untuk dipantau?',
  ]

  const renderMessage = (message) => {
    const isAssistant = message.role === 'assistant'

    if (!isAssistant) {
      return message.text
    }

    const paragraphs = renderFormattedMessage(message.text)
    const isLongMessage = paragraphs.length > 5
    const displayParagraphs =
      expandedMessageId === message.id ? paragraphs : paragraphs.slice(0, 4)

    return (
      <div className="formatted-message">
        {displayParagraphs.map((para, idx) => (
          <p key={idx} className="message-paragraph">
            {para}
          </p>
        ))}

        {isLongMessage && expandedMessageId !== message.id && (
          <button
            className="expand-button"
            onClick={() => setExpandedMessageId(message.id)}
          >
            Baca selengkapnya...
          </button>
        )}

        {isLongMessage && expandedMessageId === message.id && (
          <button
            className="expand-button"
            onClick={() => setExpandedMessageId(null)}
          >
            Sembunyikan
          </button>
        )}
      </div>
    )
  }

  const getMarketClass = (value) => {
    if (value === null || value === undefined) return 'market-neutral'

    return Number(value) < 0 ? 'market-down' : 'market-up'
  }

  return (
    <MainLayout>
      <div className="ai-assistant-page">
        <div className="ai-assistant-header">
          <div>
            <h1>AI Assistant</h1>
            <p>
              Ruang chat khusus untuk berinteraksi dengan AI AIVEST. Tulis
              pertanyaanmu dan dapatkan jawaban seputar keuangan, anggaran,
              perencanaan tujuan, serta insight market Indonesia.
            </p>
          </div>
        </div>

        <div className="ai-chat-layout">
          <section className="chat-card">
            <header>
              <div className="chat-agent-avatar">AI</div>

              <div className="chat-agent-title">
                <h2>AIVEST Chat</h2>
                <p>
                  Asisten keuangan real-time dengan insight personal finance dan
                  market Indonesia.
                </p>
              </div>
            </header>

            <div className="chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-bubble ${
                    message.role === 'user' ? 'user' : 'assistant'
                  }`}
                >
                  <div className="bubble-meta">
                    <span>{message.role === 'user' ? 'Anda' : 'AIVEST'}</span>
                    <span>
                      {message.role === 'user' ? 'User' : 'AI Assistant'}
                    </span>
                  </div>

                  <div className="bubble-content">{renderMessage(message)}</div>
                </div>
              ))}

              {loading && (
                <div className="chat-bubble assistant">
                  <div className="bubble-meta">
                    <span>AIVEST</span>
                    <span>AI Assistant</span>
                  </div>

                  <div className="loading-dots">Sedang memproses...</div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Tulis pesan..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />

              <button type="button" onClick={handleSend} disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </section>

          <aside className="ai-side-panel">
            <div className="ai-market-card">
              <div className="ai-market-header">
                <div>
                  <h3>Market Snapshot</h3>
                  <p>IHSG, saham Indonesia, dan estimasi emas hari ini.</p>
                </div>

                <button
                  type="button"
                  onClick={fetchMarketSnapshot}
                  disabled={marketLoading}
                >
                  {marketLoading ? '...' : 'Refresh'}
                </button>
              </div>

              {!marketData ? (
                <div className="market-empty">
                  {marketLoading
                    ? 'Mengambil data market...'
                    : 'Data market belum tersedia'}
                </div>
              ) : (
                <>
                  <div className="market-gold-box">
                    <span>{marketData.gold?.name || 'Emas'}</span>

                    <strong>{marketData.gold?.formattedPriceGram || '-'}</strong>

                    <p
                      className={getMarketClass(
                        marketData.gold?.changePercent
                      )}
                    >
                      {marketData.gold?.formattedChangePercent || '-'} hari ini
                    </p>

                    <small>
                      {marketData.gold?.note ||
                        'Estimasi harga emas berbasis data market.'}
                    </small>
                  </div>

                  <div className="market-stock-list">
                    {marketData.stocks?.map((stock) => (
                      <div className="market-stock-item" key={stock.symbol}>
                        <div>
                          <strong>{stock.symbol}</strong>
                          <span>{stock.name}</span>
                        </div>

                        <div className="market-stock-price">
                          <p>{stock.formattedPrice}</p>
                          <small className={getMarketClass(stock.changePercent)}>
                            {stock.formattedChangePercent}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="market-source-note">
                    Source: {marketData.source?.stocks} • Updated{' '}
                    {marketData.updatedAt
                      ? new Date(marketData.updatedAt).toLocaleString('id-ID')
                      : '-'}
                  </p>
                </>
              )}
            </div>

            <div className="ai-quick-card">
              <h3>Contoh pertanyaan</h3>

              <div className="quick-list">
                {quickPrompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => setInputValue(prompt)}
                    disabled={loading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <p className="ai-note">
                Ketuk prompt untuk mengisi pesan, lalu tekan kirim.
              </p>
            </div>

            <div className="ai-quick-card">
              <h3>Market prompt</h3>

              <div className="quick-list">
                {marketPrompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => setInputValue(prompt)}
                    disabled={loading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <p className="ai-note">
                Data market bersifat informatif dan bukan nasihat investasi
                resmi.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}

export default AIAssistant