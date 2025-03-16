/**
 * Mock EVM Service
 * 
 * Provides mock implementations of EVM wallet functionality for testing.
 */
import { mock } from 'bun:test';

// Interface for wallet connection result
export interface WalletConnectionResult {
  address: string;
  chainId?: number;
  isConnected: boolean;
}

// Interface for transaction result
export interface TransactionResult {
  hash: string;
  status: 'success' | 'pending' | 'failed';
}

/**
 * Mock EVM Service implementation
 */
export class MockEVMService {
  // Track connection state
  private connected: boolean = false;
  private address: string = '';
  private chainId: number = 1; // Default to Ethereum mainnet
  
  // Mock methods with implementations
  connectWallet = mock(async (): Promise<WalletConnectionResult> => {
    this.connected = true;
    this.address = '0x1234567890123456789012345678901234567890';
    return {
      address: this.address,
      chainId: this.chainId,
      isConnected: this.connected
    };
  });
  
  disconnectWallet = mock(async (): Promise<void> => {
    this.connected = false;
    this.address = '';
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getBalance = mock(async (_address?: string): Promise<string> => {
    return '100000000000000000'; // 0.1 ETH in wei
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signMessage = mock(async (_address: string, _message: string): Promise<string> => {
    return "0x1234567890abcdef";
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendTransaction = mock(async (_to: string, _value: string, _data: string): Promise<string> => {
    return "0x1234567890abcdef";
  });
  
  isConnected = mock((): boolean => {
    return this.connected;
  });
  
  getAddress = mock((): string => {
    return this.address;
  });
  
  getChainId = mock((): number => {
    return this.chainId;
  });
  
  switchChain = mock(async (chainId: number): Promise<boolean> => {
    this.chainId = chainId;
    return true;
  });
}

/**
 * Factory for creating EVM service instances
 */
export const EVMServiceFactory = {
  createService: (): MockEVMService => {
    return new MockEVMService();
  }
};

export default MockEVMService;