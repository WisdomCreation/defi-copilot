# Tech Stack — DeFi Copilot

**Version:** 1.0  
**Decision date:** April 2026

---

## Stack Overview

```
User Browser (PWA)
    ↓
Next.js 14 Frontend
    ↓
Node.js / Fastify Backend
    ↓
┌─────────────────────────────────────┐
│  AI Layer    │  Trading Layer       │
│  Claude API  │  1inch, Jupiter      │
│  GPT-4o      │  LI.FI, Gelato       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Chain Layer                        │
│  Alchemy (EVM) · Helius (Solana)    │
└─────────────────────────────────────┘
    ↓
PostgreSQL · Redis · BullMQ
```

---

## Frontend

| Tool | Purpose | Version | Cost |
|------|---------|---------|------|
| **Next.js 14** | React framework, SSR, routing | 14.x | Free |
| **TypeScript** | Type safety across entire codebase | 5.x | Free |
| **Tailwind CSS** | Styling | 3.x | Free |
| **Wagmi v2** | Ethereum wallet hooks for React | 2.x | Free |
| **Viem** | Low-level EVM interaction (replaces ethers.js) | 2.x | Free |
| **WalletConnect v2** | Multi-wallet QR connect | 2.x | Free (300 sessions/day) |
| **TanStack Query** | Server state, caching | 5.x | Free |

**Setup:**
```bash
npx create-next-app@latest defi_copilot --typescript --tailwind
cd defi_copilot
npm install wagmi viem @tanstack/react-query
npm install @web3modal/wagmi @walletconnect/web3wallet
```

---

## Backend

| Tool | Purpose | Cost |
|------|---------|------|
| **Node.js 20 LTS** | Runtime | Free |
| **Fastify 4** | HTTP server (2× faster than Express) | Free |
| **TypeScript** | Type safety | Free |
| **Zod** | Input validation and schema enforcement | Free |
| **BullMQ** | Job queues for price monitoring | Free |
| **Prisma** | Database ORM | Free |

**Setup:**
```bash
mkdir defi_copilot_api && cd defi_copilot_api
npm init -y
npm install fastify @fastify/cors fastify-plugin
npm install typescript ts-node @types/node
npm install bullmq ioredis prisma zod
```

---

## AI Layer

| Service | Role | Model | Cost |
|---------|------|-------|------|
| **Anthropic Claude** | Primary AI brain | claude-sonnet-4-5 | ~$3/1M tokens |
| **OpenAI GPT-4o** | Fallback if Claude is unavailable | gpt-4o | ~$5/1M tokens |

**Claude system prompt structure:**
```
You are DeFi Copilot, a non-custodial trading assistant.
Your job is to parse user trading intent and return structured JSON.

User portfolio context:
- Wallet: {wallet_address}
- Balances: {token_balances}
- Chain: {current_chain}

Rules:
1. Always return valid JSON matching the TradeIntent schema
2. Never suggest specific investments or give financial advice
3. If intent is unclear, ask one clarifying question
4. Always confirm amounts and tokens before building a transaction

Return format:
{
  "action": "swap|limit|stop_loss|dca|bridge|query|alert",
  "tokenIn": "ETH",
  "tokenOut": "USDC",
  "amountIn": "500",
  "trigger": null,
  "chain": "ethereum",
  "clarification_needed": false
}
```

**npm packages:**
```bash
npm install @anthropic-ai/sdk openai
```

---

## Trading APIs

### Swaps & Routing

| API | Use | Docs | Cost |
|-----|-----|------|------|
| **1inch API v6** | Best-price routing across 400+ liquidity sources on EVM | api.1inch.dev | Free (rate limited) |
| **Jupiter API v6** | Solana swap routing | quote-api.jup.ag | Free |
| **0x Protocol API** | Backup EVM aggregator | api.0x.org | Free tier |
| **Paraswap** | Third backup aggregator | apiv5.paraswap.io | Free |

**1inch swap example:**
```typescript
const quote = await fetch(
  `https://api.1inch.dev/swap/v6.0/1/swap?` +
  `src=${tokenIn}&dst=${tokenOut}&amount=${amount}` +
  `&from=${userAddress}&slippage=1`,
  { headers: { 'Authorization': `Bearer ${INCH_API_KEY}` } }
);
```

### Limit Orders & Automation

| Service | Use | Cost |
|---------|-----|------|
| **1inch Limit Order Protocol** | Pre-signed EVM limit orders | Free |
| **Gelato Network** | Automated execution (limit, stop-loss, DCA) | Pay per execution (~$0.01–0.05) |
| **Chainlink Automation** | Decentralized keeper network | LINK token fees |

### Cross-Chain Bridges

| Service | Use | Cost |
|---------|-----|------|
| **LI.FI SDK** | Bridge aggregator — finds best bridge route automatically | Free SDK |
| **Socket Protocol** | Backup bridge aggregator | Free |

```bash
npm install @lifi/sdk
```

---

## Blockchain Infrastructure

### RPC Nodes

| Provider | Chain | Free Tier | Paid |
|----------|-------|-----------|------|
| **Alchemy** | Ethereum, Base, Arbitrum, Polygon | 300M compute units/mo | $49+/mo |
| **Helius** | Solana | 100k requests/day | $49+/mo |
| **Infura** | Ethereum + L2s | 100k req/day | $50+/mo |

**Environment variables:**
```env
ALCHEMY_API_KEY=your_key_here
HELIUS_API_KEY=your_key_here
```

### Wallet & Account Abstraction

| Tool | Use | Cost |
|------|-----|------|
| **Wagmi + Viem** | Frontend wallet hooks | Free |
| **WalletConnect v2** | Multi-wallet support | Free (get key at cloud.walletconnect.com) |
| **Biconomy SDK** | ERC-4337 smart accounts for DCA/session keys | Per transaction |
| **Pimlico** | Bundler for ERC-4337 | Free tier |

### On-Chain Data

| Service | Use | Cost |
|---------|-----|------|
| **CoinGecko API** | Token prices, market data | Free / $129/mo Pro |
| **Chainlink Price Feeds** | On-chain price oracle for order triggers | Free (on-chain read) |
| **The Graph** | Query on-chain data via GraphQL | Free tier |
| **Alchemy Transfers API** | User's transaction history | Free (included) |

---

## Database & Storage

| Tool | Use | Cost |
|------|-----|------|
| **PostgreSQL** | Users, orders, alerts, preferences | Free |
| **Supabase** | Managed Postgres + realtime + auth | Free tier (500MB) |
| **Redis (Upstash)** | Price cache, rate limiting, sessions | Free tier |
| **BullMQ** | Background job queue (price watchers) | Free |

**Prisma schema example:**
```prisma
model Order {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "limit" | "stop_loss" | "dca"
  tokenIn     String
  tokenOut    String
  amountIn    String
  triggerPrice String?
  status      String   @default("watching") // watching | filled | cancelled
  signedTx    String?  // pre-signed transaction bytes
  createdAt   DateTime @default(now())
  filledAt    DateTime?
}

model Alert {
  id        String   @id @default(cuid())
  userId    String
  asset     String
  condition String   // "below" | "above"
  price     Float
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

---

## Notifications

| Service | Use | Cost |
|---------|-----|------|
| **Push Protocol** | Web3 push notifications (no email needed) | Free tier |
| **Resend** | Email notifications | Free (3k emails/mo) |
| **Alchemy Webhooks** | On-chain event triggers (tx confirmed) | Free |

---

## Hosting & DevOps

| Service | Use | Cost |
|---------|-----|------|
| **Vercel** | Frontend hosting (Next.js native) | Free / $20/mo Pro |
| **Railway** | Backend API hosting | $5+/mo |
| **Upstash** | Serverless Redis | Free tier |
| **Supabase** | Managed Postgres | Free tier |
| **GitHub Actions** | CI/CD pipeline | Free |
| **Cloudflare** | CDN, DDoS protection, custom domain | Free |

---

## Privacy Stack

| Tool | Use | When |
|------|-----|------|
| **Umbra Protocol** | Stealth addresses for transaction privacy | v1.0 |
| **Railgun SDK** | ZK-proof private swaps | v2.0 |
| **Fleek.xyz** | IPFS decentralized hosting | v2.0 |

---

## Security

| Practice | Implementation |
|----------|---------------|
| Private keys | Never touch our servers — user's wallet signs locally |
| API keys | Stored in environment variables, never in code |
| Input validation | Zod schemas on all API endpoints |
| Rate limiting | Fastify rate-limit plugin |
| HTTPS | Enforced on all endpoints |
| CORS | Whitelist only our domain |
| Audit | Smart contract audit before mainnet launch |

---

## Environment Variables

```env
# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Blockchain
ALCHEMY_API_KEY=
HELIUS_API_KEY=
WALLETCONNECT_PROJECT_ID=

# Trading APIs
ONEINCH_API_KEY=
ZEROX_API_KEY=

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Notifications
RESEND_API_KEY=
PUSH_PROTOCOL_PRIVATE_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
COINBASE_COMMERCE_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://defi-copilot.app
JWT_SECRET=
NODE_ENV=production
```

---

## Estimated Monthly Costs (Pre-Revenue)

| Service | Cost |
|---------|------|
| Alchemy (free tier) | $0 |
| Claude API (~50k calls) | ~$50 |
| Vercel (hobby) | $0 |
| Railway (backend) | $5 |
| Supabase (free tier) | $0 |
| Upstash Redis (free tier) | $0 |
| CoinGecko (free tier) | $0 |
| Resend (free tier) | $0 |
| Domain + SSL | $12/yr |
| **Total** | **~$55–80/month** |
