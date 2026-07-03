import { useEffect, useRef, useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { renderFormattedMessage, splitMessageByBubbleBreak } from '../../utils/formatChatMessage'
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

  const [activeSessionId, setActiveSessionId] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [expandedMessageId, setExpandedMessageId] = useState(null)

  const [marketData, setMarketData] = useState(null)
  const [marketLoading, setMarketLoading] = useState(false)

  const chatEndRef = useRef(null)
  const chatBufferRef = useRef([])
  const chatTimerRef = useRef(null)


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isBuffering, loading])

  useEffect(() => {
    return () => {
      if (chatTimerRef.current) {
        clearTimeout(chatTimerRef.current)
      }
    }
  }, [])

  const fetchActiveSession = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:5000/api/ai/chat-session/active', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setActiveSessionId(data.id)

        if (data.messages && data.messages.length > 0) {
          const formattedMessages = []
          for (const m of data.messages) {
            if (m.role === 'assistant') {
              const parts = splitMessageByBubbleBreak(m.content)
              parts.forEach((part, index) => {
                formattedMessages.push({
                  id: `${m.id}-${index}`,
                  role: 'assistant',
                  text: part
                })
              })
            } else {
              const parts = m.content.split('\n')
              parts.forEach((part, index) => {
                formattedMessages.push({
                  id: `${m.id}-${index}`,
                  role: m.role,
                  text: part
                })
              })
            }
          }
          setMessages(formattedMessages)
        }
      }
    } catch (error) {
      console.error('Gagal mengambil sesi chat aktif:', error)
    }
  }

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
    fetchActiveSession()
    fetchMarketSnapshot()
  }, [])

  const sendMergedMessages = async () => {
    if (chatTimerRef.current) {
      clearTimeout(chatTimerRef.current)
      chatTimerRef.current = null
    }

    const messagesToCombine = [...chatBufferRef.current]
    chatBufferRef.current = []
    setIsBuffering(false)

    if (messagesToCombine.length === 0) return

    const combinedText = messagesToCombine.join('\n')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null

      if (!user || !user.id) {
        throw new Error('User ID tidak ditemukan. Silakan login kembali.')
      }

      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: combinedText,
          sessionId: activeSessionId
        }),
      })

      if (!response.ok) {
        throw new Error('Gagal mendapatkan respons dari AI')
      }

      const data = await response.json()
      const rawResponse = data.response || 'Maaf, saya tidak dapat memproses pertanyaan Anda.'
      const parts = splitMessageByBubbleBreak(rawResponse)

      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          setLoading(true)
          await new Promise((resolve) => setTimeout(resolve, 800))
        }

        const aiMessage = {
          id: Date.now() + 1 + i,
          role: 'assistant',
          text: parts[i],
        }

        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Error:', error)

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: `Maaf, terjadi kesalahan: ${error.message || 'Silakan coba lagi nanti.'
            }`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

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

    if (chatTimerRef.current) {
      clearTimeout(chatTimerRef.current)
    }

    chatBufferRef.current.push(trimmed)
    setIsBuffering(true)

    if (chatBufferRef.current.length === 4) {
      sendMergedMessages()
    } else {
      chatTimerRef.current = setTimeout(() => {
        sendMergedMessages()
      }, 8000)
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
              {messages.map((message, index) => {
                const isPreviousSame = index > 0 && messages[index - 1].role === message.role
                return (
                  <div
                    key={message.id}
                    className={`chat-bubble ${message.role === 'user' ? 'user' : 'assistant'
                      } ${isPreviousSame ? 'consecutive' : ''}`}
                  >
                    {!isPreviousSame && (
                      <div className="bubble-meta">
                        <span>{message.role === 'user' ? 'Anda' : 'AIVEST'}</span>
                        <span>
                          {message.role === 'user' ? 'User' : 'AI Assistant'}
                        </span>
                      </div>
                    )}

                    <div className="bubble-content">{renderMessage(message)}</div>
                  </div>
                )
              })}

              {(loading || isBuffering) && (
                <div
                  className={`chat-bubble assistant ${messages.length > 0 &&
                      messages[messages.length - 1].role === 'assistant'
                      ? 'consecutive'
                      : ''
                    }`}
                >
                  {!(
                    messages.length > 0 &&
                    messages[messages.length - 1].role === 'assistant'
                  ) && (
                      <div className="bubble-meta">
                        <span>AIVEST</span>
                        <span>AI Assistant</span>
                      </div>
                    )}

                  <div className="loading-container">
                    {isBuffering && (
                      <span className="buffering-text">
                        AIVEST sedang menunggu pesan tambahan...
                      </span>
                    )}
                    <div className="loading-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
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

          </aside>
        </div>
      </div>
    </MainLayout>
  )
}

export default AIAssistant