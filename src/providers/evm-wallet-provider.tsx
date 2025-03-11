"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { evmWallet } from "@/config/evm-wallet";
import { chainSelector } from "@/config/chain-selector";
import { toast } from "sonner";
// Import the ABI JSON files
import baultroFinalAbi from "@/abis/BaultroFinal.json";
import baultroGamesAbi from "@/abis/BaultroGames.json";
import type { Abi } from "viem";

// Define context interface
interface EVMWalletContextType {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  callViewMethod: <T>(
    methodName: string,
    args?: Record<string, unknown> | unknown[],
    contractName?: string
  ) => Promise<T>;
  callMethod: (
    methodName: string,
    args?: unknown[],
    value?: string,
    contractAddress?: string
  ) => Promise<{
    hash: string;
    status: string;
    success: boolean;
  }>;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
}

// Create context
const EVMWalletContext = createContext<EVMWalletContextType>({
  address: null,
  isConnected: false,
  isLoading: true,
  callViewMethod: async () => {
    throw Error("EVMWalletContext not initialized");
  },
  callMethod: async () => {
    throw Error("EVMWalletContext not initialized");
  },
  signIn: async () => false,
  signOut: async () => false,
});

// Provider component
export function EVMWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize wallet connection on component mount
    const initWallet = async () => {
      try {
        await evmWallet.init();
        const walletAddress = evmWallet.getAddress();
        setAddress(walletAddress);
        setIsConnected(!!walletAddress);
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initWallet();

    // Set up account change listener
    const checkAddressInterval = setInterval(() => {
      const currentAddress = evmWallet.getAddress();
      if (currentAddress !== address) {
        setAddress(currentAddress);
        setIsConnected(!!currentAddress);
      }
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(checkAddressInterval);
      evmWallet.cleanup();
    };
  }, [address]);

  // Connect wallet
  const signIn = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await evmWallet.connectWallet();
      if (success) {
        const walletAddress = evmWallet.getAddress();
        setAddress(walletAddress);
        setIsConnected(true);
        toast.success("Wallet connected successfully");
      } else {
        toast.error("Failed to connect wallet");
      }
      return success;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Error connecting wallet");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const signOut = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await evmWallet.signOut();
      if (success) {
        setAddress(null);
        setIsConnected(false);
        toast.info("Wallet disconnected");
      }
      return success;
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Error disconnecting wallet");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Call a view method (read-only)
  const callViewMethod = async <T,>(
    methodName: string,
    args: Record<string, unknown> | unknown[] = {},
    contractName: string = "predictionMarket"
  ): Promise<T> => {
    try {
      // Get contract address
      const contractAddress = getContractAddress(contractName);

      // Format args if needed
      const formattedArgs = Array.isArray(args) ? args : Object.values(args);

      // Call the method
      return await evmWallet.callViewMethod<T>(
        contractAddress,
        getContractAbi(contractName),
        methodName,
        formattedArgs
      );
    } catch (error) {
      console.error(`Error calling view method ${methodName}:`, error);
      toast.error(`Error calling ${methodName}`);
      throw error;
    }
  };

  // Call a state-changing method
  const callMethod = async (
    methodName: string,
    args: unknown[] = [],
    value: string = "0",
    contractName: string = "predictionMarket"
  ): Promise<{ hash: string; status: string; success: boolean }> => {
    try {
      if (!isConnected) {
        toast.error("Wallet not connected");
        throw new Error("Wallet not connected");
      }

      // Get contract address - contractName might be an actual address
      const contractAddress = getContractAddress(contractName);

      // Call the method
      const result = await evmWallet.callMethod(
        contractAddress,
        getContractAbi(contractName),
        methodName,
        args,
        BigInt(value)
      );

      if (result.success) {
        toast.success("Transaction successful");
      } else {
        toast.error("Transaction failed");
      }

      return {
        hash: result.hash,
        status: result.status,
        success: result.success ?? false,
      };
    } catch (error) {
      console.error(`Error calling method ${methodName}:`, error);
      toast.error(`Error calling ${methodName}`);
      throw error;
    }
  };

  // Helper function to get contract address
  const getContractAddress = (contractName?: string): string => {
    const config = chainSelector.getActiveChain();

    // If the input looks like an address, return it directly
    if (contractName?.startsWith('0x') && contractName?.length === 42) {
      return contractName;
    }

    if (!contractName) {
      return config.predictionMarketContract;
    }

    switch (contractName) {
      case "predictionMarket":
        return config.predictionMarketContract;
      case "gameModesContract":
        return config.gameModesContract;
      default:
        return contractName; // Assume contractName is the address if not recognized
    }
  };

  // Helper function to get contract ABI
  const getContractAbi = (contractName: string): Abi => {
    // Return the appropriate ABI based on the contract name
    switch (contractName) {
      case "predictionMarket":
        return baultroFinalAbi.abi as unknown as Abi;
      case "gameModesContract":
        return baultroGamesAbi.abi as unknown as Abi;
      default:
        // If contractName starts with 0x, it's likely an address - use a default ABI
        return baultroFinalAbi.abi as unknown as Abi;
    }
  };

  return (
    <EVMWalletContext.Provider
      value={{
        address,
        isConnected,
        isLoading,
        callViewMethod,
        callMethod,
        signIn,
        signOut,
      }}
    >
      {children}
    </EVMWalletContext.Provider>
  );
}

// Custom hook for using the wallet context
export function useWallet() {
  const context = useContext(EVMWalletContext);
  if (context === undefined) {
    throw Error("useEVMWallet must be used within an EVMWalletProvider");
  }
  return context;
}
