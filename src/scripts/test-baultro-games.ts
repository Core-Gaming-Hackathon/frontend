import { createPublicClient, createWalletClient, http, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import baultroGamesAbi from '../abis/BaultroGames.json';
import { toWei } from '../utils/token-utils';

// Contract address on Core DAO Testnet v2
const CONTRACT_ADDRESS = '0x93012953008ef9AbcB71F48C340166E8f384e985';

// Core DAO Testnet v2 chain configuration
const chain = {
  id: 1114,
  name: 'Core Blockchain Testnet',
  rpcUrls: {
    default: { http: ['https://rpc.test2.btcs.network'] },
    public: { http: ['https://rpc.test2.btcs.network'] }
  },
  nativeCurrency: {
    name: 'tCORE2',
    symbol: 'tCORE2',
    decimals: 18
  },
  blockExplorers: {
    default: { name: 'CoreScan', url: 'https://scan.test2.btcs.network' }
  }
};

// Create a public client for reading from the blockchain
const publicClient = createPublicClient({
  chain,
  transport: http()
});

// Test private key from .env file
const privateKey = process.env.TEST_PRIVATE_KEY || '62a4aee1127cc4d7ed304d4d3dcd9190e5891f05389c2d8a4daf161a02b0369d';
const account = privateKeyToAccount(`0x${privateKey}`);

// Create a wallet client for writing to the blockchain
const walletClient = createWalletClient({
  chain,
  transport: http(),
  account
});

async function main() {
  try {
    console.log('Running BaultroGames contract tests...');
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);
    console.log(`Account address: ${account.address}`);

    // Try different difficulty values and stake amounts
    const testCases = [
      { difficulty: 3, stakeAmount: '0.01', description: 'Easy difficulty with 0.01 CORE' },
      { difficulty: 5, stakeAmount: '0.05', description: 'Medium difficulty with 0.05 CORE' },
      { difficulty: 7, stakeAmount: '0.1', description: 'Hard difficulty with 0.1 CORE' },
      { difficulty: 10, stakeAmount: '0.2', description: 'Expert difficulty with 0.2 CORE' }
    ];

    for (const testCase of testCases) {
      console.log(`\n\nTesting: ${testCase.description}`);
      console.log('----------------------------------------');
      
      try {
        // 1. Simulate creating a battle
        console.log('\n1. Simulating battle creation...');
        const stakeAmountWei = toWei(testCase.stakeAmount);

        try {
          const { request } = await publicClient.simulateContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: baultroGamesAbi.abi,
            functionName: 'createBattle',
            args: [testCase.difficulty],
            account: account.address,
            value: BigInt(stakeAmountWei.toString())
          });
          
          console.log('Battle creation simulation successful!');
          console.log('Simulation details:', request);
          
          // 2. Actually create a battle
          console.log('\n2. Creating a battle...');
          const hash = await walletClient.writeContract(request);
          console.log(`Transaction sent with hash: ${hash}`);
          
          // 3. Wait for transaction receipt
          console.log('\n3. Waiting for transaction receipt...');
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          console.log('Transaction receipt:', receipt);
          
          // 4. Extract battle ID from logs
          console.log('\n4. Extracting battle ID from logs...');
          const battleCreatedEvents = receipt.logs
            .map(log => {
              try {
                // Use the imported decodeEventLog function
                return decodeEventLog({
                  abi: baultroGamesAbi.abi,
                  data: log.data,
                  topics: log.topics,
                });
              } catch (decodeError) {
                console.error('Failed to decode event log:', decodeError);
                return null;
              }
            })
            .filter(event => event && event.eventName === 'BattleCreated');
          
          if (battleCreatedEvents.length > 0 && 
              battleCreatedEvents[0] && 
              'args' in battleCreatedEvents[0] && 
              battleCreatedEvents[0].args && 
              'battleId' in battleCreatedEvents[0].args) {
            const battleId = Number(battleCreatedEvents[0].args.battleId);
            console.log(`Battle created with ID: ${battleId}`);
            
            // 5. Get battle details
            console.log('\n5. Getting battle details...');
            const battle = await publicClient.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: baultroGamesAbi.abi,
              functionName: 'getBattle',
              args: [BigInt(battleId)]
            });
            console.log('Battle details:', battle);
            
            // 6. Resolve the battle
            console.log('\n6. Resolving the battle...');
            const resolveHash = await walletClient.writeContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: baultroGamesAbi.abi,
              functionName: 'resolveBattle',
              args: [BigInt(battleId), true] // true = success
            });
            console.log(`Resolve transaction sent with hash: ${resolveHash}`);
            
            // 7. Wait for resolve transaction receipt
            console.log('\n7. Waiting for resolve transaction receipt...');
            const resolveReceipt = await publicClient.waitForTransactionReceipt({ hash: resolveHash });
            console.log('Resolve transaction receipt:', resolveReceipt);
            
            // 8. Get updated battle details
            console.log('\n8. Getting updated battle details...');
            const updatedBattle = await publicClient.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: baultroGamesAbi.abi,
              functionName: 'getBattle',
              args: [BigInt(battleId)]
            });
            console.log('Updated battle details:', updatedBattle);
          } else {
            console.log('No battle ID found in events');
          }
        } catch (error) {
          console.error('Error in contract interaction:', error);
          
          // Try to extract revert reason if available
          if (error instanceof Error) {
            const errorMessage = error.message;
            console.log('Error message:', errorMessage);
            
            const revertMatch = errorMessage.match(/reverted: ([^"]+)/);
            if (revertMatch && revertMatch[1]) {
              console.log('Revert reason:', revertMatch[1]);
            }
          }
        }
      } catch (error) {
        console.error(`Test case failed: ${testCase.description}`, error);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 