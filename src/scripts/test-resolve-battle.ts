import { createPublicClient, http, PublicClient, defineChain } from 'viem';
import { Abi } from 'viem';
import baultroGamesAbi from '../abis/BaultroGames.json';

// Try both contract addresses
const CONTRACT_ADDRESS = '0xf5250dD966e3ef10bbBb08878AdBB063d3879B57';
const ALT_CONTRACT_ADDRESS = '0x93012953008ef9AbcB71F48C340166E8f384e985';

// Update to check for lower IDs
const TEST_BATTLE_ID = 1; // Start with the very first battle
const CHECK_RANGE_START = 1;
const CHECK_RANGE_END = 10; // Check fewer battles to start

// Define Core Blockchain Testnet chain
const coreTestnet = defineChain({
  id: 1114,
  name: 'Core Blockchain Testnet',
  nativeCurrency: {
    name: 'tCORE2',
    symbol: 'tCORE2',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test2.btcs.network'],
    },
    public: {
      http: ['https://rpc.test2.btcs.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'CoreScan',
      url: 'https://scan.test2.btcs.network',
    },
  },
  testnet: true,
});

async function main() {
  console.log(`Testing contract interaction on Core Blockchain Testnet`);
  
  // Create a public client for Core Testnet
  const publicClient = createPublicClient({
    chain: coreTestnet,
    transport: http()
  });

  // Try both contract addresses
  const addresses = [CONTRACT_ADDRESS, ALT_CONTRACT_ADDRESS];
  
  for (const address of addresses) {
    console.log(`\nChecking contract at ${address}...`);
    
    try {
      const code = await publicClient.getBytecode({
        address: address as `0x${string}`
      });
      
      if (!code || code === '0x') {
        console.error(`Contract not found at address ${address}`);
        continue;
      }
      
      console.log(`Contract verified at ${address}`);
      
      // Check who owns the contract
      const owner = await getContractOwner(publicClient, address);
      if (owner) {
        console.log(`Contract owner is: ${owner}`);
        console.log(`To resolve battles, you must use the owner's wallet.`);
      }
      
      // Try to get a function like battleCount or platformFee to verify it's working
      try {
        // Try to read platform fee (common in most contracts)
        const platformFee = await publicClient.readContract({
          address: address as `0x${string}`,
          abi: baultroGamesAbi.abi as Abi,
          functionName: 'platformFee',
        });
        
        console.log(`Contract is valid. Platform fee: ${platformFee}`);
        
        // This contract address works, now check for battles
        if (await doesBattleExist(publicClient, address, TEST_BATTLE_ID)) {
          console.log(`Battle ${TEST_BATTLE_ID} exists, attempting to resolve it...`);
          await tryResolveBattle(publicClient, address, TEST_BATTLE_ID);
        } else {
          console.log(`Battle ${TEST_BATTLE_ID} does not exist`);
        }
        
        // Scan for existing battles
        console.log(`\nScanning for existing battles in range ${CHECK_RANGE_START}-${CHECK_RANGE_END}...`);
        await listExistingBattles(publicClient, address, CHECK_RANGE_START, CHECK_RANGE_END);

        // Display game status summary
        await showGameStatusSummary(publicClient, address);
        
        // If we get here with a valid contract, no need to try the other address
        break;
      } catch (functionError) {
        console.error(`Error reading from contract at ${address}:`, functionError);
        console.log('Trying another function or address...');
        
        // Try to call a different function like getBattle(1) to see if it works
        try {
          // Check if getMatch exists instead of getBattle
          await publicClient.readContract({
            address: address as `0x${string}`,
            abi: baultroGamesAbi.abi as Abi,
            functionName: 'getMatch',
            args: [BigInt(1)]
          });
          
          console.log(`Found 'getMatch' function instead of 'getBattle'`);
          console.log(`This could be the issue - the contract uses different function names`);
          
          // Try using getMatch instead for the rest of the operations
          // We could update our script to use getMatch instead of getBattle
          break;
        } catch (matchError) {
          const errorMsg = matchError instanceof Error ? matchError.message : String(matchError);
          console.log(`'getMatch' function also failed:`, errorMsg);
        }
      }
    } catch (contractError) {
      console.error(`Error checking contract at ${address}:`, contractError);
    }
  }
}

async function getContractOwner(publicClient: PublicClient, contractAddress: string): Promise<string | null> {
  try {
    // Try to call the owner() function
    const owner = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: baultroGamesAbi.abi as Abi,
      functionName: 'owner',
    }) as string;
    
    return owner;
  } catch (error) {
    console.log('Could not determine contract owner');
    return null;
  }
}

async function showGameStatusSummary(publicClient: PublicClient, contractAddress: string) {
  try {
    // Get total battles
    const totalBattles = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: baultroGamesAbi.abi as Abi,
      functionName: 'battleCount',
    });
    
    console.log(`\nGame Status Summary:`);
    console.log(`Total battles created: ${totalBattles}`);
    
    // Get platform fee
    const platformFee = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: baultroGamesAbi.abi as Abi,
      functionName: 'platformFee',
    });
    
    console.log(`Platform fee: ${platformFee}`);
    
    // Try to get contract balance
    try {
      const balance = await publicClient.getBalance({
        address: contractAddress as `0x${string}`,
      });
      
      console.log(`Contract balance: ${balance} wei`);
    } catch (error) {
      // Skip if we can't get balance
    }
    
  } catch (error) {
    console.log('Could not retrieve complete game status');
  }
}

async function doesBattleExist(publicClient: PublicClient, contractAddress: string, battleId: number): Promise<boolean> {
  try {
    // Try getBattle
    try {
      await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: baultroGamesAbi.abi as Abi,
        functionName: 'getBattle',
        args: [BigInt(battleId)]
      });
      return true;
    } catch (error) {
      // Try getMatch if getBattle fails
      await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: baultroGamesAbi.abi as Abi,
        functionName: 'getMatch',
        args: [BigInt(battleId)]
      });
      console.log('Found battle using getMatch instead of getBattle');
      return true;
    }
  } catch (error) {
    // Using the error to avoid linter warnings
    console.debug(`Battle ${battleId} check error:`, error);
    return false;
  }
}

async function tryResolveBattle(publicClient: PublicClient, contractAddress: string, battleId: number) {
  try {
    // First try resolveBattle with the success parameter (required!)
    try {
      // This is a read-only simulation, as actual resolution requires a wallet to sign
      const result = await publicClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: baultroGamesAbi.abi as Abi,
        functionName: 'resolveBattle',
        args: [BigInt(battleId), true], // Add the success parameter set to true
      });
      
      console.log(`Simulation of resolveBattle successful for battle ${battleId}`);
      console.log('Simulation result:', result);
      
      // If you want to actually execute the transaction, you would need a wallet client with a private key
      console.log('To actually resolve the battle, you would need to call this with a wallet client');
      console.log('Example transaction data:');
      console.log(`Contract: ${contractAddress}`);
      console.log(`Function: resolveBattle`);
      console.log(`Arguments: [${battleId}, true]`);
      
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error simulating resolveBattle: ${errorMsg}`);
      
      // Check for specific error about owner permission
      if (errorMsg.includes('Only the contract owner')) {
        console.log('\n⚠️ PERMISSION ERROR: Only the contract owner can resolve battles');
        console.log('You need to use the owner wallet to call this function');
      }
      
      // Try resolveMatch if resolveBattle fails
      console.log('Trying resolveMatch as fallback...');
      try {
        const result = await publicClient.simulateContract({
          address: contractAddress as `0x${string}`,
          abi: baultroGamesAbi.abi as Abi,
          functionName: 'resolveMatch',
          args: [BigInt(battleId), true], // Adding success parameter here too
        });
        
        console.log(`Simulation of resolveMatch successful for battle ${battleId}`);
        console.log('Simulation result:', result);
        return true;
      } catch (fallbackError) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error(`Error simulating resolveMatch: ${fallbackMsg}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error simulating resolve for battle ${battleId}:`, error);
    // Using the error to avoid linter warnings
    console.debug('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

async function listExistingBattles(publicClient: PublicClient, contractAddress: string, startId: number, endId: number) {
  let foundBattles = 0;
  let useGetMatch = false;
  
  // Try the first battle with getBattle to see if it exists
  try {
    await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: baultroGamesAbi.abi as Abi,
      functionName: 'getBattle',
      args: [BigInt(startId)]
    });
  } catch (error) {
    // If error includes "function selector was not recognized", try getMatch
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("function selector was not recognized")) {
      useGetMatch = true;
      console.log('Switching to use getMatch function instead of getBattle');
    }
  }
  
  for (let i = startId; i <= endId; i++) {
    try {
      let battle;
      
      if (useGetMatch) {
        battle = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: baultroGamesAbi.abi as Abi,
          functionName: 'getMatch',
          args: [BigInt(i)]
        });
      } else {
        battle = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: baultroGamesAbi.abi as Abi,
          functionName: 'getBattle',
          args: [BigInt(i)]
        });
      }
      
      console.log(`Found battle ${i}:`, battle);
      foundBattles++;
    } catch (error) {
      // Skip logging for battles that don't exist
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!errorMsg.includes('Battle not found') && !errorMsg.includes('Match not found')) {
        console.error(`Battle ${i} fetch error:`, error);
      }
    }
  }
  
  console.log(`Found ${foundBattles} battles out of ${endId - startId + 1} checked`);
}

main().catch(console.error); 