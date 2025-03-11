interface EthereumRequest {
  method: string;
  params?: unknown[];
}

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: EthereumRequest) => Promise<unknown>;
    on: (eventName: string, callback: (...args: unknown[]) => void) => void;
    removeListener: (eventName: string, callback: (...args: unknown[]) => void) => void;
    selectedAddress?: string;
    chainId?: string;
    isConnected?: () => boolean;
    enable?: () => Promise<string[]>;
  };
}
