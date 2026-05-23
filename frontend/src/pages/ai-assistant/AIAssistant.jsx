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
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Terima kasih. Saya sedang memproses jawaban untuk pertanyaan Anda. Silakan tunggu sebentar.',
        },
      ]);
    }, 400);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
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

              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Tulis pesan..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button type="button" onClick={handleSend}>
                Kirim
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