# Sprint Plan — DeFi Copilot

**Format:** 1-week sprints  
**Standup:** Daily async (Slack/Discord)  
**Sprint review:** Every Friday

---

## SPRINT 1 — Week 1: Project Setup & Skeleton
**Goal:** Everyone can run the project locally

### Tasks

#### Infrastructure
- [ ] Create GitHub monorepo at `/Users/hassanbashir/Desktop/Work/defi_copilot`
- [ ] Set up Turborepo monorepo (apps/web + apps/api + packages/shared)
- [ ] Configure ESLint, Prettier, TypeScript strict mode
- [ ] Set up GitHub Actions CI (lint + type-check on every PR)
- [ ] Create `.env.example` with all required keys listed

#### Frontend (apps/web)
- [ ] Initialize Next.js 14 with App Router + TypeScript + Tailwind
- [ ] Install Wagmi v2 + Viem + TanStack Query
- [ ] Install WalletConnect Web3Modal
- [ ] Create basic layout: nav, sidebar, main content area
- [ ] Wallet connect button — MetaMask + WalletConnect working

#### Backend (apps/api)
- [ ] Initialize Fastify + TypeScript
- [ ] Set up Prisma with PostgreSQL (Supabase)
- [ ] Create health check endpoint: `GET /health`
- [ ] Set up Redis connection (Upstash)
- [ ] Deploy to Railway (staging environment)

#### API Keys to obtain this week
- [ ] Alchemy: alchemy.com → create app → get API key
- [ ] Anthropic Claude: console.anthropic.com → get API key
- [ ] WalletConnect: cloud.walletconnect.com → create project ID
- [ ] 1inch: api.1inch.dev → get API key
- [ ] Supabase: supabase.com → create project → get DATABASE_URL
- [ ] Upstash: upstash.com → create Redis DB → get REDIS_URL

**Sprint 1 done when:** `npm run dev` starts both apps, wallet connects, health check returns 200.

---

## SPRINT 2 — Week 2: AI Layer + Quote Engine
**Goal:** Type a command, get a real quote back

### Tasks

#### AI Integration
- [ ] Create `/api/copilot` POST endpoint
- [ ] Integrate Anthropic SDK — Claude Sonnet
- [ ] Write system prompt (role, rules, JSON schema)
- [ ] Define `TradeIntent` TypeScript type (shared package)
- [ ] Test: "swap 0.1 ETH to USDC" returns correct JSON
- [ ] Test: "buy $500 SOL" returns correct JSON
- [ ] Test: "what is my ETH balance?" returns query intent
- [ ] Add GPT-4o fallback if Claude returns error

#### 1inch Integration
- [ ] Create `services/oneinch.ts`
- [ ] `getQuote(tokenIn, tokenOut, amount, chain)` function
- [ ] `getSwapCalldata(quote, userAddress)` function
- [ ] Test quote for ETH → USDC on mainnet
- [ ] Handle errors: insufficient liquidity, unsupported token

#### Wallet Balance Reading
- [ ] Create `services/alchemy.ts`
- [ ] `getTokenBalances(walletAddress)` — fetch all ERC-20 balances
- [ ] `getNativeBalance(walletAddress)` — fetch ETH balance
- [ ] Pass balances to Claude system prompt as context

#### Frontend
- [ ] Build chat UI component (message bubbles, input, send)
- [ ] Wire chat to `/api/copilot` endpoint
- [ ] Display quote preview card (you send / you receive / gas)

**Sprint 2 done when:** User can type "swap 0.1 ETH to USDC" and see a real price quote in the UI.

---

## SPRINT 3 — Week 3: Full Swap Execution
**Goal:** Real money moves on testnet, then mainnet

### Tasks

#### Transaction Execution
- [ ] Frontend: "Confirm" button calls Wagmi `writeContract`
- [ ] Pass calldata from 1inch to Wagmi transaction
- [ ] Handle transaction pending state (spinner + tx hash link)
- [ ] Handle transaction success (confirmation card)
- [ ] Handle transaction failure (error message + retry)

#### On-chain Confirmation
- [ ] Set up Alchemy Webhook for wallet address
- [ ] `POST /webhooks/alchemy` endpoint — receives tx events
- [ ] Update order status in DB when tx confirms
- [ ] Send confirmation email via Resend

#### Testnet Testing
- [ ] Test full flow on Sepolia testnet (get test ETH from faucet)
- [ ] Fix any issues found in testing
- [ ] Test on mainnet with $10 real swap

#### Error Handling
- [ ] Slippage exceeded → friendly error message
- [ ] Insufficient gas → show gas estimate warning
- [ ] Network congestion → suggest waiting

#### UI Polish
- [ ] Transaction history list in dashboard
- [ ] Gas tracker widget (shows current gwei)
- [ ] Token selector with search

**Sprint 3 done when:** Full swap works on Ethereum mainnet. Team can swap real tokens.

---

## SPRINT 4 — Week 4: Portfolio Dashboard + Limit Orders
**Goal:** Dashboard is useful, first automated order type works

### Tasks

#### Portfolio Dashboard
- [ ] Multi-token balance display with USD values
- [ ] 24h price change per token (CoinGecko API)
- [ ] Total portfolio value in USD
- [ ] Simple allocation bar chart
- [ ] Recent transactions list

#### Limit Orders (Phase 1)
- [ ] 1inch Limit Order Protocol integration
- [ ] Build unsigned limit order struct
- [ ] Frontend: user signs order (off-chain signature, no gas)
- [ ] Store signed bytes + trigger in DB
- [ ] BullMQ job: `priceWatcher` — runs every 12 seconds
- [ ] Fetch SOL/ETH prices from CoinGecko every 30 seconds → cache in Redis
- [ ] When trigger price hit → broadcast pre-signed tx

#### Price Alerts
- [ ] `POST /alerts` — create alert
- [ ] Alert checker runs alongside price watcher job
- [ ] Email notification via Resend when triggered

**Sprint 4 done when:** Limit order is set, price drops (tested on testnet), order auto-fills.

---

## SPRINT 5 — Week 5: Multi-Chain + Beta Prep
**Goal:** Add Solana and Base, prepare for 100 beta users

### Tasks

#### Solana Support
- [ ] Install `@solana/web3.js` + Helius RPC
- [ ] Jupiter API v6 integration for Solana swaps
- [ ] Phantom wallet support via Wagmi (or direct adapter)
- [ ] Test SOL → USDC swap on Solana mainnet

#### Base Chain
- [ ] Add Base to Alchemy config
- [ ] Test swaps on Base (same 1inch API, different chain ID)
- [ ] Bridge: LI.FI SDK for Ethereum → Base

#### Beta User Prep
- [ ] Onboarding flow: 3-step wizard (connect → see balance → first trade)
- [ ] Error logging: Sentry integration
- [ ] Basic analytics: PostHog (pageviews, trade events)
- [ ] User feedback widget (simple thumbs up/down after each trade)
- [ ] Documentation: user-facing FAQ page

**Sprint 5 done when:** App works on Ethereum, Solana, and Base. 10 external beta testers invited.

---

## SPRINT 6 — Week 6: Billing + Stop-Loss
**Goal:** First paying customers, stop-loss working

### Tasks

#### Subscription Billing
- [ ] Stripe integration — create subscription products (Pro $29, Elite $99)
- [ ] Stripe webhook: update user tier on payment
- [ ] Feature gating: free tier limited to 5 swaps/month
- [ ] Upgrade prompt when free limit hit
- [ ] Coinbase Commerce for crypto payments

#### Stop-Loss
- [ ] Extend limit order system for stop-loss (sell trigger)
- [ ] UI: "Protect my position" flow
- [ ] Test: set stop-loss, price drops, position auto-sold
- [ ] SMS/push notification when stop-loss fires (critical alert)

#### Beta Launch (100 users)
- [ ] Send invites to waitlist / personal network
- [ ] Monitor for errors in Sentry
- [ ] Daily check: Supabase dashboard, Railway logs
- [ ] Create `#feedback` channel for beta users

**Sprint 6 done when:** First paying subscriber. 50+ beta users active. Stop-loss works on mainnet.

---

## SPRINT 7 — Week 7: Polish + 100 User Target
**Goal:** Hit 100 users, fix feedback from beta

### Tasks

- [ ] Fix top 5 bugs from beta feedback
- [ ] Improve AI response quality (prompt tuning based on real usage)
- [ ] Mobile PWA: add to home screen experience
- [ ] Push notifications via Push Protocol
- [ ] Performance: reduce page load to < 2s
- [ ] Referral program: "Invite a friend, get 1 month free"
- [ ] Twitter/Discord presence for community

**Sprint 7 done when:** 100 registered users. $500 MRR. NPS survey sent.

---

## SPRINT 8–10 — Weeks 8–10: DCA + Rebalancing + Growth
**Goal:** Power user features, $5k MRR

### Sprint 8: DCA
- [ ] Gelato Network integration for recurring execution
- [ ] ERC-4337 session key for DCA authorization
- [ ] UI: "Buy $100 ETH every week for 12 weeks" flow
- [ ] DCA progress tracker in portfolio view

### Sprint 9: Rebalancing + Tax Reports
- [ ] Portfolio rebalance: AI calculates required swaps
- [ ] Batch transaction execution
- [ ] Tax report: CSV export with all trades, cost basis, PnL
- [ ] Elite tier unlocked and marketed

### Sprint 10: Growth Push
- [ ] Product Hunt launch preparation
- [ ] SEO: landing page optimized, blog posts
- [ ] Partner integrations: list in DeFi directories
- [ ] Affiliate program live
- [ ] Investor update deck updated with metrics

---

## Daily Standup Template

```
## [Date] Standup

**Yesterday:**
- [What was completed]

**Today:**
- [What will be worked on]

**Blockers:**
- [Anything blocking progress]

**Metrics check:**
- Users: X
- MRR: $X
- Trades today: X
- Errors: X
```

---

## Weekly Review Template (Every Friday)

```
## Sprint [N] Review — [Date]

### Completed
- [x] Task 1
- [x] Task 2

### Carried Over
- [ ] Task 3 (reason: ...)

### Metrics
- Users: X → Y (+Z%)
- MRR: $X → $Y
- Key trades: X executed, $Y volume

### What worked
- ...

### What to improve
- ...

### Next sprint focus
- ...
```
