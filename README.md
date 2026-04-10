# DeFi Copilot

AI-powered DeFi assistant with natural language trading on Solana.

## Features

- 🤖 Natural language swap commands
- 💰 Real-time price quotes (CoinGecko + Binance)
- 🔄 Jupiter DEX aggregation
- 👛 Phantom wallet integration
- ✅ Complete transaction flow

## Tech Stack

**Frontend:**
- Next.js 14
- React 18
- Tailwind CSS
- Phantom Wallet Adapter

**Backend:**
- Fastify
- OpenAI GPT-4
- Jupiter API
- Solana Web3.js

## Environment Variables

### Frontend (`defi-copilot-web/.env.local`)
```env
NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Backend (`apps/api/.env`)
```env
OPENAI_API_KEY=your_openai_key
JUPITER_API_KEY=your_jupiter_key
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=your_helius_key
```

## Local Development

```bash
# Install dependencies
npm install

# Run backend
cd apps/api
npm run dev

# Run frontend (in another terminal)
cd defi-copilot-web
npm run dev
```

## Deployment

**Frontend:** Vercel (deployed from `/defi-copilot-web`)

**Backend:** Railway/Render (deployed from `/apps/api`)

## Usage

```
swap 0.01 sol to usdc on solana
```

The AI understands natural language and executes swaps through your Phantom wallet!

## License

MIT
