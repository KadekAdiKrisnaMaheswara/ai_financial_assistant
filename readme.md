# AI Financial Assistant

Aplikasi Financial Technology berbasis AI menggunakan:

* React + Vite (Frontend)
* Node.js + Express (Backend)
* PostgreSQL + Prisma (Database)

---

# 📦 Tech Stack

## Frontend

* React
* Vite
* React Router DOM
* Axios
* Tailwind CSS

## Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* JWT Authentication
* bcrypt

---

# ⚙️ Requirement

Sebelum menjalankan project, install:

* Node.js 20 LTS
* PostgreSQL
* Git
* VSCode

---

# 🚀 Clone Repository

```bash
git clone <repository-url>
```

Masuk ke folder project:

```bash
cd ai_financial_assistant
```

---

# 🎨 FRONTEND SETUP

Masuk ke folder frontend:

```bash
cd frontend
```

---

# 📦 Install Dependency Frontend

```bash
npm install
```

Jika ada package yang belum terinstall:

```bash
npm install react react-dom react-router-dom axios
npm install -D vite @vitejs/plugin-react tailwindcss
```

---

# ▶️ Menjalankan Frontend

```bash
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

---

# 📁 Struktur Frontend

```bash
frontend/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

# 🖥️ BACKEND SETUP

Masuk ke folder backend:

```bash
cd backend
```

---

# 📦 Install Dependency Backend

```bash
npm install
```

Jika ada package yang belum terinstall:

```bash
npm install express cors dotenv bcrypt jsonwebtoken prisma @prisma/client
npm install nodemon --save-dev
```

---

# 🗄️ PostgreSQL Setup

Buat database PostgreSQL:

```sql
CREATE DATABASE ai_financial_assistant;
```

---

# 🔐 Environment Variables

Buat file:

```bash
backend/.env
```

Isi dengan:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_financial_assistant"
JWT_SECRET="secretkey"
PORT=5000
```

Ganti:

* postgres
* password

sesuai PostgreSQL masing-masing.

---

# 🧠 Prisma Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Migration database:

```bash
npx prisma migrate dev
```

---

# ▶️ Menjalankan Backend

```bash
npm run dev
```

Backend berjalan di:

```text
http://localhost:5000
```

---

# 📁 Struktur Backend

```bash
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── app.js
│   └── server.js
├── .env
└── package.json
```

---

# 🔐 Authentication API

## Register

### Endpoint

```text
POST /api/auth/register
```

### Body JSON

```json
{
  "name": "Krisna",
  "email": "krisna@gmail.com",
  "password": "123456"
}
```

---

## Login

### Endpoint

```text
POST /api/auth/login
```

### Body JSON

```json
{
  "email": "krisna@gmail.com",
  "password": "123456"
}
```

---

# 💸 Transaction API

## Create Transaction

### Endpoint

```text
POST /api/transactions
```

### Headers

```text
Authorization: Bearer TOKEN
```

### Body JSON

```json
{
  "title": "Coffee",
  "amount": 30000,
  "type": "expense",
  "notes": "Cafe",
  "transactionDate": "2026-05-08"
}
```

---

## Get Transactions

### Endpoint

```text
GET /api/transactions
```

---

# 📊 Dashboard API

## Endpoint

```text
GET /api/dashboard
```

### Headers

```text
Authorization: Bearer TOKEN
```

---

# 👥 Team Workflow

## Frontend Team

Fokus:

* UI/UX
* React Components
* Dashboard
* Charts
* AI Chatbot UI

## Backend Team

Fokus:

* API
* Authentication
* Transaction CRUD
* Dashboard analytics
* AI integration

## Database Team

Fokus:

* PostgreSQL
* Prisma schema
* Migration
* Relasi tabel

---

# 🔥 Current Features

✅ Login/Register
✅ JWT Authentication
✅ PostgreSQL Database
✅ Prisma ORM
✅ CRUD Transaction
✅ Dashboard Analytics API

---

# 🚀 Upcoming Features

* Frontend Dashboard
* Charts Analytics
* AI Financial Assistant
* Budget Planning
* Smart Recommendation
* Dark Mode

---

# 📌 Notes

Gunakan:

```text
Node.js 20 LTS
```

Karena Prisma belum stabil di Node.js versi terbaru.
