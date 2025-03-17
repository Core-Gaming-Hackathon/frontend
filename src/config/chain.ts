/**
 * Chain definitions for EVM-compatible blockchains
 */
import { defineChain } from 'viem';

/**
 * CORE Testnet chain definition
 */
export const coreTestnet = defineChain({
  id: 1114,
  name: 'CORE Testnet',
  network: 'core_testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CORE',
    symbol: 'tCORE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test.btcs.network'],
    },
    public: {
      http: ['https://rpc.test.btcs.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'CORE Explorer',
      url: 'https://scan.test.btcs.network',
    },
  },
  testnet: true,
});