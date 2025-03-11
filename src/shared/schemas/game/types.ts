/**
 * Game related types for Baultro platform
 */

/**
 * Game type enumeration
 */
export enum GameType {
  BATTLE = 0,
  LOVE = 1,
  MYSTERY = 2,
  RAID = 3
}

/**
 * Difficulty level enumeration
 */
export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT'
}

/**
 * Game attempt result interface
 */
export interface GameAttemptResult {
  success: boolean;
  score: number;
  feedback: string;
  reward?: string;
  txHash?: string;
  attempts: number;
  maxAttempts: number;
  timeElapsed: number;
  gameSessionId?: string;
}

/**
 * Game state interface
 */
export interface GameState {
  gameId?: string;
  gameType: GameType;
  difficultyLevel: DifficultyLevel;
  status: GameStatus;
  creator: string;
  opponent?: string;
  stake: string;
  startTime: number;
  endTime?: number;
  timeLimit: number;
  personalityId?: string;
  result?: GameAttemptResult;
}

/**
 * Game status enumeration
 */
export enum GameStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Game creation request interface
 */
export interface GameCreationRequest {
  gameType: GameType;
  difficultyLevel: DifficultyLevel;
  stake: string;
  timeLimit: number;
  personalityId?: string;
}

/**
 * Game join request interface
 */
export interface GameJoinRequest {
  gameId: string;
  stake: string;
}

/**
 * Game attempt request interface
 */
export interface GameAttemptRequest {
  gameId: string;
  prompt: string;
  attempt: number;
}

/**
 * Raid creation request interface
 */
export interface RaidCreationRequest {
  difficultyLevel: DifficultyLevel;
  stake: string;
  timeLimit: number;
  personalityId?: string;
}

/**
 * Raid attempt request interface
 */
export interface RaidAttemptRequest {
  raidId: string;
  fee: string;
}
