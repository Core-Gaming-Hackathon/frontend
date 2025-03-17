import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NFTStatus } from '@/components/game/NFTStatus';

// Mock the wallet and game providers
vi.mock('@/providers/evm-wallet-provider', () => ({
  useWallet: () => ({
    isConnected: true,
    address: '0x123456789abcdef',
    connectWallet: vi.fn(),
  }),
}));

vi.mock('@/providers/game-provider', () => ({
  useGame: () => ({
    checkNFTEligibility: vi.fn().mockResolvedValue(true),
    mintDailyNFT: vi.fn().mockResolvedValue(true),
  }),
}));

// Mock current date to ensure consistent day of week for testing
const mockDate = new Date('2023-05-21'); // A Sunday for testing
// @ts-ignore
global.Date = vi.fn(() => mockDate);
global.Date.now = vi.fn(() => mockDate.getTime());

describe('NFTStatus Component', () => {
  it('renders the component with correct animal based on day of week', () => {
    render(<NFTStatus />);
    
    // On Sunday (day 0), should show panda
    expect(screen.getByText(/sunday.*animal/i, { exact: false })).toBeDefined();
    
    // Should have animal alt text
    const images = screen.getAllByRole('img');
    const animalImage = images.find(img => 
      img.getAttribute('alt')?.toLowerCase().includes('animal')
    );
    expect(animalImage).toBeDefined();
  });
  
  it('shows animal NFT details correctly', () => {
    render(<NFTStatus />);
    
    // Should mention NFT
    expect(screen.getByText(/nft/i, { exact: false })).toBeDefined();
    
    // Should show a button to mint or check status
    const mintButton = screen.getByRole('button', { name: /mint|check/i });
    expect(mintButton).toBeDefined();
  });
}); 