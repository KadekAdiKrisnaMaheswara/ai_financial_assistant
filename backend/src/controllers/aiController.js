import fs from 'fs';
import path from 'path';
import prisma from '../prisma/client.js';

// --- FUNGSI HELPER: Mengambil Data Emas Terkini ---
const fetchGoldPrices = async () => {
  try {
    const goldApiUrl = 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/pegadaian/history';
    const response = await fetch(goldApiUrl);
    const result = await response.json();

    if (!result.success) {      
      return null;
    }
    
    console.log('Data emas berhasil diambil:', result.data);
    let goldContext = "Data Harga Emas Pegadaian 7 Hari Terakhir (per gram):\n";
    
    result.data.forEach((item) => {
      goldContext += `Tanggal ${item.recordedDate}: Harga Beli Rp${item.sellPrice}, Harga Jual Kembali Rp${item.buybackPrice}\n`;
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
    const { message, user_id } = req.body;

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

    // 3. Deteksi Kata Kunci Emas & Injeksi Data Real-Time
    let goldDataInjection = '';
    const userMessageLower = message.toLowerCase();
    
    if (userMessageLower.includes('emas') || userMessageLower.includes('logam mulia') || 
        userMessageLower.includes('investasi') || userMessageLower.includes('membeli') ||
        userMessageLower.includes('jual')) {
      console.log('Keyword investasi/emas terdeteksi, menarik data Logam Mulia API...');
      const goldDataText = await fetchGoldPrices();
      
      if (goldDataText) {
        goldDataInjection = `\n\n[DATA REAL-TIME HARGA EMAS]\n${goldDataText}\n\nBerdasarkan tren harga ini dan data finansial pengguna, analisis dan berikan rekomendasi apakah saat ini adalah waktu yang tepat untuk membeli emas atau tidak.`;
        systemInstructions += goldDataInjection;
      } else {
        systemInstructions += `\n\n[DATA EMAS] Data emas terkini tidak tersedia saat ini. Jelaskan bahwa Anda tidak dapat memberikan rekomendasi investasi emas tanpa data harga terkini.`;
      }
    }

    // 4. Tambahkan reminder strict untuk non-financial topics
    systemInstructions += `\n\n[REMINDER KETAT]\nJika pertanyaan user SAMA SEKALI TIDAK TERKAIT dengan: analisis data keuangannya, manajemen pengeluaran, perencanaan budget, tabungan, atau investasi emas - TOLAK pertanyaan tersebut dengan sopan dan arahkan kembali ke topik finansial.`;

    // 5. Konfigurasi dan Pemanggilan Gemini API
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