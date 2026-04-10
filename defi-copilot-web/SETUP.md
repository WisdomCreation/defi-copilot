# 🚀 Copilot Setup Guide

## ✅ Already Configured

1. **Jupiter API**: ✅ Configured
2. **Claude API**: ✅ Configured  
3. **Public RPCs**: ✅ Using free public endpoints

## 📝 Current Configuration

### Frontend (.env.local)
```bash
NEXT_PUBLIC_JUPITER_API_KEY=jup_d665fe7b...
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_ETH_RPC=https://eth.llamarpc.com
```

### Backend (.env)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
JUPITER_API_KEY=jup_d665fe7b...
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## 🔧 Optional: Upgrade to Better RPC Providers

### For Solana (Recommended: Helius)

**Why?** Better rate limits (100k requests/day vs ~10k public)

1. Go to: **https://www.helius.dev/**
2. Sign up (Free)
3. Create a new project
4. Copy your RPC URL
5. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
   ```

### For Ethereum (Recommended: Alchemy)

**Why?** More reliable, better analytics

1. Go to: **https://www.alchemy.com/**
2. Sign up (Free)
3. Create App → Ethereum Mainnet
4. Copy HTTPS endpoint
5. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_ETH_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
   ```

---

## 🎯 Ready to Test!

### Start Frontend
```bash
cd /Users/hassanbashir/Desktop/Work/defi-copilot-web
npm run dev
```

### Start Backend (when ready)
```bash
cd /Users/hassanbashir/Desktop/Work/defi_copilot/apps/api
npm run dev
```

---

## 🧪 Test Swap

1. Connect wallet (MetaMask/Phantom)
2. Type: **"swap 0.1 ETH to USDC"**
3. Confirm in popup
4. Sign transaction
5. Done! ✅

---

## 📊 Free Tier Limits

| Provider | Free Tier | Enough For |
|----------|-----------|------------|
| **Public Solana RPC** | ~10k req/day | Testing |
| **Helius** | 100k req/day | Production (small) |
| **Alchemy** | 300M compute units | Production |
| **Jupiter API** | Unlimited* | Production |

*Rate limited but generous for normal usage

---

## 🆘 Troubleshooting

**"Rate limit exceeded"**
→ Upgrade to Helius/Alchemy (free tier)

**"Network error"**
→ Check RPC endpoints are correct

**"Insufficient funds"**
→ Make sure wallet has enough SOL/ETH for gas

**"Transaction failed"**
→ Check slippage settings (default 0.5%)
