import { http, createConfig } from 'wagmi'
import { mainnet, base, arbitrum, polygon } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, base, arbitrum, polygon],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
  },
})
