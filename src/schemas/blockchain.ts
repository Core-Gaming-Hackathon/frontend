/**
 * Blockchain schemas and types
 */

/**
 * Blockchain transaction types
 */
export enum TransactionType {
  UNKNOWN = 'unknown',
  PREDICTION_CREATE = 'prediction_create',
  PREDICTION_BET = 'prediction_bet',
  PREDICTION_RESOLVE = 'prediction_resolve',
  PREDICTION_CLAIM = 'prediction_claim',
  PREDICTION_CANCEL = 'prediction_cancel',
  GAME_CREATE = 'game_create',
  GAME_JOIN = 'game_join',
  GAME_BET = 'game_bet',
  GAME_END = 'game_end',
  TOKEN_SWAP = 'token_swap',
  TOKEN_TRANSFER = 'token_transfer',
  CONTRACT_DEPLOY = 'contract_deploy',
  STAKE = 'stake',
  UNSTAKE = 'unstake'
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILURE = 'failure',
  UNKNOWN = 'unknown'
}

/**
 * Blockchain transaction request interface
 */
export interface BlockchainTransactionRequest<T = Record<string, unknown>> {
  type: TransactionType;
  contract?: string;
  method?: string;
  args?: Record<string, unknown> | unknown[];
  deposit?: string;
  data?: T;
}

/**
 * Blockchain transaction response interface
 */
export interface BlockchainTransactionResponse {
  txHash: string;
  status: TransactionStatus;
  type: TransactionType;
  blockHeight: number;
  gasUsed: string;
  timestamp: number;
  data: unknown | null;
}

/**
 * Blockchain network configuration interface
 */
export interface BlockchainNetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Contract address record
 */
export interface ContractAddressRecord {
  [chainId: number]: {
    [contractName: string]: string;
  };
}
