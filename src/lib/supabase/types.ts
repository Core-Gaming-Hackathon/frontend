export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export type GameSession = {
  id: string;
  player_id: string;
  game_type: string;
  difficulty_level: number;
  stake_amount: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
  score: number | null;
  rewards_claimed: boolean;
};

export type Prediction = {
  id: number;
  creator_address: string;
  title: string;
  description: string | null;
  options: string[];
  stake_amount: number;
  total_bets: number;
  resolved_option: number | null;
  created_at: string;
  resolved_at: string | null;
  chain_id: number;
};

export type UserBet = {
  id: string;
  prediction_id: number;
  bettor_address: string;
  option_id: number;
  amount: number;
  created_at: string;
  claimed: boolean;
  tx_hash: string | null;
};