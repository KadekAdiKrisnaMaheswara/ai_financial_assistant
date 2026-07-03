import fs from 'fs';
import path from 'path';
import prisma from '../prisma/client.js';
import { stockSymbols, fetchIDXQuote } from '../routes/marketRoutes.js';

// --- FUNGSI HELPER: Mengambil Data Emas Terkini ---
const fetchGoldPrices = async () => {
  try {
    const goldApiUrl = 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/pegadaian/history';
    const response = await fetch(goldApiUrl);
    const result = await response.json();

    if (!result.success || !result.data) {
      return null;
    }

    const nonZeroData = result.data.filter(item => item.sellPrice > 0 && item.buybackPrice > 0).slice(0, 7);
    if (nonZeroData.length === 0) {
      return null;
    }

    console.log('Data emas berhasil diambil (non-zero):', nonZeroData);
    let goldContext = "Data Harga Emas Pegadaian 7 Hari Terakhir (per gram):\n";

    nonZeroData.forEach((item) => {
      const sellPriceGram = item.sellPrice / item.weight;
      const buybackPriceGram = item.buybackPrice / item.weight;
      goldContext += `Tanggal ${item.recordedDate}: Harga Beli Rp ${sellPriceGram.toLocaleString('id-ID')}/gram, Harga Jual Kembali Rp ${buybackPriceGram.toLocaleString('id-ID')}/gram\n`;
    });

    return goldContext;
  } catch (error) {
    console.error('Gagal mengambil data emas:', error);
    return null;
  }
};

// --- FUNGSI HELPER: Mengambil Data Keuangan Pelanggan (RAG) ---
const fetchCustomerFinancialData = async (userId) => {
  try {
    if (!userId) {
      return "Data pelanggan tidak tersedia.";
    }

    const [user, transactions, budgets, goals] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.transaction.findMany({
        where: { user_id: userId },
        include: { category: true },
        orderBy: { transaction_date: 'desc' },
        take: 50,
      }),
      prisma.budget.findMany({
        where: { user_id: userId },
        include: { category: true },
      }),
      prisma.financialGoal.findMany({
        where: { user_id: userId },
      }),
    ]);

    if (!user) {
      return "Pengguna tidak ditemukan.";
    }

    let dataContext = `PROFIL PENGGUNA:\nNama: ${user.full_name}\nMata Uang: ${user.currency}\n\n`;

    // Analisis Transaksi
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    dataContext += `RINGKASAN TRANSAKSI (50 Terakhir):\n`;
    dataContext += `Total Pemasukan: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: user.currency }).format(income)}\n`;
    dataContext += `Total Pengeluaran: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: user.currency }).format(expense)}\n`;
    dataContext += `Selisih: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: user.currency }).format(income - expense)}\n\n`;

    // Breakdown Pengeluaran per Kategori
    const expenseByCategory = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = t.category?.name || 'Lainnya';
        expenseByCategory[catName] = (expenseByCategory[catName] || 0) + parseFloat(t.amount);
      });

    dataContext += `PENGELUARAN BERDASARKAN KATEGORI:\n`;
    Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, amount]) => {
        const percentage = ((amount / expense) * 100).toFixed(1);
        dataContext += `${cat}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: user.currency }).format(amount)} (${percentage}%)\n`;
      });
    dataContext += '\n';

    // Status Budget
    if (budgets.length > 0) {
      dataContext += `STATUS BUDGET SAAT INI:\n`;
      budgets.forEach(budget => {
        const spent = parseFloat(budget.spent_amount);
        const limit = parseFloat(budget.limit_amount);
        const percentage = ((spent / limit) * 100).toFixed(1);
        const status = spent > limit ? 'MELEBIHI' : 'AMAN';
        dataContext += `${budget.category?.name}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: user.currency }).format(spent)} dari ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: user.currency }).format(limit)} (${percentage}%) - ${status}\n`;
      });
      dataContext += '\n';
    }

    // Financial Goals
    if (goals.length > 0) {
      dataContext += `TUJUAN FINANSIAL:\n`;
      goals.forEach(goal => {
        const current = parseFloat(goal.current_amount);
        const target = parseFloat(goal.target_amount);
        const progress = ((current / target) * 100).toFixed(1);
        dataContext += `${goal.name}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: user.currency }).format(current)} dari ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: user.currency }).format(target)} (${progress}%)\n`;
      });
      dataContext += '\n';
    }

    return dataContext;
  } catch (error) {
    console.error('Gagal mengambil data keuangan pelanggan:', error);
    return "Terjadi kesalahan saat mengambil data keuangan Anda.";
  }
};
// ------------------------------------------

export const generateResponse = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const user_id = req.userId || req.body.user_id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // 1. Membaca file prompt.md (System Instructions dengan RAG context)
    const promptPath = path.join(process.cwd(), 'prompt.md');
    let systemInstructions = '';
    try {
      systemInstructions = fs.readFileSync(promptPath, 'utf8');
    } catch (readError) {
      console.error('Gagal membaca file prompt.md:', readError);
      return res.status(500).json({ error: 'Failed to load AI instructions' });
    }

    // 2. Ambil Data Keuangan Pelanggan (RAG - Retrieval-Augmented Generation)
    console.log('Mengambil data keuangan pelanggan untuk RAG...');
    const customerFinancialData = await fetchCustomerFinancialData(user_id);

    // Ganti placeholder dengan data customer sebenarnya
    systemInstructions = systemInstructions.replace(
      '[USER_FINANCIAL_DATA_WILL_BE_INJECTED_HERE]',
      customerFinancialData
    );

    // 3. Deteksi Kata Kunci Investasi (Emas & Saham) & Injeksi Data Real-Time
    let investmentDataInjection = '';
    const userMessageLower = message.toLowerCase();

    const isGoldMentioned =
      userMessageLower.includes('emas') ||
      userMessageLower.includes('logam mulia');

    const isStockMentioned =
      userMessageLower.includes('saham') ||
      userMessageLower.includes('stock') ||
      userMessageLower.includes('ihsg') ||
      userMessageLower.includes('jkse') ||
      stockSymbols.some(symbol => userMessageLower.includes(symbol.toLowerCase().replace('.jk', '')));

    const isGeneralInvestment =
      userMessageLower.includes('investasi') ||
      userMessageLower.includes('membeli') ||
      userMessageLower.includes('jual');

    if (isGoldMentioned || isStockMentioned || isGeneralInvestment) {
      console.log('Keyword investasi terdeteksi, menarik data pasar...');

      const [goldDataText, stocksQuotes] = await Promise.all([
        fetchGoldPrices(),
        Promise.all(stockSymbols.map(symbol => fetchIDXQuote(symbol)))
      ]);

      let contextParts = [];

      if (goldDataText) {
        contextParts.push(`[DATA REAL-TIME HARGA EMAS]\n${goldDataText}`);
      } else {
        contextParts.push(`[DATA EMAS]\nData emas terkini tidak tersedia saat ini.`);
      }

      let stocksContext = "Data Harga Saham/Indeks Terkini:\n";
      stocksQuotes.forEach((stock) => {
        if (stock.status === 'ok') {
          stocksContext += `- ${stock.name} (${stock.symbol}): Harga ${stock.formattedPrice}, Perubahan ${stock.formattedChangePercent}\n`;
        } else {
          stocksContext += `- ${stock.symbol}: Gagal mengambil data (${stock.message})\n`;
        }
      });
      contextParts.push(`[DATA REAL-TIME INDEKS & SAHAM]\n${stocksContext}`);

      investmentDataInjection = `\n\n${contextParts.join('\n\n')}\n\nBerdasarkan data harga emas dan saham/indeks di atas serta data finansial pengguna, analisis dan berikan rekomendasi investasi yang paling tepat (apakah membeli emas, membeli saham tertentu, atau menabung saja). Jika data tertentu tidak tersedia atau gagal diambil, sebutkan bahwa Anda tidak memiliki akses ke harga real-time data tersebut.`;
      systemInstructions += investmentDataInjection;
    }

    // 4. Tambahkan reminder strict untuk non-financial topics
    systemInstructions += `\n\n[REMINDER KETAT]\nJika pertanyaan user SAMA SEKALI TIDAK TERKAIT dengan: analisis data keuangannya, manajemen pengeluaran, perencanaan budget, tabungan, atau investasi emas - TOLAK pertanyaan tersebut dengan sopan dan arahkan kembali ke topik finansial.`;

    // 5. Hubungkan / Dapatkan Sesi Chat Aktif User
    let finalSessionId = sessionId;
    if (!finalSessionId && user_id) {
      let session = await prisma.chatSession.findFirst({
        where: { user_id },
        orderBy: { created_at: 'desc' }
      });
      if (!session) {
        session = await prisma.chatSession.create({
          data: {
            user_id,
            title: 'Sesi Asisten Keuangan'
          }
        });
      }
      finalSessionId = session.id;
    }

    // 6. Simpan pesan User ke Database
    if (finalSessionId) {
      await prisma.chatMessage.create({
        data: {
          session_id: finalSessionId,
          role: 'user',
          content: message
        }
      });
    }

    // 7. Ambil riwayat chat lengkap untuk dikirimkan ke Gemini API sebagai context history
    let historyContents = [];
    if (finalSessionId) {
      const chatMessages = await prisma.chatMessage.findMany({
        where: { session_id: finalSessionId },
        orderBy: { created_at: 'asc' }
      });

      // Filter dan format untuk Gemini (bergantian user-model, harus diawali dengan user)
      const firstUserIdx = chatMessages.findIndex(m => m.role === 'user');
      if (firstUserIdx !== -1) {
        const filtered = chatMessages.slice(firstUserIdx);
        for (const msg of filtered) {
          const role = msg.role === 'assistant' ? 'model' : 'user';
          if (historyContents.length > 0 && historyContents[historyContents.length - 1].role === role) {
            historyContents[historyContents.length - 1].parts[0].text += '\n\n' + msg.content;
          } else {
            historyContents.push({
              role,
              parts: [{ text: msg.content }]
            });
          }
        }
      }
    }

    // Fallback jika history kosong
    if (historyContents.length === 0) {
      historyContents = [
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ];
    }

    // 8. Konfigurasi dan Pemanggilan Gemini API dengan history
    const modelName = 'gemini-2.5-flash';
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
        contents: historyContents,
      }),
    });

    const data = await response.json();

    // Simpan respons mentah AI ke file txt
    try {
      const logPath = path.join(process.cwd(), 'raw_ai_response.txt');
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respons/Error';
      const rawLogContent = `=== RAW API RESPONSE ===\n${JSON.stringify(data, null, 2)}\n\n=== EXTRACTED TEXT ===\n${generatedText}\n`;
      fs.writeFileSync(logPath, rawLogContent, 'utf8');
      console.log('Respons mentah AI/Error berhasil disimpan ke raw_ai_response.txt');
    } catch (writeErr) {
      console.error('Gagal menulis file log respons AI:', writeErr);
    }

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      const errorMessage = data.error?.message || 'API Error';
      return res.status(response.status).json({ error: errorMessage });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respons';

    // 9. Simpan pesan AI (assistant) ke Database
    if (finalSessionId && generatedText) {
      await prisma.chatMessage.create({
        data: {
          session_id: finalSessionId,
          role: 'assistant',
          content: generatedText
        }
      });
    }

    res.json({ response: generatedText });
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};