export type GameState = 'config' | 'playing' | 'result';

export interface GameSession {
  id: string;
  player_id: string;
  game_type: string;
  difficulty_level: number;
  stake_amount: number;
  status: 'active' | 'completed' | 'pending';
  rewards_claimed: boolean;
  created_at?: string;
}