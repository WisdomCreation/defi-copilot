# Privacy & Anonymity — DeFi Copilot

**Version:** 1.0

---

## Design Philosophy

DeFi Copilot is built non-custodial by design. This is our strongest privacy guarantee — because we never hold funds, we have minimal user data obligations. We enhance privacy further with optional features, but we never compromise legal compliance.

---

## What We Store vs What We Don't

| Data | Do We Store? | Notes |
|------|-------------|-------|
| Private keys | NEVER | Stored only in user's wallet (MetaMask etc.) |
| Seed phrases | NEVER | Never requested, never transmitted |
| Funds | NEVER | Non-custodial — funds always in user's wallet |
| Wallet address | Yes | Required to read balances and build transactions |
| Trade history | Yes | Pulled from on-chain (public data) |
| Email address | Optional | Only if user provides for notifications |
| IP addresses | No | Not logged |
| Chat messages | Session only | Not persisted after session ends (unless user opts in) |

---

## Privacy Features — v1.0

### No-KYC by Default
Because we are non-custodial (user signs their own transactions), we do not require KYC for basic trading. Users connect a wallet address — that is all the identity we need. This is legally sound because we are a tool, not a custodian.

### No IP Logging
Our backend does not log IP addresses in production. Cloudflare sits in front of our infrastructure and handles DDoS protection without passing IPs to our servers.

### Minimal Data Collection
We only collect what is strictly necessary to provide the service. We do not sell data. We do not use data for advertising.

---

## Privacy Features — v1.5 (Stealth Addresses)

**Implementation:** Umbra Protocol SDK  
**Legal status:** Fully legal in all jurisdictions  
**Complexity:** Medium

Stealth addresses generate a unique, one-time address for each transaction. An outside observer cannot link multiple transactions to the same underlying wallet. From the user's perspective, it is invisible — the copilot handles it automatically.

```typescript
import { UmbraSDK } from '@umbra/sdk'

const umbra = new UmbraSDK(provider)

// Generate stealth address for recipient
const { stealthAddress, ephemeralKey } = await umbra.generateStealthAddress(recipientPublicKey)

// Send to stealth address instead of real address
// Recipient can later scan and claim using their private key
await umbra.send(signer, token, amount, recipientPublicKey)
```

**User experience:** "Enable private transactions" toggle in Settings.

---

## Privacy Features — v2.0 (ZK Private Swaps)

**Implementation:** Railgun Protocol SDK  
**Legal status:** Legal (uses zero-knowledge proofs, not mixing)  
**Complexity:** High

Railgun allows private ERC-20 transfers and swaps. Transaction amounts and counterparties are hidden using zk-SNARKs. The protocol is fully audited and used by privacy-focused legitimate users.

```typescript
import { RailgunSDK } from '@railgun-community/sdk'

// Shield tokens (move into private balance)
await railgun.shieldTokens(wallet, [{ tokenAddress, amount }])

// Private swap
await railgun.swapPrivate({ tokenIn, tokenOut, amount, slippage })

// Unshield tokens (move back to public wallet)
await railgun.unshieldTokens(wallet, [{ tokenAddress, amount }])
```

---

## Decentralized Hosting — v2.0

**Service:** Fleek.xyz  
**Why:** If our primary domain is seized or censored, users can always access the app via its IPFS content hash.

```bash
# Deploy to IPFS via Fleek
npx fleek sites init
npx fleek sites deploy

# App accessible at:
# https://defi-copilot.app (primary)
# https://ipfs.io/ipfs/QmXxx... (censorship-resistant fallback)
```

---

## What We Explicitly Do NOT Support

The following are excluded and will never be added:

- **Tornado Cash** or any OFAC-sanctioned mixing protocol
- **Any tool that breaks AML/CFT regulations**
- **Custodial fund holding** — we never control user funds
- **KYC circumvention tools** — we do not help users evade legitimate regulatory requirements

---

## Legal Position

DeFi Copilot operates as a **software tool**, not a financial institution or money transmitter. Our legal footing:

1. **Non-custodial:** We never hold, transmit, or control user funds. Users sign their own transactions.
2. **No money transmission:** We build transaction calldata, but do not broadcast without user approval.
3. **No financial advice:** The AI provides execution assistance only, not investment recommendations.
4. **Public data only:** All on-chain data we read is publicly available on the blockchain.

**Recommended:** Consult a crypto-specialized attorney in your jurisdiction before launch, particularly regarding the classification of limit order automation.
