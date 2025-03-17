/**
 * Chain Selector
 * 
 * Handles selection and management of blockchain networks
 */

// Use environment variable for RPC URL with fallback
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.test2.btcs.network";

export const CHAIN_CONFIGS = {
  "core-testnet": {
    chainId: 1114,
    name: "Core Blockchain Testnet",
    rpcUrl: RPC_URL,
    blockExplorerUrl: "https://scan.test2.btcs.network",
    nativeCurrency: {
      name: "tCORE2",
      symbol: "tCORE2",
      decimals: 18
    },
    predictionMarketContract: "0xC44DE09ab7eEFC2a9a2116E04ca1fcEc86F520fF",
    gameModesContract: "0xf5250dD966e3ef10bbBb08878AdBB063d3879B57" // Updated BaultroGames address
  }
} as const;

/**
 * Chain Selector - Manages available chains and current selection
 */
export class ChainSelector {
  private activeChain: keyof typeof CHAIN_CONFIGS = "core-testnet";

  getActiveChain() {
    return CHAIN_CONFIGS[this.activeChain];
  }

  getActiveChainId(): number {
    return CHAIN_CONFIGS[this.activeChain].chainId;
  }

  getPredictionMarketAddress(): string {
    return CHAIN_CONFIGS[this.activeChain].predictionMarketContract;
  }
  
  getGameModesAddress(): string {
    return CHAIN_CONFIGS[this.activeChain].gameModesContract || "";
  }

  getBlockExplorerUrl(): string {
    return CHAIN_CONFIGS[this.activeChain].blockExplorerUrl;
  }

  getRpcUrl(): string {
    return CHAIN_CONFIGS[this.activeChain].rpcUrl;
  }

  isTestnet(): boolean {
    return true; // Always true since we only support Core Blockchain Testnet (1114)
  }
}

export const chainSelector = new ChainSelector();
export default chainSelector;