/**
 * Mock Game Data Provider
 * 
 * Provides mock data for game modes and battle functionality
 * to avoid excessive network requests during development.
 */

import { isMockModeEnabled } from "./mock-data";

// Types for game data
export interface MockMatch {
  id: number;
  creator: string;
  opponent: string | null;
  stake: string;
  status: 'created' | 'accepted' | 'resolved';
  winner: string | null;
  createdAt: string;
  acceptedAt: string | null;
  resolvedAt: string | null;
}

export interface MockBattle {
  id: number;
  player: string;
  stake: string;
  difficulty: number;
  resolved: boolean;
  success: boolean;
  reward: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface MockRaid {
  id: number;
  creator: string;
  stake: string;
  entryFee: string;
  difficulty: number;
  createdAt: string;
  active: boolean;
}

// Store mock data in memory
const mockMatches: MockMatch[] = [];
const mockBattles: MockBattle[] = [];
const mockRaids: MockRaid[] = [];

// Counter for generating IDs
let nextMatchId = 1;
let nextBattleId = 1;
let nextRaidId = 1;

/**
 * Create a mock match
 * @param creator Address of the creator
 * @param stake Amount staked
 * @returns Match ID
 */
export function createMockMatch(creator: string, stake: string): number {
  const matchId = nextMatchId++;
  
  mockMatches.push({
    id: matchId,
    creator,
    opponent: null,
    stake,
    status: 'created',
    winner: null,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    resolvedAt: null
  });
  
  return matchId;
}

/**
 * Accept a mock match
 * @param matchId ID of the match
 * @param opponent Address of the opponent
 * @returns Success status
 */
export function acceptMockMatch(matchId: number, opponent: string): boolean {
  const match = mockMatches.find(m => m.id === matchId);
  
  if (!match || match.status !== 'created') {
    return false;
  }
  
  match.opponent = opponent;
  match.status = 'accepted';
  match.acceptedAt = new Date().toISOString();
  
  return true;
}

/**
 * Resolve a mock match
 * @param matchId ID of the match
 * @param winner Address of the winner
 * @returns Success status
 */
export function resolveMockMatch(matchId: number, winner: string): boolean {
  const match = mockMatches.find(m => m.id === matchId);
  
  if (!match || match.status !== 'accepted') {
    return false;
  }
  
  match.winner = winner;
  match.status = 'resolved';
  match.resolvedAt = new Date().toISOString();
  
  return true;
}

/**
 * Create a mock battle
 * @param player Address of the player
 * @param stake Amount staked
 * @param difficulty Difficulty level (1-10)
 * @returns Battle ID
 */
export function createMockBattle(player: string, stake: string, difficulty: number): number {
  const battleId = nextBattleId++;
  
  mockBattles.push({
    id: battleId,
    player,
    stake,
    difficulty,
    resolved: false,
    success: false,
    reward: '0',
    createdAt: new Date().toISOString(),
    resolvedAt: null
  });
  
  return battleId;
}

/**
 * Resolve a mock battle
 * @param battleId ID of the battle
 * @param success Whether the battle was successful
 * @returns Success status
 */
export function resolveMockBattle(battleId: number, success: boolean): boolean {
  const battle = mockBattles.find(b => b.id === battleId);
  
  if (!battle || battle.resolved) {
    return false;
  }
  
  battle.resolved = true;
  battle.success = success;
  battle.resolvedAt = new Date().toISOString();
  
  // Calculate reward based on success and difficulty
  if (success) {
    const baseReward = parseFloat(battle.stake);
    const multiplier = 1 + (battle.difficulty / 10);
    battle.reward = (baseReward * multiplier).toFixed(4);
  } else {
    battle.reward = '0';
  }
  
  return true;
}

/**
 * Create a mock raid
 * @param creator Address of the creator
 * @param stake Amount staked
 * @param entryFee Entry fee for participants
 * @param difficulty Difficulty level (1-10)
 * @returns Raid ID
 */
export function createMockRaid(
  creator: string, 
  stake: string, 
  entryFee: string, 
  difficulty: number
): number {
  const raidId = nextRaidId++;
  
  mockRaids.push({
    id: raidId,
    creator,
    stake,
    entryFee,
    difficulty,
    createdAt: new Date().toISOString(),
    active: true
  });
  
  return raidId;
}

/**
 * Get a mock match
 * @param matchId ID of the match
 * @returns Match data
 */
export function getMockMatch(matchId: number): MockMatch | null {
  return mockMatches.find(m => m.id === matchId) || null;
}

/**
 * Get a mock battle
 * @param battleId ID of the battle
 * @returns Battle data
 */
export function getMockBattle(battleId: number): MockBattle | null {
  return mockBattles.find(b => b.id === battleId) || null;
}

/**
 * Get a mock raid
 * @param raidId ID of the raid
 * @returns Raid data
 */
export function getMockRaid(raidId: number): MockRaid | null {
  return mockRaids.find(r => r.id === raidId) || null;
}

/**
 * Check if game mock mode is enabled
 * @returns True if mock mode is enabled
 */
export function isGameMockModeEnabled(): boolean {
  return isMockModeEnabled();
} 