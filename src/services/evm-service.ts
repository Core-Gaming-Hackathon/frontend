/**
 * EVM blockchain service for interacting with EVM-compatible chains
 */
import { getConfig } from '@/config/evm';
import { 
  TransactionStatus, 
  TransactionType,
  BlockchainTransactionRequest,
  BlockchainTransactionResponse
} from '@/schemas/blockchain'; 
import { evmWallet, ContractAbi, TransactionResponse } from '@/config/evm-wallet';
import baultroFinalAbi from '@/abis/BaultroFinal.json';
import baultroGamesAbi from '@/abis/BaultroGames.json';
import type { Abi } from 'viem';

// Contract artifact interface
interface ContractArtifact {
  abi: ContractAbi;
  [key: string]: unknown;
}

/**
 * Service for EVM blockchain interactions
 */
export class EVMService {
  private static instance: EVMService;
  private config = getConfig();

  /**
   * Get singleton instance
   */
  public static getInstance(): EVMService {
    if (!EVMService.instance) {
      EVMService.instance = new EVMService();
    }
    return EVMService.instance;
  }

  /**
   * Connect to wallet
   */
  async connectWallet(): Promise<boolean> {
    return await evmWallet.connectWallet();
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<boolean> {
    return await evmWallet.signOut();
  }

  /**
   * Execute a blockchain transaction
   */
  async executeTransaction<T = unknown>(
    request: BlockchainTransactionRequest<T>
  ): Promise<BlockchainTransactionResponse> {
    if (!this.isWalletConnected()) {
      throw new Error('Wallet not connected');
    }

    try {
      // Determine contract address
      const contractAddress = this.getContractAddress(request.contract);

      // Convert request args to array format expected by the contract
      const args = request.method ? this.convertArgsToArray(request.method, request.args || {}) : [];

      // Calculate value (if any)
      const value = request.deposit ? BigInt(request.deposit) : BigInt(0);

      // Execute transaction
      const result = await evmWallet.callMethod(
        contractAddress,
        this.getContractAbi(request.contract),
        request.method || '',
        args,
        value
      );

      // Check transaction status
      if (!result.success) {
        throw new Error(result.errorMessage || 'Transaction failed');
      }

      return {
        txHash: result.hash,
        status: TransactionStatus.SUCCESS,
        type: request.type,
        blockHeight: 0, // Will be populated by transaction monitor
        gasUsed: '0', // Will be populated by transaction monitor
        timestamp: Date.now(),
        data: null
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Call a view method on a contract
   */
  async callViewMethod<T = unknown>(
    methodName: string,
    args: Record<string, unknown> = {},
    contractName: string = 'predictionMarket'
  ): Promise<T> {
    try {
      const contractAddress = this.getContractAddress(contractName);
      const abi = this.getContractAbi(contractName);
      const formattedArgs = this.convertArgsToArray(methodName, args);

      return await this.callContractViewMethod<T>(
        contractAddress,
        abi,
        methodName,
        formattedArgs
      );
    } catch (error) {
      console.error(`Error calling view method ${methodName}:`, error);
      throw error;
    }
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return evmWallet.isConnected();
  }

  /**
   * Get connected wallet address
   */
  getConnectedWallet(): string | null {
    return evmWallet.getAddress();
  }

  /**
   * Manually set connected wallet (for synchronizing state)
   */
  setConnectedWallet(address: string): void {
    // This is just for state management - not actually connecting
    if (evmWallet.isConnected() && evmWallet.getAddress() !== address) {
      console.warn('Connected address mismatch');
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.isWalletConnected() ? 'connected' : 'disconnected';
  }

  /**
   * Get provider
   */
  getProvider(): 'evm' {
    return 'evm';
  }

  /**
   * Get contract address by name
   */
  private getContractAddress(contractName?: string): string {
    if (!contractName) {
      return this.config.predictionMarketContract;
    }

    switch (contractName) {
      case 'predictionMarket':
        return this.config.predictionMarketContract;
      case 'gameModesContract':
        return this.config.gameModesContract;
      default:
        return contractName; // Assume contractName is the address if not recognized
    }
  }

  /**
   * Get contract ABI by name
   */
  private getContractAbi(contractName?: string): Abi {
    // Make sure we're properly typing the ABIs to match the expected Abi type
    if (!contractName) {
      return baultroFinalAbi.abi as unknown as Abi;
    }

    switch (contractName) {
      case 'predictionMarket':
        return baultroFinalAbi.abi as unknown as Abi;
      case 'gameModesContract':
        return baultroGamesAbi.abi as unknown as Abi;
      default:
        return baultroFinalAbi.abi as unknown as Abi;
    }
  }

  /**
   * Convert object args to array format for contract calls
   */
  private convertArgsToArray(methodName: string, args: Record<string, unknown> | unknown[]): unknown[] {
    // If args is already an array, return as is
    if (Array.isArray(args)) {
      return args;
    }

    // If no args, return empty array
    if (!args) {
      return [];
    }

    // Return object values as array
    return Object.values(args);
  }
  
  /**
   * Create a new prediction
   */
  async createPrediction(title: string, description: string, options: string[], stake: string): Promise<{ success: boolean, predictionId?: number, error?: string }> {
    try {
      const result = await this.executeTransaction({
        type: TransactionType.PREDICTION_CREATE,
        contract: 'predictionMarket',
        method: 'createPrediction',
        args: [title, description, options],
        deposit: stake,
      });
      
      return {
        success: true,
        predictionId: parseInt(result.txHash.slice(-8), 16) % 1000000, // Mock ID for demo
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Place a bet on a prediction
   */
  async placeBet(predictionId: number, optionId: number, amount: string): Promise<{ success: boolean, txHash?: string, error?: string }> {
    try {
      const result = await this.executeTransaction({
        type: TransactionType.PREDICTION_BET,
        contract: 'predictionMarket',
        method: 'placeBet',
        args: [predictionId, optionId],
        deposit: amount,
      });
      
      return {
        success: true,
        txHash: result.txHash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Create a new game
   */
  async createGame(opponentId: string, gameMode: string, stake: string): Promise<{ success: boolean, gameId?: string, error?: string }> {
    try {
      const result = await this.executeTransaction({
        type: TransactionType.GAME_CREATE,
        contract: 'gameModesContract',
        method: 'createMatch',
        args: [opponentId, gameMode],
        deposit: stake,
      });
      
      return {
        success: true,
        gameId: result.txHash.slice(-10),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Join a game
   */
  async joinGame(gameId: string, stake: string): Promise<{ success: boolean, error?: string }> {
    try {
      await this.executeTransaction({
        type: TransactionType.GAME_JOIN,
        contract: 'gameModesContract',
        method: 'joinMatch',
        args: [gameId],
        deposit: stake,
      });
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Create a raid
   */
  async createRaid(difficulty: number, stake: string): Promise<{ success: boolean, raidId?: string, error?: string }> {
    try {
      const result = await this.executeTransaction({
        type: TransactionType.GAME_CREATE,
        contract: 'gameModesContract',
        method: 'createRaid',
        args: [difficulty],
        deposit: stake,
      });
      
      return {
        success: true,
        raidId: result.txHash.slice(-10),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Attempt a raid
   */
  async attemptRaid(raidId: string, fee: string): Promise<{ success: boolean, error?: string }> {
    try {
      await this.executeTransaction({
        type: TransactionType.GAME_BET,
        contract: 'gameModesContract',
        method: 'attemptRaid',
        args: [raidId],
        deposit: fee,
      });
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Call a view method directly on a contract
   */
  async callContractViewMethod<T>(
    contractAddress: string,
    abi: ContractAbi | ContractArtifact,
    methodName: string,
    args: unknown[] = []
  ): Promise<T> {
    // Extract the ABI array if we're passed a contract artifact object
    const abiArray: Abi = Array.isArray(abi) 
      ? (abi as unknown as Abi) 
      : (abi && 'abi' in abi ? abi.abi as unknown as Abi : [] as unknown as Abi);
    
    return evmWallet.callViewMethod<T>(
      contractAddress,
      abiArray,
      methodName,
      args
    );
  }

  /**
   * Call a method directly on a contract that requires signing
   */
  async callContractMethod(
    contractAddress: string,
    abi: ContractAbi | ContractArtifact,
    methodName: string,
    args: unknown[] = [],
    value: string = "0"
  ): Promise<TransactionResponse> {
    // Extract the ABI array if we're passed a contract artifact object
    const abiArray: Abi = Array.isArray(abi) 
      ? (abi as unknown as Abi) 
      : (abi && 'abi' in abi ? abi.abi as unknown as Abi : [] as unknown as Abi);
    
    const valueBigInt = BigInt(value);
    
    return evmWallet.callMethod(
      contractAddress,
      abiArray,
      methodName,
      args,
      valueBigInt
    );
  }

  /**
   * Get the connected wallet address
   */
  getAddress(): string | null {
    return evmWallet.getAddress();
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return evmWallet.isConnected();
  }
}

// Export singleton instance
export const evmService = EVMService.getInstance();