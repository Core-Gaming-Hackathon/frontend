"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { evmWallet } from "@/config/evm-wallet";
import { chainSelector } from "@/config/chain-selector";
import { toast } from "sonner";
// Import the ABI JSON files
import baultroGamesAbi from "@/abis/BaultroGames.json";
import baultroPredictionMarketAbi from "@/abis/BaultroPredictionMarket.json";
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
    data?: unknown;
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
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Only run initialization once
    if (isInitialized) return;

    // Initialize wallet connection on component mount
    const initWallet = async () => {
      try {
        await evmWallet.init();
        const walletAddress = evmWallet.getAddress();
        
        // Check localStorage for persisted connection
        const shouldBeConnected = window.localStorage.getItem("walletConnected") === "true";
        
        if (shouldBeConnected && !walletAddress) {
          // Try to reconnect if we should be connected but aren't
          await evmWallet.connectWallet();
        }
        
        // Update state with latest wallet address
        const finalAddress = evmWallet.getAddress();
        setAddress(finalAddress);
        setIsConnected(!!finalAddress);
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
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
  }, [address, isInitialized]);

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
  ): Promise<{ hash: string; status: string; success: boolean; data?: unknown }> => {
    try {
      if (!isConnected) {
        // Don't show toast for wallet connection errors - let the calling code handle it
        console.warn(`Wallet not connected when calling ${methodName}`);
        throw new Error("Wallet not connected");
      }

      // Get contract address - contractName might be an actual address
      const contractAddress = getContractAddress(contractName);

      // Check if this is a view method (starts with "get" or "view")
      const isViewMethod = methodName.startsWith("get") || methodName.startsWith("view");
      
      if (isViewMethod) {
        try {
          // For view methods, use callViewMethod instead
          const data = await evmWallet.callViewMethod(
            contractAddress,
            getContractAbi(contractName),
            methodName,
            args
          );
          
          return {
            hash: "",
            status: "success",
            success: true,
            data
          };
        } catch (viewError) {
          // Handle view method errors more gracefully
          console.warn(`Error calling view method ${methodName}:`, viewError);
          
          // Return a failed result but don't throw - let the calling code handle it
          return {
            hash: "",
            status: viewError instanceof Error ? viewError.message : "View method failed",
            success: false,
            data: null
          };
        }
      } else {
        // For state-changing methods, use callMethod
        const result = await evmWallet.callMethod(
          contractAddress,
          getContractAbi(contractName),
          methodName,
          args,
          BigInt(value)
        );

        // Only show success toast for state-changing methods
        if (result.success) {
          toast.success("Transaction successful");
        } else if (!result.success) {
          toast.error("Transaction failed");
        }

        // Return the result (without data for state-changing methods)
        return {
          hash: result.hash || "",
          status: result.status || "",
          success: result.success ?? false
        };
      }
    } catch (error) {
      // Log the error but don't show toast - let the calling code handle it
      console.error(`Error calling method ${methodName}:`, error);
      
      // Don't show toast for wallet connection errors - let the calling code handle it
      if (!(error instanceof Error && error.message === "Wallet not connected")) {
        toast.error(`Error calling ${methodName}`);
      }
      
      throw error;
    }
  };

  // Helper function to get contract ABI
  const getContractAbi = (contractName: string): Abi => {
    // If it's an address, check if it matches our known contracts
    if (contractName.startsWith('0x')) {
      const config = chainSelector.getActiveChain();
      if (contractName.toLowerCase() === config.predictionMarketContract.toLowerCase()) {
        return baultroPredictionMarketAbi.abi as Abi;
      }
      if (contractName.toLowerCase() === config.gameModesContract.toLowerCase()) {
        return baultroGamesAbi.abi as Abi;
      }
    }

    // Otherwise check by name
    switch (contractName.toLowerCase()) {
      case "predictionmarket":
      case "baultropredictionmarket":
        return baultroPredictionMarketAbi.abi as Abi;
      case "gamemodes":
      case "baultrogames":
        return baultroGamesAbi.abi as Abi;
      default:
        // If we can't determine the ABI, throw an error
        throw new Error(`Unknown contract: ${contractName}`);
    }
  };

  // Helper function to get contract address
  const getContractAddress = (contractName?: string): string => {
    const config = chainSelector.getActiveChain();

    // If the input looks like an address, validate it
    if (contractName?.startsWith('0x') && contractName?.length === 42) {
      // Verify it's one of our known contracts
      if (contractName.toLowerCase() === config.predictionMarketContract.toLowerCase() ||
          contractName.toLowerCase() === config.gameModesContract.toLowerCase()) {
        return contractName;
      }
      throw new Error(`Invalid contract address: ${contractName}`);
    }

    // Get address by name
    if (!contractName || contractName.toLowerCase() === "predictionmarket") {
      return config.predictionMarketContract;
    }
    if (contractName.toLowerCase() === "gamemodes") {
      return config.gameModesContract;
    }

    throw new Error(`Unknown contract name: ${contractName}`);
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
