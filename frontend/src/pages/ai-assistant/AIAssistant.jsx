import { useEffect, useRef, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import './AIAssistant.css';

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
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mendapatkan respons dari AI');
      }

      const data = await response.json();
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.response || 'Maaf, saya tidak dapat memproses pertanyaan Anda.',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !loading) {
      event.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    'Bantu susun anggaran bulanan saya',
    'Rekomendasi tujuan tabungan terbaik',
    'Analisa pengeluaran saya bulan ini',
    'Tips invest jangka pendek',
  ];

  return (
    <MainLayout>
      <div className="ai-assistant-page">
        <div className="ai-assistant-header">
          <h1>AI Assistance</h1>
          <p>
            Ruang chat khusus untuk berinteraksi dengan AI AIVEST. Tulis pertanyaanmu dan
            dapatkan jawaban seputar keuangan, anggaran, atau perencanaan tujuan.
          </p>
        </div>

        <div className="ai-chat-layout">
          <section className="chat-card">
            <header>
              <div className="chat-agent-avatar">AI</div>
              <div className="chat-agent-title">
                <h2>AIVEST Chat</h2>
                <p>Asisten keuangan real-time dalam bentuk chat room.</p>
              </div>
            </header>

            <div className="chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
                >
                  <div className="bubble-meta">
                    <span>{message.role === 'user' ? 'Anda' : 'AIVEST'}</span>
                    <span>{message.role === 'user' ? 'User' : 'AI Assistant'}</span>
                  </div>
                  <div>{message.text}</div>
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
                Ketuk prompt untuk mengisi pesan, lalu tekan kirim. Desain ini mengikuti
                pakem tampilan halaman lain: kartu putih, bayangan lembut, dan ruang terbuka.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}

export default AIAssistant;