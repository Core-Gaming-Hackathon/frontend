import { describe, it, expect } from 'vitest';
import BaultroGamesABI from '@/abis/BaultroGames.json';

// Test configuration - updated contract address
const CONTRACT_ADDRESS = "0xf5250dD966e3ef10bbBb08878AdBB063d3879B57";

describe('BaultroGames Contract Tests', () => {
  it('should validate contract ABI structure', () => {
    // Verify the ABI has the expected functions
    const abi = BaultroGamesABI.abi;
    
    // Check for createBattle function
    const createBattleFunction = abi.find(
      item => item.type === 'function' && item.name === 'createBattle'
    );
    expect(createBattleFunction).toBeDefined();
    if (createBattleFunction) {
      expect(createBattleFunction.inputs).toHaveLength(1);
      expect(createBattleFunction.inputs[0].type).toBe('uint16');
      expect(createBattleFunction.inputs[0].name).toBe('difficulty');
      expect(createBattleFunction.stateMutability).toBe('payable');
    }
    
    // Check for getBattle function
    const getBattleFunction = abi.find(
      item => item.type === 'function' && item.name === 'getBattle'
    );
    expect(getBattleFunction).toBeDefined();
    if (getBattleFunction) {
      expect(getBattleFunction.inputs).toHaveLength(1);
      expect(getBattleFunction.inputs[0].type).toBe('uint64');
      expect(getBattleFunction.inputs[0].name).toBe('battleId');
      expect(getBattleFunction.stateMutability).toBe('view');
    }
    
    // Check for mintDailyParticipationNFT function
    const mintNftFunction = abi.find(
      item => item.type === 'function' && item.name === 'mintDailyParticipationNFT'
    );
    expect(mintNftFunction).toBeDefined();
    if (mintNftFunction) {
      expect(mintNftFunction.inputs).toHaveLength(0);
      expect(mintNftFunction.stateMutability).toBe('nonpayable');
    }
    
    // Check for isEligibleForDailyNFT function
    const eligibilityFunction = abi.find(
      item => item.type === 'function' && item.name === 'isEligibleForDailyNFT'
    );
    expect(eligibilityFunction).toBeDefined();
    if (eligibilityFunction) {
      expect(eligibilityFunction.inputs).toHaveLength(1);
      expect(eligibilityFunction.inputs[0].type).toBe('address');
      expect(eligibilityFunction.stateMutability).toBe('view');
    }
    
    // Check for createRaid function
    const createRaidFunction = abi.find(
      item => item.type === 'function' && item.name === 'createRaid'
    );
    expect(createRaidFunction).toBeDefined();
    if (createRaidFunction) {
      expect(createRaidFunction.inputs).toHaveLength(1);
      expect(createRaidFunction.inputs[0].type).toBe('uint8');
      expect(createRaidFunction.inputs[0].name).toBe('difficulty');
      expect(createRaidFunction.stateMutability).toBe('payable');
    }
    
    // Check for createMatch function (for love/mystery modes)
    const createMatchFunction = abi.find(
      item => item.type === 'function' && item.name === 'createMatch'
    );
    expect(createMatchFunction).toBeDefined();
    if (createMatchFunction) {
      expect(createMatchFunction.inputs).toHaveLength(2);
      expect(createMatchFunction.inputs[0].type).toBe('address');
      expect(createMatchFunction.inputs[1].type).toBe('string');
      expect(createMatchFunction.stateMutability).toBe('payable');
    }
  });
  
  it('should validate contract address format', () => {
    // Check that the contract address is a valid Ethereum address
    expect(CONTRACT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
  
  it('should validate contract events', () => {
    // Verify the ABI has the expected events
    const abi = BaultroGamesABI.abi;
    
    // Check for BattleCreated event
    const battleCreatedEvent = abi.find(
      item => item.type === 'event' && item.name === 'BattleCreated'
    );
    expect(battleCreatedEvent).toBeDefined();
    
    // Check for BattleResolved event
    const battleResolvedEvent = abi.find(
      item => item.type === 'event' && item.name === 'BattleResolved'
    );
    expect(battleResolvedEvent).toBeDefined();
    
    // Check for MatchCreated event
    const matchCreatedEvent = abi.find(
      item => item.type === 'event' && item.name === 'MatchCreated'
    );
    expect(matchCreatedEvent).toBeDefined();
    
    // Check for RaidPoolCreated event
    const raidCreatedEvent = abi.find(
      item => item.type === 'event' && item.name === 'RaidPoolCreated'
    );
    expect(raidCreatedEvent).toBeDefined();
    
    // Check for DailyParticipationNFTMinted event
    const nftMintedEvent = abi.find(
      item => item.type === 'event' && item.name === 'DailyParticipationNFTMinted'
    );
    expect(nftMintedEvent).toBeDefined();
  });

  // Test specific method existence in the ABI
  it('should verify all required game mode methods exist', () => {
    const abi = BaultroGamesABI.abi;
    const functionNames = abi
      .filter(item => item.type === 'function')
      .map(item => item.name);
    
    // Battle mode methods
    expect(functionNames).toContain('createBattle');
    expect(functionNames).toContain('getBattle');
    expect(functionNames).toContain('resolveBattle');
    
    // Raid mode methods
    expect(functionNames).toContain('createRaid');
    expect(functionNames).toContain('attemptRaid');
    expect(functionNames).toContain('completeRaid');
    expect(functionNames).toContain('getRaid');
    
    // Love/Mystery mode methods
    expect(functionNames).toContain('createMatch');
    expect(functionNames).toContain('joinMatch');
    expect(functionNames).toContain('endMatch');
    expect(functionNames).toContain('getMatch');
    
    // NFT methods
    expect(functionNames).toContain('mintDailyParticipationNFT');
    expect(functionNames).toContain('isEligibleForDailyNFT');
  });
  
  // Verify the contract has the right event names
  it('should verify all required game events exist', () => {
    const abi = BaultroGamesABI.abi;
    const eventNames = abi
      .filter(item => item.type === 'event')
      .map(item => item.name);
    
    // Battle events
    expect(eventNames).toContain('BattleCreated');
    expect(eventNames).toContain('BattleResolved');
    
    // Raid events
    expect(eventNames).toContain('RaidPoolCreated');
    expect(eventNames).toContain('RaidAttempted');
    expect(eventNames).toContain('RaidCompleted');
    
    // Match events
    expect(eventNames).toContain('MatchCreated');
    expect(eventNames).toContain('MatchJoined');
    expect(eventNames).toContain('MatchCompleted');
    
    // NFT events
    expect(eventNames).toContain('DailyParticipationNFTMinted');
  });
}); 