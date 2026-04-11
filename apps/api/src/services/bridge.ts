import { ChainId, getRoutes, type Route } from '@lifi/sdk';

// LI.FI will be initialized when needed

interface BridgeQuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  userAddress: string;
}

interface BridgeQuote {
  routes: Route[];
  estimatedTime: number;
  estimatedGas: string;
  bridgeName: string;
}

// Chain name to ID mapping
const CHAIN_IDS: Record<string, number> = {
  ethereum: ChainId.ETH,
  polygon: ChainId.POL,
  arbitrum: ChainId.ARB,
  optimism: ChainId.OPT,
  base: ChainId.BAS,
  solana: ChainId.SOL,
  bsc: ChainId.BSC,
  avalanche: ChainId.AVA,
};

export class BridgeService {
  /**
   * Get bridge quote for cross-chain swap
   */
  async getQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    const fromChainId = CHAIN_IDS[params.fromChain.toLowerCase()];
    const toChainId = CHAIN_IDS[params.toChain.toLowerCase()];

    if (!fromChainId || !toChainId) {
      throw new Error(`Unsupported chain: ${params.fromChain} or ${params.toChain}`);
    }

    try {
      const routesRequest = {
        fromChainId,
        toChainId,
        fromTokenAddress: params.fromToken,
        toTokenAddress: params.toToken,
        fromAmount: params.fromAmount,
        fromAddress: params.userAddress,
        toAddress: params.userAddress,
      };

      console.log('Getting LI.FI routes:', routesRequest);

      const routes = await getRoutes(routesRequest);

      if (!routes || routes.routes.length === 0) {
        throw new Error('No bridge routes found');
      }

      // Get the best route (first one is usually optimal)
      const bestRoute = routes.routes[0];

      return {
        routes: routes.routes,
        estimatedTime: bestRoute.steps.reduce((sum, step) => sum + step.estimate.executionDuration, 0),
        estimatedGas: bestRoute.gasCostUSD || '0',
        bridgeName: bestRoute.steps[0]?.tool || 'Unknown',
      };
    } catch (error: any) {
      console.error('Bridge quote error:', error);
      throw new Error(`Failed to get bridge quote: ${error.message}`);
    }
  }

  /**
   * Execute bridge transaction
   */
  async executeBridge(route: Route, userAddress: string): Promise<any> {
    try {
      // LI.FI provides the transaction data
      // The actual execution happens on the frontend with wallet signing
      const step = route.steps[0];
      
      if (!step) {
        throw new Error('No bridge step found');
      }

      return {
        to: (step.estimate as any).approvalAddress || (step.estimate as any).toAddress,
        data: step.transactionRequest?.data,
        value: step.transactionRequest?.value || '0',
        gasLimit: (step.estimate.gasCosts as any)?.[0]?.limit || '300000',
      };
    } catch (error: any) {
      console.error('Bridge execution error:', error);
      throw new Error(`Failed to execute bridge: ${error.message}`);
    }
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<string[]> {
    return Object.keys(CHAIN_IDS);
  }

  /**
   * Get bridge status
   */
  async getStatus(txHash: string, fromChain: string): Promise<any> {
    try {
      const fromChainId = CHAIN_IDS[fromChain.toLowerCase()];
      
      // Note: LI.FI has a status API but it requires additional setup
      // For now, we'll return a basic status structure
      return {
        status: 'pending',
        txHash,
        message: 'Bridge transaction submitted. Check block explorer for updates.',
      };
    } catch (error: any) {
      console.error('Bridge status error:', error);
      throw new Error(`Failed to get bridge status: ${error.message}`);
    }
  }
}

// Singleton instance
export const bridgeService = new BridgeService();
