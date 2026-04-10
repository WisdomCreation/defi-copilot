# Day One — Start Here

This is your exact playbook for the first day. Follow in order.

---

## Step 1: Initialize the repo (30 minutes)

Open terminal and run:

```bash
# Navigate to your project folder
cd /Users/hassanbashir/Desktop/Work/defi_copilot

# Initialize git
git init
echo "# DeFi Copilot" > README.md
git add . && git commit -m "chore: initial commit"

# Install Node.js 20 LTS if not already installed
# Download from: https://nodejs.org/

# Install pnpm (faster than npm)
npm install -g pnpm

# Initialize monorepo
pnpm init

# Create workspace structure
mkdir -p apps/web apps/api packages/shared docs
```

---

## Step 2: Create the Next.js frontend (20 minutes)

```bash
cd apps/web

# Create Next.js app
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install wallet + web3 dependencies
pnpm add wagmi viem @tanstack/react-query
pnpm add @web3modal/wagmi @walletconnect/web3wallet

# Install UI utilities
pnpm add clsx tailwind-merge lucide-react

# Start development server to verify
pnpm dev
# → Should open at http://localhost:3000
```

---

## Step 3: Create the backend API (20 minutes)

```bash
cd ../../apps/api

# Initialize
pnpm init
pnpm add fastify @fastify/cors @fastify/rate-limit
pnpm add typescript ts-node-dev @types/node
pnpm add @anthropic-ai/sdk openai
pnpm add prisma @prisma/client bullmq ioredis
pnpm add zod dotenv

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init

# Create entry point
mkdir -p src
touch src/index.ts
```

Paste into `apps/api/src/index.ts`:

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({ logger: true })

app.register(cors, { origin: 'http://localhost:3000' })

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

app.listen({ port: 3001 }, (err) => {
  if (err) throw err
  console.log('API running on http://localhost:3001')
})
```

```bash
# Start API
npx ts-node-dev src/index.ts
# → curl http://localhost:3001/health should return {"status":"ok"}
```

---

## Step 4: Get all API keys (1 hour)

Open these in your browser and sign up / get keys:

| Service | URL | What to get |
|---------|-----|-------------|
| Alchemy | alchemy.com | Create app → API key |
| Anthropic | console.anthropic.com | API key |
| WalletConnect | cloud.walletconnect.com | Project ID |
| 1inch | portal.1inch.dev | API key |
| Supabase | supabase.com | New project → DATABASE_URL |
| Upstash | upstash.com | Redis DB → REDIS_URL |
| Resend | resend.com | API key |
| Helius | helius.dev | API key (Solana) |

---

## Step 5: Create your .env files (10 minutes)

Create `/Users/hassanbashir/Desktop/Work/defi_copilot/apps/api/.env`:

```env
# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Blockchain
ALCHEMY_API_KEY=...
HELIUS_API_KEY=...
WALLETCONNECT_PROJECT_ID=...

# Trading
ONEINCH_API_KEY=...

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Notifications
RESEND_API_KEY=re_...

# App
JWT_SECRET=generate_a_long_random_string_here
NODE_ENV=development
```

Create `/Users/hassanbashir/Desktop/Work/defi_copilot/apps/web/.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_ALCHEMY_API_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Step 6: Test Claude API works (10 minutes)

Create `apps/api/src/test-claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function test() {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: 'Parse this trade intent and return JSON: "swap $500 ETH to USDC"'
    }]
  })
  console.log(response.content[0])
}

test()
```

```bash
npx ts-node src/test-claude.ts
# Should print Claude's JSON response
```

---

## Step 7: Test 1inch API works (10 minutes)

```bash
# Test quote for 1 ETH → USDC on Ethereum mainnet
curl "https://api.1inch.dev/swap/v6.0/1/quote?\
src=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE\
&dst=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\
&amount=1000000000000000000" \
-H "Authorization: Bearer YOUR_ONEINCH_KEY"
# Should return a price quote in JSON
```

---

## Step 8: Push to GitHub (10 minutes)

```bash
cd /Users/hassanbashir/Desktop/Work/defi_copilot

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
.next/
dist/
.turbo/
*.log
EOF

git add .
git commit -m "feat: project structure + dependencies"

# Create repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/defi_copilot.git
git push -u origin main
```

---

## End of Day 1 Checklist

- [ ] Monorepo created at `/Users/hassanbashir/Desktop/Work/defi_copilot`
- [ ] Next.js app running at `http://localhost:3000`
- [ ] Fastify API running at `http://localhost:3001`
- [ ] All API keys obtained and in `.env`
- [ ] Claude API test returns valid response
- [ ] 1inch API test returns a quote
- [ ] Code pushed to GitHub

**If all boxes are checked: Day 1 is a success. You're ready for Sprint 2.**

---

## Help & Resources

| Need | Resource |
|------|---------|
| Wagmi docs | wagmi.sh/react |
| 1inch API docs | portal.1inch.dev/documentation |
| Claude API docs | docs.anthropic.com |
| Alchemy docs | docs.alchemy.com |
| Next.js docs | nextjs.org/docs |
| Fastify docs | fastify.dev/docs |
| Prisma docs | prisma.io/docs |
| LI.FI bridge docs | docs.li.fi |
| Jupiter swap docs | station.jup.ag/docs |
