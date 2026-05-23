import fs from 'fs';
import path from 'path';

// --- FUNGSI HELPER: Mengambil Data Emas ---
const fetchGoldPrices = async () => {
  try {
    // Menggunakan endpoint Aneka Logam dan membatasi 7 data terakhir
    // menggunakan parameter length=7 sesuai dokumentasi API
    const goldApiUrl = 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/anekalogam/history?length=7';
    const response = await fetch(goldApiUrl);
    const result = await response.json();

    if (!result.success) {
      return "Data emas saat ini tidak dapat diakses.";
    }

    // Merangkum data JSON menjadi teks yang mudah dibaca oleh AI
    let goldContext = "Berikut adalah data harga emas Aneka Logam (Antam) 7 hari terakhir (per gram):\n";
    result.data.forEach((item) => {
      goldContext += `- Tanggal: ${item.recordedDate}, Harga Beli: Rp${item.sellPrice}, Harga Jual Kembali (Buyback): Rp${item.buybackPrice}\n`;
    });

    goldContext += "\nTolong analisis tren harga emas ini secara singkat dan berikan rekomendasi apakah hari ini adalah waktu yang tepat untuk membeli atau menjual emas bagi pengguna.";
    
    return goldContext;
  } catch (error) {
    console.error('Gagal mengambil data emas:', error);
    return "Terjadi kesalahan saat mengambil data emas terbaru.";
  }
};
// ------------------------------------------

export const generateResponse = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // 1. Membaca file prompt.md (System Instructions)
    const promptPath = path.join(process.cwd(), 'prompt.md'); 
    let systemInstructions = '';
    try {
      systemInstructions = fs.readFileSync(promptPath, 'utf8');
    } catch (readError) {
      console.error('Gagal membaca file prompt.md:', readError);
      return res.status(500).json({ error: 'Failed to load AI instructions' });
    }

    // 2. Deteksi Kata Kunci & Injeksi Data Emas Terkini
    let contextInjection = '';
    const userMessageLower = message.toLowerCase();
    
    // Jika user menyinggung soal emas, kita tarik datanya
    if (userMessageLower.includes('emas') || userMessageLower.includes('logam mulia')) {
      console.log('Keyword emas terdeteksi, menarik data Logam Mulia API...');
      const goldDataText = await fetchGoldPrices();
      
      // Kita tambahkan data emas ini ke dalam instruksi sistem secara dinamis
      systemInstructions += `\n\n[INFORMASI TAMBAHAN REAL-TIME UNTUK MENJAWAB PERTANYAAN USER]\n${goldDataText}`;
    }

    // 3. Konfigurasi dan Pemanggilan Gemini API (Gunakan v1beta)
    const modelName = 'gemini-3.5-flash'; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: systemInstructions,
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      const errorMessage = data.error?.message || 'API Error';
      return res.status(response.status).json({ error: errorMessage });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respons';

    res.json({ response: generatedText });
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};