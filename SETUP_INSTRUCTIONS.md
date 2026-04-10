# DeFi Copilot - Setup Instructions

## ✅ What's Been Completed

### Backend (API)
- ✅ Fastify server with CORS, rate limiting, and logging
- ✅ Prisma database schema (Users, Orders, Alerts, Conversations, Messages, Transactions)
- ✅ Database service layer (user management, orders, alerts, conversations)
- ✅ Claude AI integration for parsing trade intents
- ✅ 1inch trading API integration for swap quotes
- ✅ API endpoints:
  - `POST /api/health` - Health check
  - `POST /api/copilot` - AI chat interface
  - `POST /api/quote` - Get swap quotes

---

## 🚀 Next Steps - What You Need To Do

### 1. Set Up Your Database

You have **two options**:

#### Option A: Use Supabase (Recommended - Free & Easy)
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Project Settings → Database
4. Copy the connection string (starts with `postgresql://...`)
5. Update your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
   ```

#### Option B: Use Local PostgreSQL
1. Install PostgreSQL on your Mac:
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```
2. Create a database:
   ```bash
   createdb defi_copilot
   ```
3. Update your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/defi_copilot"
   ```

---

### 2. Get API Keys

Create or update `/Users/hassanbashir/Desktop/Work/defi_copilot/apps/api/.env` with these keys:

```env
# ─── AI ───────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
# Get from: https://console.anthropic.com

# ─── Blockchain RPCs ───────────────────────────────────
ALCHEMY_API_KEY=...
# Get from: https://alchemy.com (free tier: 300M compute units/month)

# ─── Trading APIs ──────────────────────────────────────
ONEINCH_API_KEY=...
# Get from: https://portal.1inch.dev

# ─── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://...
# From Step 1 above

# ─── App ───────────────────────────────────────────────
PORT=3001
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Priority:**
- 🔴 **REQUIRED NOW**: `ANTHROPIC_API_KEY`, `DATABASE_URL`
- 🟡 **NEEDED FOR SWAPS**: `ONEINCH_API_KEY`, `ALCHEMY_API_KEY`
- 🟢 **OPTIONAL**: Everything else

---

### 3. Run Database Migrations

Once you have `DATABASE_URL` set in your `.env` file:

```bash
cd /Users/hassanbashir/Desktop/Work/defi_copilot/apps/api
npx prisma migrate dev --name init
```

This will create all the tables (User, Order, PriceAlert, Conversation, Message, Transaction).

---

### 4. Start the Backend Server

```bash
cd /Users/hassanbashir/Desktop/Work/defi_copilot/apps/api
npm run dev
```

You should see:
```
✔ Server listening at http://0.0.0.0:3001
```

Test it:
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","service":"defi-copilot-api","timestamp":"..."}
```

---

## 🎯 What's Next After Backend Setup?

Once the backend is running, we'll build:

1. **Next.js Frontend** with:
   - WalletConnect integration
   - AI chat interface
   - Swap execution UI
   - Order management dashboard

2. **Background Jobs** (BullMQ):
   - Price monitoring for limit orders
   - Alert triggering
   - DCA execution

---

## 📝 Quick Reference

### Database Schema
- **User**: Wallet addresses and user data
- **Order**: Limit orders, stop-loss, DCA orders
- **PriceAlert**: Price alerts ("notify me when ETH > $4000")
- **Conversation**: Chat history with AI
- **Message**: Individual messages in conversations
- **Transaction**: On-chain transaction records

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/copilot` | POST | AI chat - parse trading intent |
| `/api/quote` | POST | Get swap quote from 1inch |

---

## ❓ Need Help?

If you run into issues:

1. **Database connection error**: Make sure your `DATABASE_URL` is correct
2. **Prisma Client error**: Run `npx prisma generate` in the api folder
3. **Missing dependencies**: Run `npm install` in the api folder
4. **Port already in use**: Change `PORT` in `.env` or kill the process using port 3001

---

**Ready to continue?** Let me know once you have:
1. ✅ Database URL configured
2. ✅ API keys obtained (at least Anthropic)
3. ✅ Migrations run successfully
4. ✅ Backend server running

Then we'll move to the frontend! 🚀
