# AI Financial Assistant - RAG Implementation

## Overview

The AI Financial Assistant now implements **Retrieval-Augmented Generation (RAG)** to provide personalized financial insights based on actual customer transaction data.

## Key Features

### 1. Data-Driven Responses
- AI analyzes real customer transaction data before responding
- All financial recommendations are based on actual spending patterns, budgets, and goals
- No generic or general advice - everything is contextual to the user

### 2. Customer Financial Context
The RAG system automatically retrieves and injects:
- **User Profile**: Name, currency preference
- **Transaction Summary**: 
  - Total income and expenses from 50 most recent transactions
  - Net balance
- **Expense Breakdown**: 
  - Expenses categorized by type (percentage of total spending)
  - Sorted by highest to lowest
- **Budget Status**: 
  - Current spending vs budget limit per category
  - Status indicator (AMAN/MELEBIHI)
- **Financial Goals**: 
  - Current progress vs target amount
  - Completion percentage

### 3. Gold Investment Analysis
- Real-time gold price data from Pegadaian API
- 7-day historical price trend
- Buy/sell recommendations based on:
  - Price trend analysis
  - Customer's financial situation (income, expenses, savings)
- Automatic detection of investment-related queries

### 4. Strict Content Policy
The AI enforces strict boundaries and will **reject** questions that are:
- Not related to financial management
- Not related to spending analysis
- Not related to gold investment
- General knowledge, entertainment, politics, etc.

## API Usage

### Chat Endpoint
**POST** `/api/ai/chat`

#### Request Body
```json
{
  "message": "Bagaimana pola pengeluaranku bulan ini?",
  "user_id": "uuid-of-user"
}
```

**Required Fields:**
- `message` (string): The user's question or message
- `user_id` (string): The UUID of the user (must exist in database)

#### Response
```json
{
  "response": "Berdasarkan data transaksimu selama bulan ini..."
}
```

#### Error Responses
```json
{
  "error": "User ID is required"
}
```

## Database Integration

The system uses **Prisma** to query:
- `User`: User profile and preferences
- `Transaction`: Income and expense records
- `Budget`: Budget allocations per category
- `FinancialGoal`: Long-term financial goals
- `Category`: Transaction categories (income/expense)

## System Instructions Architecture

### File: `prompt.md`

The system instructions are stored in `prompt.md` and contain:

1. **Role Definition**: AI is a strict financial advisor
2. **Scope Restrictions**: Only financial topics allowed
3. **RAG Principle**: All responses must be data-driven
4. **Gold Investment Rules**: Emas is the only recommended investment
5. **Communication Style**: Natural, Indonesian, conversational
6. **Format Rules**: Plain text, no markdown, no emoji

### Dynamic Context Injection

During each chat interaction, the system:
1. Reads `prompt.md` for base instructions
2. Fetches user's financial data via `fetchCustomerFinancialData()`
3. Replaces `[USER_FINANCIAL_DATA_WILL_BE_INJECTED_HERE]` with actual data
4. If investment/gold keywords detected:
   - Fetches live gold prices via `fetchGoldPrices()`
   - Injects price data and analysis instructions
5. Adds strict content policy reminder

## Controller Functions

### `fetchGoldPrices()`
- Calls Pegadaian gold price API
- Returns formatted 7-day historical data
- Returns `null` if API is unavailable

### `fetchCustomerFinancialData(userId)`
- Queries user profile, transactions, budgets, goals
- Formats data into readable context
- Handles currency formatting based on user preference
- Returns error messages if user not found

### `generateResponse(req, res)`
- Main endpoint handler
- Validates `message` and `user_id`
- Orchestrates RAG data retrieval
- Calls Gemini API with injected context
- Handles errors gracefully

## Example Conversations

### Example 1: Expense Analysis (RAG in action)
**User:** "Apa kategori pengeluaran terbesar ku?"

**System:**
1. Retrieves user's transaction data
2. Calculates expense breakdown by category
3. Injects data into instructions
4. Sends query to Gemini with full financial context

**AI Response:** "Berdasarkan data transaksimu, pengeluaran terbesar adalah kategori Makanan (35%), diikuti Transportasi (25%)..."

### Example 2: Gold Investment Query
**User:** "Apakah sekarang waktu yang tepat untuk membeli emas?"

**System:**
1. Detects investment keyword
2. Fetches live gold price data
3. Analyzes customer's income/savings capacity
4. Combines with user's financial situation
5. Sends comprehensive context to AI

**AI Response:** "Melihat data finansialmu dan tren harga emas..., berikut adalah analisisku..."

### Example 3: Out-of-Scope Query
**User:** "Bagaimana cara membuat website?"

**AI Response:** "Maaf, saya hanya bisa membantu dengan pertanyaan seputar keuangan pribadi, manajemen pengeluaran, dan investasi emas. Apakah ada yang bisa saya bantu terkait data finansialmu?"

## Environment Variables

Required in `.env`:
```
API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_connection_string
```

## Testing the RAG Implementation

### Test 1: Basic Financial Analysis
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bagaimana pengeluaran ku bulan ini?",
    "user_id": "your-user-uuid"
  }'
```

### Test 2: Investment Query
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Saya ingin investasi emas, apakah sekarang waktu yang baik?",
    "user_id": "your-user-uuid"
  }'
```

### Test 3: Out-of-Scope Query
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Apa adalah Artificial Intelligence?",
    "user_id": "your-user-uuid"
  }'
```

## Logging

The system logs important information:
- Customer financial data retrieval
- Gold price API calls
- Keyword detection for investments
- API response times
- Any errors during processing

Check server logs for debugging:
```
Mengambil data keuangan pelanggan untuk RAG...
Data emas berhasil diambil: [data]
Keyword investasi/emas terdeteksi...
```

## Future Enhancements

1. **Multi-language Support**: Support more languages beyond Indonesian
2. **Conversation Memory**: Track chat history for context-aware responses
3. **Recommendation Engine**: Generate proactive financial suggestions
4. **Investment Alternatives**: Support for more investment types
5. **Real-time Alerts**: Notify users of budget overages or price changes
6. **Detailed Reports**: Generate comprehensive financial reports

## Security Considerations

- Always validate `user_id` against authenticated user
- Sanitize user input before sending to AI API
- Secure Gemini API key in environment variables
- Implement rate limiting on `/chat` endpoint
- Log all AI responses for audit trails
