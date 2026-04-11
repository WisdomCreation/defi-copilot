import axios from 'axios';

// Pyth price feed IDs for Hermes API
const PRICE_FEED_IDS = {
  'SOL/USD': 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'ETH/USD': 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'BTC/USD': 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'USDC/USD': 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
};

interface PriceData {
  symbol: string;
  price: number;
  confidence: number;
  timestamp: number;
}

export class PriceMonitor {
  private priceCache: Map<string, PriceData> = new Map();
  private cacheExpiry = 30000; // 30 seconds
  private pythEndpoint = 'https://hermes.pyth.network';

  constructor() {
    // Price monitor initialized
  }

  /**
   * Get current price for a trading pair
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.priceCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.price;
      }

      const priceData = await this.fetchPriceData(symbol);
      
      // Update cache
      this.priceCache.set(symbol, priceData);
      
      return priceData.price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      
      // Fallback to CoinGecko
      return this.getCoinGeckoPrice(symbol);
    }
  }

  /**
   * Fetch price data from Pyth Network
   */
  private async fetchPriceData(symbol: string): Promise<PriceData> {
    const feedId = PRICE_FEED_IDS[symbol as keyof typeof PRICE_FEED_IDS];
    
    if (!feedId) {
      throw new Error(`No price feed for ${symbol}`);
    }

    const response = await axios.get(
      `${this.pythEndpoint}/api/latest_price_feeds`,
      {
        params: {
          ids: [feedId],
        },
      }
    );

    const priceFeed = response.data[0];
    if (!priceFeed || !priceFeed.price) {
      throw new Error(`No price data for ${symbol}`);
    }

    // Pyth prices come with an exponent, calculate actual price
    const price = parseFloat(priceFeed.price.price) * Math.pow(10, priceFeed.price.expo);

    return {
      symbol,
      price,
      confidence: parseFloat(priceFeed.price.conf) * Math.pow(10, priceFeed.price.expo),
      timestamp: Date.now(),
    };
  }

  /**
   * Fallback: Get price from CoinGecko
   */
  private async getCoinGeckoPrice(symbol: string): Promise<number> {
    const coinGeckoIds: Record<string, string> = {
      'SOL/USD': 'solana',
      'ETH/USD': 'ethereum',
      'BTC/USD': 'bitcoin',
      'USDC/USD': 'usd-coin',
      'USDT/USD': 'tether',
    };

    const coinId = coinGeckoIds[symbol];
    if (!coinId) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price`,
      {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
        },
      }
    );

    const price = response.data[coinId]?.usd;
    if (!price) {
      throw new Error(`Failed to fetch price for ${symbol}`);
    }

    return price;
  }

  /**
   * Monitor price and execute callback when condition is met
   */
  async monitorPrice(
    symbol: string,
    condition: 'above' | 'below',
    targetPrice: number,
    callback: (currentPrice: number) => Promise<void>
  ): Promise<() => void> {
    const checkPrice = async () => {
      try {
        const currentPrice = await this.getPrice(symbol);
        
        const triggered =
          (condition === 'above' && currentPrice >= targetPrice) ||
          (condition === 'below' && currentPrice <= targetPrice);

        if (triggered) {
          console.log(
            `🎯 Price trigger: ${symbol} ${currentPrice} ${condition} ${targetPrice}`
          );
          await callback(currentPrice);
        }
      } catch (error) {
        console.error('Price monitoring error:', error);
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkPrice, 10000);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Get multiple prices at once
   */
  async getPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          prices[symbol] = await this.getPrice(symbol);
        } catch (error) {
          console.error(`Failed to get price for ${symbol}:`, error);
          prices[symbol] = 0;
        }
      })
    );

    return prices;
  }

  /**
   * Clear price cache
   */
  clearCache() {
    this.priceCache.clear();
  }
}

// Singleton instance
export const priceMonitor = new PriceMonitor();
