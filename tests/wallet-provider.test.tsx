import { describe, expect, it, mock, beforeEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EVMWalletProvider, useWallet } from '../src/providers/evm-wallet-provider';

// Mock the evmService
mock.module('../src/services/evm-service', () => ({
  evmService: {
    connectWallet: mock(async () => true),
    disconnectWallet: mock(async () => true),
    getConnectedWallet: mock(() => '0x1234567890123456789012345678901234567890'),
    isWalletConnected: mock(() => false),
    callViewMethod: mock(async () => ({ balance: '100' })),
    executeTransaction: mock(async () => ({ 
      txHash: '0xabcdef', 
      status: 'success'
    })),
  }
}));

// Test component that uses the wallet hook
const TestWalletComponent = () => {
  const { address, isConnected, signIn, signOut, callMethod, callViewMethod } = useWallet();
  
  const handleSignIn = async () => {
    await signIn();
  };
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const handleCallMethod = async () => {
    await callMethod('testMethod', ['arg1', 'arg2']);
  };
  
  const handleCallViewMethod = async () => {
    const result = await callViewMethod('viewMethod');
    console.log(result);
  };
  
  return (
    <div>
      <div>Address: {address || 'Not connected'}</div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={handleSignIn}>Connect</button>
      <button onClick={handleSignOut}>Disconnect</button>
      <button onClick={handleCallMethod}>Call Method</button>
      <button onClick={handleCallViewMethod}>Call View Method</button>
    </div>
  );
};

describe('EVMWalletProvider', () => {
  beforeEach(() => {
    // Reset mocks
    evmService.connectWallet.mockClear();
    evmService.disconnectWallet.mockClear();
    evmService.getConnectedWallet.mockClear();
    evmService.isWalletConnected.mockClear();
    evmService.callViewMethod.mockClear();
    evmService.executeTransaction.mockClear();
  });

  it('provides wallet functionality to children components', async () => {
    render(
      <EVMWalletProvider>
        <TestWalletComponent />
      </EVMWalletProvider>
    );
    
    // Initially disconnected
    expect(screen.getByText('Status: Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Address: Not connected')).toBeInTheDocument();
    
    // Connect wallet
    fireEvent.click(screen.getByText('Connect'));
    
    // Mock a successful connection
    evmService.isWalletConnected.mockReturnValue(true);
    
    await waitFor(() => {
      expect(evmService.connectWallet).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Status: Connected')).toBeInTheDocument();
      expect(screen.getByText('Address: 0x1234567890123456789012345678901234567890')).toBeInTheDocument();
    });
    
    // Call a contract method
    fireEvent.click(screen.getByText('Call Method'));
    
    await waitFor(() => {
      expect(evmService.executeTransaction).toHaveBeenCalledTimes(1);
      expect(evmService.executeTransaction).toHaveBeenCalledWith(expect.objectContaining({
        method: 'testMethod',
        args: { args: ['arg1', 'arg2'] }
      }));
    });
    
    // Call a view method
    fireEvent.click(screen.getByText('Call View Method'));
    
    await waitFor(() => {
      expect(evmService.callViewMethod).toHaveBeenCalledTimes(1);
      expect(evmService.callViewMethod).toHaveBeenCalledWith('viewMethod', expect.anything(), expect.anything());
    });
    
    // Disconnect wallet
    fireEvent.click(screen.getByText('Disconnect'));
    
    // Mock a successful disconnection
    evmService.isWalletConnected.mockReturnValue(false);
    
    await waitFor(() => {
      expect(evmService.disconnectWallet).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Status: Disconnected')).toBeInTheDocument();
      expect(screen.getByText('Address: Not connected')).toBeInTheDocument();
    });
  });
});
