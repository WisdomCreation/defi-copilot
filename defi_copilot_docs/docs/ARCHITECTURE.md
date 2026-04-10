# System Architecture — DeFi Copilot

**Version:** 1.0

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐   ┌───────────────┐  │
│  │  Next.js UI  │    │   MetaMask   │   │ WalletConnect │  │
│  │  (React PWA) │    │   (signing)  │   │  (mobile)     │  │
│  └──────┬───────┘    └──────┬───────┘   └───────┬───────┘  │
└─────────┼──────────────────┼───────────────────┼───────────┘
          │ HTTPS             │ Local sign        │
          ▼                   │                   │
┌─────────────────────┐       │                   │
│   DEFI COPILOT API  │◄──────┘                   │
│   (Node.js/Fastify) │◄──────────────────────────┘
│                     │
│  ┌───────────────┐  │
│  │  AI Router    │  │   ──► Anthropic Claude API
│  │  (intent)     │  │   ──► OpenAI GPT-4o (fallback)
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │  Trade Engine │  │   ──► 1inch API (EVM swaps)
│  │  (routing)    │  │   ──► Jupiter API (Solana)
│  └───────────────┘  │   ──► LI.FI SDK (bridges)
│                     │
│  ┌───────────────┐  │
│  │  Order Watch  │  │   ──► Chainlink Price Feeds
│  │  (BullMQ)     │  │   ──► Gelato (auto-execute)
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │  Data Layer   │  │   ──► Alchemy (EVM RPC)
│  │  (reads)      │  │   ──► Helius (Solana RPC)
│  └───────────────┘  │   ──► CoinGecko (prices)
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │  PostgreSQL  │
    │  Redis       │
    └─────────────┘
```

---

## Request Lifecycle — Market Swap

```
User types: "Swap $500 ETH to USDC"
     │
     ▼
1. Frontend sends to /api/copilot
   { message: "Swap $500 ETH to USDC", walletAddress: "0x...", chain: "ethereum" }
     │
     ▼
2. Backend fetches wallet balances via Alchemy
   { ETH: "2.4", USDC: "1200", ... }
     │
     ▼
3. Claude API called with:
   - System prompt (role + rules)
   - User message
   - Portfolio context (balances)
   Returns: { action: "swap", tokenIn: "ETH", amountIn: "500", tokenOut: "USDC" }
     │
     ▼
4. Trade Engine calls 1inch API:
   GET /swap/v6.0/1/quote?src=ETH&dst=USDC&amount=500000000000000000
   Returns: { toAmount: "498720000", estimatedGas: 185000, protocols: [...] }
     │
     ▼
5. Backend builds transaction calldata (NOT broadcast yet)
   { to: "0x1inch_router", data: "0x...", gasLimit: 185000 }
     │
     ▼
6. Preview returned to frontend:
   { youSend: "0.154 ETH", youReceive: "498.72 USDC", gas: "$1.90", slippage: "0.3%" }
     │
     ▼
7. User clicks "Confirm" → Wagmi sends tx to MetaMask
   → MetaMask signs locally with private key
   → Signed tx broadcast to Ethereum mempool
     │
     ▼
8. Alchemy Webhook fires when tx confirms
   → Backend updates order status to "filled"
   → Push notification + email sent to user
```

---

## Request Lifecycle — Limit Order

```
User types: "Buy $1,000 SOL if it drops below $120"
     │
     ▼
1. Claude parses → { action: "limit", asset: "SOL", trigger: "< $120", amount: "$1000" }
     │
     ▼
2. Backend builds 1inch Limit Order struct:
   { makerAsset: USDC, takerAsset: SOL, makingAmount: 1000e6,
     takingAmount: 8333e9, predicate: "SOL_price < 120" }
     │
     ▼
3. Frontend sends unsigned order to user's wallet for signing
   → User signs in MetaMask (this is NOT a transaction — just a signature)
   → Signed bytes returned to backend
     │
     ▼
4. Backend stores in DB:
   { type: "limit", signedTx: "0x...", triggerPrice: 120, status: "watching" }
     │
     ▼
5. BullMQ price watcher job runs every 12 seconds:
   → Fetches SOL price from Chainlink
   → Checks all "watching" orders
   → SOL hits $119.80 → condition met
     │
     ▼
6. Backend broadcasts pre-signed tx to mempool
   → Swap executes atomically on-chain
   → SOL lands directly in user's wallet
   → User notified immediately
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  wallet      TEXT UNIQUE NOT NULL,
  email       TEXT,
  tier        TEXT DEFAULT 'free',  -- free | pro | elite
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Orders (limit, stop-loss, DCA)
CREATE TABLE orders (
  id            TEXT PRIMARY KEY,
  user_id       TEXT REFERENCES users(id),
  type          TEXT NOT NULL,     -- limit | stop_loss | dca | bridge
  token_in      TEXT NOT NULL,
  token_out     TEXT NOT NULL,
  amount_in     TEXT NOT NULL,
  trigger_price DECIMAL,
  signed_tx     TEXT,              -- pre-signed bytes
  status        TEXT DEFAULT 'watching',  -- watching | filled | cancelled
  chain         TEXT DEFAULT 'ethereum',
  tx_hash       TEXT,              -- filled transaction hash
  created_at    TIMESTAMP DEFAULT NOW(),
  filled_at     TIMESTAMP
);

-- Price Alerts
CREATE TABLE alerts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id),
  asset      TEXT NOT NULL,
  condition  TEXT NOT NULL,        -- above | below
  price      DECIMAL NOT NULL,
  triggered  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat History (for AI context)
CREATE TABLE messages (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id),
  role       TEXT NOT NULL,        -- user | assistant
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security Architecture

### What the AI can and cannot do

| Action | AI Can Do | AI Cannot Do |
|--------|-----------|-------------|
| Read wallet balances | ✓ (via RPC, public data) | |
| Build transaction calldata | ✓ (assembles bytes) | |
| Broadcast transactions | | ✗ (user must sign) |
| Access private keys | | ✗ (never) |
| Hold user funds | | ✗ (non-custodial) |
| Suggest investments | | ✗ (by policy) |

### Authentication Flow

```
1. User connects wallet (no password needed)
2. Backend issues a challenge message: "Sign this to prove wallet ownership"
3. User signs challenge in MetaMask (no gas cost — off-chain signature)
4. Backend verifies signature → issues JWT token (24h expiry)
5. All API requests authenticated with JWT
```

---

## Folder Structure

```
defi_copilot/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router pages
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   └── api/            # API routes (Next.js)
│   │   ├── components/         # React components
│   │   │   ├── chat/           # Copilot chat UI
│   │   │   ├── trade/          # Trade forms
│   │   │   ├── portfolio/      # Portfolio views
│   │   │   └── wallet/         # Wallet connect
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities, constants
│   │   └── public/             # Static assets
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   │   ├── copilot.ts  # AI chat endpoint
│       │   │   ├── trade.ts    # Trade building
│       │   │   ├── orders.ts   # Order management
│       │   │   └── portfolio.ts
│       │   ├── services/
│       │   │   ├── ai.ts       # Claude + GPT integration
│       │   │   ├── oneinch.ts  # 1inch API client
│       │   │   ├── jupiter.ts  # Jupiter API client
│       │   │   ├── lifi.ts     # LI.FI bridge client
│       │   │   ├── alchemy.ts  # RPC + webhooks
│       │   │   └── prices.ts   # Price feed service
│       │   ├── jobs/
│       │   │   ├── priceWatcher.ts    # Limit order monitor
│       │   │   └── dcaExecutor.ts     # DCA job runner
│       │   ├── db/
│       │   │   ├── schema.prisma
│       │   │   └── client.ts
│       │   └── index.ts        # Server entry point
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types, utils
│       ├── types/
│       │   └── trade.ts        # TradeIntent, Order types
│       └── utils/
│
├── docs/                       # This documentation
├── .env.example
├── package.json                # Monorepo root
└── turbo.json                  # Turborepo config
```
