# Milestones — DeFi Copilot

**Timeline:** 6 months from kick-off  
**Kick-off date:** April 2026

---

## Milestone Overview

```
Month 1-2  │  Month 3-4  │  Month 5  │  Month 6
───────────┼─────────────┼──────────┼──────────
   M1 & M2 │   M3 & M4   │    M5    │    M6
  Core MVP  │  Beta + $   │  Launch  │  Growth
```

---

## M1 — Foundation (Weeks 1–3)
**Goal:** Codebase running, wallet connects, AI responds

### Deliverables
- [ ] Monorepo initialized with Next.js + Fastify
- [ ] Wallet connection working (MetaMask + WalletConnect)
- [ ] Claude API integrated — parses plain English to trade intent
- [ ] 1inch API integrated — swap quotes returning
- [ ] Basic chat UI functional
- [ ] Environment setup documented for full team
- [ ] GitHub repo with CI/CD pipeline

### Definition of Done
A developer can connect their wallet and type "swap 0.1 ETH to USDC" and receive a valid price quote back in the chat interface.

### Key Risks
- WalletConnect integration complexity → mitigation: use Wagmi which abstracts this
- 1inch API rate limits → mitigation: get API key early (api.1inch.dev)

---

## M2 — MVP (Weeks 4–7)
**Goal:** Full swap flow working end-to-end on testnet, then mainnet

### Deliverables
- [ ] Full swap flow: AI parse → quote → preview → sign → broadcast → confirm
- [ ] Transaction confirmation UI with on-chain status
- [ ] Portfolio dashboard showing real wallet balances
- [ ] Basic limit order (pre-signed, price watcher job)
- [ ] Price alerts (UI + email notification via Resend)
- [ ] Deployed to Vercel + Railway (production URLs live)
- [ ] Tested on Ethereum mainnet with real funds (team internal)
- [ ] 10 internal beta testers onboarded

### Definition of Done
Any team member can go to the live URL, connect their wallet, and complete a real swap on Ethereum mainnet within 3 minutes.

### Key Risks
- Limit order price watcher missing trigger → mitigation: use Chainlink on-chain oracle as source of truth
- Gas estimation errors → mitigation: add 20% buffer, let user override

---

## M3 — Beta Launch (Weeks 8–10)
**Goal:** 100 real users, first revenue

### Deliverables
- [ ] Stop-loss orders implemented
- [ ] Solana support (Jupiter routing + Helius RPC)
- [ ] Base chain support (Alchemy Base)
- [ ] Cross-chain bridge (LI.FI SDK)
- [ ] Pro tier billing via Stripe ($29/mo)
- [ ] Crypto billing via Coinbase Commerce
- [ ] Onboarding flow polished (< 3 min first trade)
- [ ] 100 beta users invited (Discord/Twitter/personal network)
- [ ] Support channel active (Telegram or Discord)
- [ ] Analytics dashboard (Mixpanel or PostHog)

### Definition of Done
100 users have completed at least one trade. First $500 in subscription revenue collected.

### Metrics Target
- 100 registered users
- 30 active (completed ≥1 trade)
- $500 MRR
- 0 critical bugs open

---

## M4 — Growth Features (Weeks 11–14)
**Goal:** Expand to power users, increase retention

### Deliverables
- [ ] DCA (dollar-cost averaging) — Gelato automation
- [ ] Portfolio rebalancing
- [ ] Tax report export (CSV of all trades with cost basis)
- [ ] Elite tier ($99/mo) with API access
- [ ] Multi-wallet support (manage 2+ wallets in one account)
- [ ] Mobile PWA install experience polished
- [ ] Push notifications (Push Protocol)
- [ ] Transaction history with PnL tracking
- [ ] Referral program (give 1 month free, get $10 credit)

### Definition of Done
500 registered users. $5k MRR. Feature parity with top manual DeFi tools.

### Metrics Target
- 500 registered users
- 150 active monthly
- $5k MRR
- NPS > 40

---

## M5 — Scale (Weeks 15–18)
**Goal:** Public launch, press, growth

### Deliverables
- [ ] Public launch (Product Hunt, Twitter, crypto press)
- [ ] Arbitrum + Polygon support
- [ ] Stealth addresses (Umbra Protocol) for privacy
- [ ] Voice commands (GPT-4o audio API)
- [ ] Affiliate / partner program
- [ ] Landing page conversion optimized
- [ ] Security audit initiated
- [ ] IPFS deployment via Fleek (censorship resistant)

### Definition of Done
2,000 registered users. $15k MRR. Press coverage in at least 2 crypto publications.

---

## M6 — Revenue (Week 19–24)
**Goal:** $25k MRR, sustainable business

### Deliverables
- [ ] $25k MRR achieved
- [ ] B2B API tier for developers building on DeFi Copilot
- [ ] Security audit completed
- [ ] Mobile app (React Native) development started
- [ ] Expansion planning: new chains, new order types
- [ ] Seed funding pitch preparation (if pursuing VC)

### Metrics Target
- 2,000+ registered users
- 600+ active monthly
- $25k MRR
- $5M monthly trading volume routed

---

## Milestone Summary Table

| Milestone | End Date | Key Outcome | MRR Target |
|-----------|----------|-------------|------------|
| M1 — Foundation | Week 3 | Wallet + AI + quote working | $0 |
| M2 — MVP | Week 7 | Full swap on mainnet | $0 |
| M3 — Beta | Week 10 | 100 users, first revenue | $500 |
| M4 — Growth features | Week 14 | 500 users, power features | $5k |
| M5 — Public launch | Week 18 | 2,000 users, press | $15k |
| M6 — Revenue | Week 24 | Sustainable business | $25k |
