# Product Specification — DeFi Copilot

**Version:** 1.0  
**Last updated:** April 2026  
**Status:** Pre-development

---

## 1. Product Vision

DeFi Copilot collapses five different DeFi applications into one conversational interface. A user should be able to do everything they need — swap, bridge, set limits, protect positions, track portfolio — by typing or speaking naturally.

**Target user:** Crypto-curious users with 0.5–5 ETH who hold assets but rarely trade on-chain because DeFi is too complicated.

**Secondary user:** Active DeFi traders who want faster execution and smarter routing without juggling multiple apps.

---

## 2. Core Features

### 2.1 Market Swap
Instantly swap one token for another at the best available price across 20+ DEXs.

**User says:** `"Swap $500 of my ETH to USDC"`

**What happens:**
1. AI parses: token in = ETH, token out = USDC, amount = $500
2. Backend queries 1inch API for best route
3. Preview shown: rate, slippage, gas, price impact
4. User clicks Confirm → MetaMask/wallet popup appears
5. User approves → transaction broadcasts on-chain
6. Confirmation shown with tx hash

**Supported pairs:** Any ERC-20 token on Ethereum, Base, Arbitrum + SPL tokens on Solana

---

### 2.2 Limit Order
Place a buy or sell order that executes automatically when a price condition is met.

**User says:** `"Buy $1,000 SOL if it drops below $120"`

**What happens:**
1. AI parses: action = limit buy, asset = SOL, trigger = price < $120, amount = $1,000 USDC
2. User signs the pre-signed order (1inch Limit Order Protocol)
3. Backend monitors Chainlink price feed every 12 seconds
4. When SOL hits $119.80 → transaction auto-broadcasts
5. User notified via push + email

**Supported:** Buy limits, sell limits, take-profit orders

---

### 2.3 Stop-Loss
Automatically sell a position if price falls to a specified level, protecting downside.

**User says:** `"Set a stop-loss on my SOL at $105"`

**What happens:**
1. AI identifies user's SOL balance from wallet
2. Pre-signed sell transaction prepared at $105 trigger
3. Gelato Network monitors price and executes
4. Position sold to USDC automatically

---

### 2.4 Dollar-Cost Averaging (DCA)
Automatically buy a fixed amount of an asset on a recurring schedule.

**User says:** `"Buy $100 of ETH every week for 12 weeks"`

**What happens:**
1. ERC-4337 session key created — authorizes up to $100/week spend
2. Each Monday, Gelato triggers the swap
3. User can cancel or pause anytime
4. Summary report after all 12 purchases

---

### 2.5 Cross-Chain Bridge
Move assets from one blockchain to another in one command.

**User says:** `"Move 500 USDC from Ethereum to Base"`

**What happens:**
1. LI.FI SDK finds cheapest + fastest bridge route
2. Preview: route, fee (~$3–5), estimated time (~4 min)
3. User signs once → bridge handles the rest
4. Funds arrive on Base, user notified

---

### 2.6 Portfolio Rebalance
Adjust portfolio allocations to hit target percentages.

**User says:** `"Rebalance to 60% ETH, 40% SOL"`

**What happens:**
1. AI reads current balances: e.g. 75% ETH, 25% SOL
2. Calculates required swaps to hit target
3. Finds cheapest route via 1inch
4. Shows preview of all trades needed
5. User signs batch transaction

---

### 2.7 Portfolio Intelligence
Natural language queries about portfolio status, PnL, and risk.

**Example queries:**
- `"What is my biggest position?"`
- `"What's my 7-day PnL?"`
- `"How much ETH do I have across all chains?"`
- `"Am I overexposed to one asset?"`
- `"What were my last 5 trades?"`

---

### 2.8 Price Alerts
Set price notifications without placing an order.

**User says:** `"Alert me when ETH drops below $3,000"`

**Delivery:** Browser push notification + email

---

### 2.9 Privacy Trading (Pro/Elite/Privacy Pro)
Execute trades with full transaction privacy using zero-knowledge proofs and stealth addresses.

**User says:** `"Swap $5,000 ETH to USDC privately"`

**What happens:**
1. AI routes through Railgun privacy protocol
2. Transaction amount, tokens, and recipient are hidden via zk-SNARKs
3. On-chain observers cannot see trade details
4. User maintains full custody and control
5. Fully legal and compliant (uses cryptography, not mixing)

**Privacy Levels:**
- **Basic (Pro tier):** Stealth addresses via Umbra Protocol
- **Advanced (Elite tier):** Full stealth address suite
- **Maximum (Privacy Pro tier):** ZK swaps + network privacy + MEV protection

**Use Cases:**
- High-net-worth individuals who don't want positions public
- Preventing MEV bots from front-running large trades
- Competitive traders who want strategy privacy
- Users in regions with security concerns

**Legal Compliance:**
- Uses zero-knowledge cryptography (legal globally)
- No mixing with other users' funds
- Compliant with AML/CFT regulations
- Excludes sanctioned protocols (no Tornado Cash)

---

### 2.10 Security Scanning (All Tiers)
AI automatically checks every contract and transaction for security risks before execution.

**User says:** `"Swap 100 USDC for NEW_TOKEN"`

**What happens:**
1. AI scans NEW_TOKEN contract via Forta Network
2. Checks for: rug pull risk, honeypot code, unusual permissions
3. Shows security score: Low Risk ✅ | Medium Risk ⚠️ | High Risk 🚫
4. Warns user if contract is suspicious
5. Prevents common scams automatically

**Value:** Protects users from losing funds to malicious contracts

---

## 3. User Flow — First Time

```
1. Land on defi-copilot.app
2. Click "Connect Wallet"
3. MetaMask / WalletConnect popup → approve
4. AI greets user: "Hi! I can see you have 2.4 ETH and 1,200 USDC.
   What would you like to do?"
5. User types their first command
6. AI responds with trade preview
7. User confirms in wallet
8. Done
```

**Time from landing to first trade: under 3 minutes.**

---

## 4. UI Structure

```
├── Dashboard          (portfolio overview, active orders, gas tracker)
├── Trade              (AI chat interface — primary interaction)
├── Orders             (active + historical orders)
├── Portfolio          (holdings, PnL, multi-chain view)
├── Alerts             (price alerts management)
└── Settings           (notifications, privacy, connected wallets)
```

---

## 5. Pricing Tiers

| Tier | Price | Features | Privacy Features |
|------|-------|----------|-----------------|
| Free | $0/mo | 5 swaps/month, Ethereum only, basic security scanning, community support | None |
| Pro | $29/mo | Unlimited swaps, limit orders, 5 chains, portfolio tracker, MEV protection, smart money alerts | 3 private swaps/month (Umbra) |
| Elite | $99/mo | All chains, DCA, tax reports, stop-loss, API access, priority support, advanced analytics | Unlimited private swaps, stealth addresses |
| Privacy Pro | $149/mo | All Elite features + full privacy suite, network anonymity, ZK private swaps, premium support | Railgun ZK swaps, HOPR network privacy, unlimited stealth addresses |

**Transaction fees:**
- Standard trades: 0.15% (all tiers)
- Private trades: 0.35% (Pro/Elite/Privacy Pro only)
- Privacy Premium: Higher fees for advanced privacy features compensate for additional infrastructure costs

**Privacy Features Explained:**
- **Stealth Addresses (Umbra):** One-time addresses prevent transaction linking
- **ZK Swaps (Railgun):** Zero-knowledge proofs hide trade amounts and tokens
- **Network Privacy (HOPR):** Hides your IP address and metadata during trades

---

## 6. Non-Negotiable Constraints

- **Non-custodial:** Private keys never leave user devices. Ever.
- **User signs every transaction:** AI prepares, user approves. No exceptions.
- **No mixing protocols:** Tornado Cash and similar services are strictly excluded.
- **Transparent fees:** All fees shown before confirmation. No hidden charges.
- **No financial advice:** AI provides execution assistance, not investment recommendations.

---

## 7. Success Metrics

| Metric | Month 3 Target | Month 6 Target | Notes |
|--------|---------------|----------------|-------|
| Registered users | 500 | 2,000 | Includes all free tier users |
| Active monthly users | 100 | 600 | Completed ≥1 trade in 30 days |
| Monthly trading volume | $500k | $5M | Standard + private trades |
| Private trade volume | $50k (10%) | $750k (15%) | Privacy feature adoption |
| MRR | $3k | $25k+ | Includes Privacy Pro tier |
| NPS score | >40 | >55 | User satisfaction benchmark |
| Avg trades per user/month | 5 | 10 | Higher for privacy users (15-20) |
| Privacy Pro subscribers | 0 | 10-15 | $149/mo tier, high-value users |

**Revenue Breakdown (Month 6):**
- Transaction fees (0.15%): $7,500 from $5M volume
- Privacy premium fees (0.35%): $2,625 from $750K private volume
- Pro subscriptions: 200 users × $29 = $5,800
- Elite subscriptions: 60 users × $99 = $5,940
- Privacy Pro subscriptions: 10 users × $149 = $1,490
- **Total MRR: ~$23,355** (on track for $25K target)
