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
    value?: bigint
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

      const result = await this.publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: methodName,
        args,
      });

      return result as T;
    } catch (error) {
      console.error(`Error calling view method ${methodName}:`, error);
      throw error;
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
    value?: bigint
  ): Promise<TransactionResult> {
    try {
      if (!this.walletClient || !this.publicClient) {
        throw new Error("Wallet or public client not initialized");
      }

      if (!this.address) {
        throw new Error("Wallet not connected");
      }

      const currentChain = chainSelector.getActiveChain();
      const chainConfig = {
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
      } as Chain;

      // Prepare the transaction
      await this.publicClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: methodName,
        args,
        account: this.address as `0x${string}`,
        value: value || undefined,
      });

      // Send the transaction
      const hash = await this.walletClient.writeContract({
        chain: chainConfig,
        address: contractAddress as `0x${string}`,
        abi,
        functionName: methodName,
        args,
        account: this.address as `0x${string}`,
        value: value || undefined,
      });

      // Wait for the transaction to be mined
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        hash: hash,
        status: receipt.status === "success" ? "success" : "failed",
        success: receipt.status === "success",
      };
    } catch (error) {
      console.error(`Error calling method ${methodName}:`, error);
      return {
        hash: "",
        status: error instanceof Error ? error.message : "Unknown error",
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
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