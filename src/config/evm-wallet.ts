/**
 * EVM Wallet Module
 * 
 * Handles wallet integration for Ethereum and EVM-compatible chains
 */

import { createPublicClient, createWalletClient, http, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Abi, Chain } from "viem";
import { chainSelector } from "@/config/chain-selector";

// Export types for other modules to use
export type ContractAbi = Abi;
export type TransactionResponse = TransactionResult;

export type TransactionResult = {
  hash: string;
  status: string;
  success?: boolean;
  errorMessage?: string;
  data?: unknown;
};

// Custom type for ethereum provider that matches window.ethereum
export type EthereumProvider = NonNullable<typeof window.ethereum>;

interface EVMWalletInterface {
  init(): Promise<boolean>;
  getAddress(): string | null;
  isConnected(): boolean;
  isEVMWalletInstalled(): boolean;
  connectWallet(): Promise<boolean>;
  signOut(): Promise<boolean>;
  callViewMethod<T>(
    contractAddress: string, 
    abi: Abi, 
    methodName: string, 
    args?: unknown[]
  ): Promise<T>;
  callMethod(
    contractAddress: string,
    abi: Abi,
    methodName: string,
    args?: unknown[],
    value?: bigint | string
  ): Promise<TransactionResult>;
  cleanup(): void;
}

/**
 * EVM Wallet Implementation
 */
class EVMWallet implements EVMWalletInterface {
  private address: string | null = null;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private publicClient: ReturnType<typeof createPublicClient> | null = null;
  private chainId: number | null = null;
  private lastChainId: number | null = null;
  private onAccountsChangedCallback: ((accounts: string[]) => void) | null = null;
  // Fix: Update the type to accept unknown arguments and cast inside the function
  private onChainChangedCallback: ((...args: unknown[]) => void) | null = null;

  /**
   * Initialize the wallet
   */
  async init(): Promise<boolean> {
    try {
      // Check if wallet is installed
      if (!this.isEVMWalletInstalled()) {
        // Initialize with public client only (read-only mode)
        await this.initPublicClient();
        return false;
      }

      // Initialize wallet
      await this.initPublicClient();

      // Check if already connected
      if (window.localStorage.getItem("walletConnected") === "true") {
        return await this.connectWallet();
      }

      return false;
    } catch (error) {
      console.error("Failed to initialize EVM wallet:", error);
      return false;
    }
  }

  /**
   * Initialize the public client (for read-only operations)
   */
  private async initPublicClient(): Promise<void> {
    try {
      const currentNetwork = chainSelector.getActiveChain();

      // Create a public client - convert ChainConfig to Chain type
      this.publicClient = createPublicClient({
        chain: {
          id: currentNetwork.chainId,
          name: currentNetwork.name,
          rpcUrls: {
            default: {
              http: [currentNetwork.rpcUrl],
            },
            public: {
              http: [currentNetwork.rpcUrl],
            }
          },
          nativeCurrency: currentNetwork.nativeCurrency,
        } as Chain,
        transport: http(currentNetwork.rpcUrl),
      });

      this.chainId = currentNetwork.chainId;
      this.lastChainId = currentNetwork.chainId;
    } catch (error) {
      console.error("Failed to initialize public client:", error);
      throw error;
    }
  }

  /**
   * Check if an EVM wallet (like MetaMask) is installed
   */
  isEVMWalletInstalled(): boolean {
    return typeof window !== "undefined" && !!window.ethereum;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!this.address;
  }

  /**
   * Get the connected wallet address
   */
  getAddress(): string | null {
    return this.address;
  }

  /**
   * Connect to wallet
   */
  async connectWallet(): Promise<boolean> {
    try {
      if (!this.isEVMWalletInstalled()) {
        console.error("No EVM wallet installed");
        return false;
      }

      const currentNetwork = chainSelector.getActiveChain();
      
      // Initialize wallet client with properly typed ethereum provider
      this.walletClient = createWalletClient({
        chain: {
          id: currentNetwork.chainId,
          name: currentNetwork.name,
          rpcUrls: {
            default: {
              http: [currentNetwork.rpcUrl],
            },
            public: {
              http: [currentNetwork.rpcUrl],
            }
          },
          nativeCurrency: currentNetwork.nativeCurrency,
        } as Chain,
        transport: custom(window.ethereum as EthereumProvider),
      });

      // Request accounts
      const [address] = await this.walletClient.requestAddresses();

      // Store wallet connection
      this.address = address;
      window.localStorage.setItem("walletConnected", "true");

      // Setup event listeners for wallet
      this.setupWalletListeners();

      return true;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      this.address = null;
      window.localStorage.removeItem("walletConnected");
      return false;
    }
  }

  /**
   * Set up event listeners for wallet
   */
  private setupWalletListeners(): void {
    if (!window.ethereum) return;

    // Remove existing listeners if any
    this.removeWalletListeners();

    // Account changed
    this.onAccountsChangedCallback = (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        // User disconnected
        this.address = null;
        window.localStorage.removeItem("walletConnected");
      } else {
        // User switched account
        this.address = accounts[0];
      }
    };

    // Chain changed - Fix: Use type assertion to handle the string chainId
    this.onChainChangedCallback = (...args: unknown[]) => {
      const chainId = String(args[0]); // Convert to string safely
      console.log("Chain changed:", chainId);
      const newChainId = parseInt(chainId, 16);
      
      if (this.chainId !== newChainId) {
        this.lastChainId = this.chainId;
        this.chainId = newChainId;
      }
    };

    // Add listeners with explicit type handling
    window.ethereum.on("accountsChanged", this.onAccountsChangedCallback as (...args: unknown[]) => void);
    window.ethereum.on("chainChanged", this.onChainChangedCallback);
  }

  /**
   * Remove wallet event listeners
   */
  private removeWalletListeners(): void {
    if (!window.ethereum) return;

    if (this.onAccountsChangedCallback) {
      window.ethereum.removeListener("accountsChanged", this.onAccountsChangedCallback as (...args: unknown[]) => void);
    }

    if (this.onChainChangedCallback) {
      window.ethereum.removeListener("chainChanged", this.onChainChangedCallback);
    }
  }

  /**
   * Sign out from wallet
   */
  async signOut(): Promise<boolean> {
    try {
      this.address = null;
      window.localStorage.removeItem("walletConnected");
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  }

  /**
   * Call a view method (read-only)
   */
  async callViewMethod<T>(
    contractAddress: string,
    abi: Abi,
    methodName: string,
    args: unknown[] = []
  ): Promise<T> {
    try {
      if (!this.publicClient) {
        throw new Error("Public client not initialized");
      }

      // Add a timeout to prevent hanging calls
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Call to ${methodName} timed out after 10 seconds`));
        }, 10000); // 10 second timeout
      });

      // Execute the contract call with timeout
      const resultPromise = this.publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: methodName,
        args,
      });

      // Race between the contract call and the timeout
      const result = await Promise.race([resultPromise, timeoutPromise]);

      // If we get here, the call succeeded
      return result as T;
    } catch (error) {
      // Enhanced error handling for Core testnet
      let errorMessage = `Error calling view method ${methodName}`;
      
      if (error instanceof Error) {
        if (error.message.includes("execution reverted")) {
          // Check for specific Core testnet revert reasons
          if (error.message.includes("nonexistent token")) {
            errorMessage = `Prediction ID does not exist for ${methodName}`;
          } else if (error.message.includes("not resolved")) {
            errorMessage = `Prediction has not been resolved yet for ${methodName}`;
          } else if (error.message.includes("invalid prediction")) {
            errorMessage = `Invalid prediction ID for ${methodName}`;
          } else if (error.message.includes("already resolved")) {
            errorMessage = `Prediction has already been resolved for ${methodName}`;
          } else if (error.message.includes("not creator")) {
            errorMessage = `Only the prediction creator can call ${methodName}`;
          } else {
            errorMessage = `Contract execution reverted for ${methodName}. This could mean the contract doesn't exist, the method doesn't exist, or the contract state doesn't allow this call.`;
          }
        } else if (error.message.includes("timeout")) {
          errorMessage = `Call to ${methodName} timed out. The Core testnet RPC might be congested or unresponsive.`;
        } else if (error.message.includes("could not decode result")) {
          errorMessage = `Invalid response from ${methodName}. The contract might not be deployed correctly on Core testnet.`;
        } else if (error.message.includes("network disconnected")) {
          errorMessage = `Lost connection to Core testnet while calling ${methodName}. Please check your network connection.`;
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = `Insufficient tCORE balance for ${methodName}. Please get some testnet tokens.`;
        } else {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      }
      
      console.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Call a state-changing method (requires wallet)
   */
  async callMethod(
    contractAddress: string,
    abi: Abi,
    methodName: string,
    args: unknown[] = [],
    value?: bigint | string
  ): Promise<TransactionResult> {
    try {
      if (!this.walletClient || !this.publicClient) {
        throw new Error("Wallet or public client not initialized");
      }

      if (!this.address) {
        throw new Error("Wallet not connected");
      }

      // Convert value to BigInt if it's a string
      const valueBigInt = typeof value === 'string' ? BigInt(value) : value;

      const currentChain = chainSelector.getActiveChain();
      
      // Verify we're on Core testnet
      if (currentChain.chainId !== 1114) {
        throw new Error("Please switch to Core testnet (Chain ID: 1114)");
      }

      // Verify contract address matches expected
      const predictionMarketAddress = chainSelector.getPredictionMarketAddress().toLowerCase();
      const gameModesAddress = chainSelector.getGameModesAddress().toLowerCase();
      
      if (contractAddress.toLowerCase() !== predictionMarketAddress && 
          contractAddress.toLowerCase() !== gameModesAddress) {
        throw new Error("Invalid contract address for Core testnet");
      }

      // Prepare the transaction
      try {
        await this.publicClient.simulateContract({
          address: contractAddress as `0x${string}`,
          abi,
          functionName: methodName,
          args,
          account: this.address as `0x${string}`,
          value: valueBigInt,
        });
      } catch (simError) {
        // Enhanced simulation error handling
        if (simError instanceof Error) {
          if (simError.message.includes("execution reverted")) {
            throw new Error(`Transaction would fail: ${simError.message}`);
          } else if (simError.message.includes("insufficient funds")) {
            throw new Error("Insufficient tCORE balance. Please get some testnet tokens.");
          }
        }
        throw simError;
      }

      // Send the transaction
      const hash = await this.walletClient.writeContract({
        chain: {
          id: currentChain.chainId,
          name: currentChain.name,
          rpcUrls: {
            default: {
              http: [currentChain.rpcUrl],
            },
            public: {
              http: [currentChain.rpcUrl],
            }
          },
          nativeCurrency: currentChain.nativeCurrency
        },
        address: contractAddress as `0x${string}`,
        abi,
        functionName: methodName,
        args,
        account: this.address as `0x${string}`,
        value: valueBigInt,
      });

      // Wait for the transaction with timeout
      const receiptPromise = this.publicClient.waitForTransactionReceipt({ hash });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Transaction confirmation timed out"));
        }, 60000); // 60 second timeout
      });

      const receipt = await Promise.race([receiptPromise, timeoutPromise]);

      return {
        hash: hash,
        status: receipt.status === "success" ? "success" : "failed",
        success: receipt.status === "success",
      };
    } catch (error) {
      console.error(`Error calling method ${methodName}:`, error);
      
      // Enhanced error handling
      let errorMessage = "Transaction failed";
      if (error instanceof Error) {
        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient tCORE balance. Please get some testnet tokens.";
        } else if (error.message.includes("nonce too low")) {
          errorMessage = "Transaction nonce error. Please try again.";
        } else if (error.message.includes("gas required exceeds allowance")) {
          errorMessage = "Transaction would exceed gas limit. Please try a smaller amount.";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        hash: "",
        status: errorMessage,
        success: false,
        errorMessage: errorMessage,
      };
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.removeWalletListeners();
  }

  /**
   * Use a private key for account (development/testing only)
   */
  usePrivateKey(privateKey: string): void {
    if (process.env.NODE_ENV !== "development") {
      console.error("Private keys should only be used in development");
      return;
    }

    try {
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      this.address = account.address;
      
      const currentChain = chainSelector.getActiveChain();
      
      // Create wallet client with the private key account
      this.walletClient = createWalletClient({
        account,
        chain: {
          id: currentChain.chainId,
          name: currentChain.name,
          rpcUrls: {
            default: {
              http: [currentChain.rpcUrl],
            },
            public: {
              http: [currentChain.rpcUrl],
            }
          },
          nativeCurrency: currentChain.nativeCurrency,
        } as Chain,
        transport: http(),
      });
      
      window.localStorage.setItem("walletConnected", "true");
    } catch (error) {
      console.error("Error using private key:", error);
    }
  }
}

// Export a singleton instance
export const evmWallet = new EVMWallet();