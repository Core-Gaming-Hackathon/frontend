/**
 * Chain definitions for EVM-compatible blockchains
 */
import { defineChain } from 'viem';

/**
 * Electroneum Testnet chain definition
 */
export const electrneumTestnet = defineChain({
  id: 5201420,
  name: 'Electroneum Testnet',
  network: 'electroneum_testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Electroneum',
    symbol: 'ETN',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/electroneum_testnet'],
    },
    public: {
      http: ['https://rpc.ankr.com/electroneum_testnet'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Electroneum Explorer',
      url: 'https://testnet-blockexplorer.electroneum.com',
    },
  },
  testnet: true,
});