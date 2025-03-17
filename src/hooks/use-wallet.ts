/**
 * Wallet Hook
 * 
 * This is a re-export of the useWallet hook from the evm-wallet-provider.
 * It's used to provide a consistent interface for wallet functionality across the app.
 */

import { useWallet as useWalletFromProvider } from '@/providers/evm-wallet-provider';

// Re-export the hook
export const useWallet = useWalletFromProvider;

// Export default for convenience
export default useWallet; 