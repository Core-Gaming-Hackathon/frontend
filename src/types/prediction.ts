export interface ContractPrediction {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  options: string[];
  stake: bigint;
  totalBets: bigint;
  resolvedOption: number;
  createdAt: bigint;
  resolvedAt: bigint;
}

export interface Prediction {
  predictionId: number;
  creator: string;
  title: string;
  description: string;
  options: { id: number; text: string }[];
  stake: string;
  totalBets: string;
  resolvedOption: number;
  chainId: number;
  txHash: string;
  createdAt: string;
  resolvedAt?: string;
} 