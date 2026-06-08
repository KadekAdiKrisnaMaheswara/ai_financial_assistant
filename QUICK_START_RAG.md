# Quick Start: Testing RAG Implementation

## Prerequisites
- [ ] Backend is running on `http://localhost:5000`
- [ ] Frontend is running on `http://localhost:5173` or similar
- [ ] PostgreSQL database is accessible
- [ ] `.env` files configured (API_KEY, DATABASE_URL)
- [ ] Test user exists in database with transactions

## Setup Steps

### 1. Verify Backend Dependencies
```bash
cd backend
npm install
```

### 2. Verify Frontend is Updated
The latest AIAssistant.jsx should be deployed to frontend.

### 3. Ensure Test Data Exists
Your test user should have:
- At least 1 transaction (income or expense)
- Preferably 5+ transactions for meaningful analysis
- At least 1 budget or financial goal

You can insert test data via:
```sql
-- Insert test transaction
INSERT INTO transactions (id, user_id, category_id, amount, type, description, transaction_date) 
VALUES ('id1', 'user-uuid', 'cat-uuid', 500000, 'expense', 'Test', NOW());
```

## Testing Workflow

### Test 1: Basic Finance Question (RAG Testing)
1. Log into application
2. Navigate to AI Chat
3. Ask: **"Berapa total pengeluaranku?"**

**Expected Result:**
- AI shows actual transaction data from database
- Mentions specific amount and date range
- References categories

**What's Happening:**
- Frontend sends user_id + message
- Backend fetches customer financial data
- Injects into system prompt
- Gemini generates response based on real data

### Test 2: Expense Breakdown (RAG + Analysis)
1. Ask: **"Bagaimana breakdown pengeluaranku per kategori?"**

**Expected Result:**
- AI lists actual categories from database
- Shows amounts and percentages
- Analyzes which category is largest

**Example Response:**
```
Berdasarkan data transaksimu, ini adalah breakdown pengeluaranmu:

Makanan: Rp 1,500,000 (30%)
Transportasi: Rp 1,200,000 (24%)
Entertainment: Rp 800,000 (16%)
Lainnya: Rp 1,500,000 (30%)

Pengeluaran terbesar kamu adalah di kategori Makanan...
```

### Test 3: Gold Investment (Real-Time Data)
1. Ask: **"Apakah sekarang waktu yang tepat untuk membeli emas?"**

**Expected Result:**
- Backend fetches live gold prices
- AI analyzes trend
- Combines with user's financial situation
- Gives personalized recommendation

**Check Backend Logs:**
```
Keyword investasi/emas terdeteksi, menarik data Logam Mulia API...
Data emas berhasil diambil: [data]
Context emas yang akan diinjeksi ke AI: Data Harga Emas...
```

### Test 4: Budget Status (RAG + Budget Data)
1. Ask: **"Apakah aku sudah melampaui budget bulan ini?"**

**Expected Result:**
- AI checks actual budget vs spent data
- Mentions specific categories that are over/under
- Provides actionable advice

### Test 5: Out-of-Scope Query (Strict Policy Testing)
1. Ask: **"Apa itu Python?"** or any non-financial question

**Expected Result:**
- AI rejects politely
- Redirects to financial topics
- Message: "Maaf, saya hanya bisa membantu dengan..."

## Debugging

### If AI Response is Generic (RAG Not Working)

**Check 1: Is user_id being sent?**
- Open Browser DevTools → Network tab
- Send a message
- Click on the `/api/ai/chat` request
- Check Request body includes `user_id`

**Check 2: Is backend receiving data?**
- Check backend console logs
- Should see: `Mengambil data keuangan pelanggan untuk RAG...`
- If not, check that user_id matches a real user in database

**Check 3: Does user have data?**
```sql
SELECT COUNT(*) FROM transactions WHERE user_id = 'your-user-id';
SELECT COUNT(*) FROM budgets WHERE user_id = 'your-user-id';
```

If 0 results, insert test data.

### If Getting 400 Error

**Error:** `"User ID is required"`
- Check frontend localStorage has user data
- Verify user.id exists in parsed object
- Check user table in database

### If Getting 500 Error

**Check Backend Logs:**
```
[Error details]
AI Controller Error: [message]
```

**Common Issues:**
- Prisma connection failed → Check DATABASE_URL
- API key missing → Check API_KEY in .env
- Database query failed → Check user exists in database

## Performance Metrics

**Measure Response Time:**
1. Open DevTools → Network tab
2. Send a message
3. Check `/api/ai/chat` request duration

**Expected Timing:**
- Database queries: 200-500ms
- Gold API (if needed): 500-1000ms
- Gemini API: 1-3 seconds
- **Total:** 1.5-5 seconds

If slower, check:
- Database indexes on user_id
- Network connectivity
- Server load

## API Testing (cURL)

### Test Without Frontend
```bash
# 1. Replace with real user_id
USER_ID="your-user-uuid"

# 2. Send test request
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Bagaimana pengeluaranku bulan ini?\",
    \"user_id\": \"$USER_ID\"
  }"

# 3. Expected response
{
  "response": "Berdasarkan data transaksimu..."
}
```

### Test Error Handling
```bash
# Without user_id (should fail with 400)
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"test\"}"

# Response: {"error":"User ID is required"}
```

## Gold Price API Testing

**Check if API is working:**
```bash
curl https://logam-mulia-api.iamutaki.workers.dev/api/prices/pegadaian/history

# Should return: {"success": true, "data": [...]}
```

**If API is down:**
- AI won't crash, will show error message
- User will be informed data unavailable

## Logging Verification

**Backend should log (check console):**
```
✓ Mengambil data keuangan pelanggan untuk RAG...
✓ Data emas berhasil diambil (if investment query)
✓ Keyword investasi/emas terdeteksi (if investment query)
✓ AI Controller response generated
```

**Frontend should log (DevTools → Console):**
```
✓ User message sent
✓ Response received
✓ Chat message displayed
```

## Common Test Scenarios

| Scenario | Test Message | Expected Behavior |
|----------|--------------|-------------------|
| Budget Check | "Apakah aku sudah over budget?" | Shows budget status per category |
| Goal Progress | "Bagaimana progress tujuan tabunganku?" | Shows goal percentage |
| Spending Pattern | "Kategori apa yang paling banyak aku keluarkan?" | Shows top expense categories |
| Investment | "Investasi apa yang bagus?" | Recommends only emas |
| Gold Prices | "Emas sekarang berapa harganya?" | Shows latest prices |
| Out-of-Scope | "Apa warna favorit kamu?" | Rejects & redirects |

## Success Checklist

- [ ] User can ask about transactions
- [ ] AI shows actual data from database
- [ ] Budget status is checked correctly
- [ ] Investment questions detected
- [ ] Gold prices are fetched
- [ ] Out-of-scope questions are rejected
- [ ] Error messages are helpful
- [ ] Response time is reasonable (<5s)
- [ ] No sensitive data exposed
- [ ] Logs show RAG process working

## Troubleshooting Checklist

- [ ] User logged in → localStorage has user data
- [ ] Database connected → Can query transactions
- [ ] API keys configured → .env has API_KEY
- [ ] Backend running → localhost:5000 responds
- [ ] Frontend updated → AIAssistant.jsx includes user_id
- [ ] Gold API working → Can fetch prices
- [ ] Logs visible → Check console for debug info

## Next Steps After Testing

1. ✅ All tests pass → Ready for production
2. ❌ Some tests fail → Debug using troubleshooting section above
3. ⚠️ Performance issues → Optimize queries/caching
4. 📊 Monitor usage → Track API costs and response times

---

**Need Help?** Check the documentation files:
- `AI_RAG_IMPLEMENTATION.md` - Architecture details
- `CHANGELOG_RAG.md` - Code changes
- Backend logs - Error details
