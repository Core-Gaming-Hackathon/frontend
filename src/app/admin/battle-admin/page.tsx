"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@/providers/evm-wallet-provider";
import { chainSelector } from "@/config/chain-selector";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { formatDistance } from "date-fns";

const CONTRACT_OWNER = "0x87f603924309889B39687AC0A1669b1E5a506E74";

interface Battle {
  id: bigint;
  creator: string;
  difficulty: number;
  stake: bigint;
  completed: boolean;
  success: boolean;
  createdAt: bigint;
  completedAt: bigint;
}

export default function BattleAdminPage() {
  const { address, isConnected, callViewMethod, callMethod, signIn } = useWallet();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBattleId, setProcessingBattleId] = useState<bigint | null>(null);
  const [totalBattles, setTotalBattles] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if the connected wallet is the contract owner
    setIsAdmin(isConnected && address?.toLowerCase() === CONTRACT_OWNER.toLowerCase());
  }, [address, isConnected]);

  useEffect(() => {
    fetchBattles();
  }, [isConnected]);

  const fetchBattles = async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get total battle count from contract
      const battleCount = await callViewMethod<number>('battleCount', [], 'baultroGames');
      setTotalBattles(battleCount);

      // Fetch all battles
      const fetchedBattles: Battle[] = [];
      for (let i = 1; i <= battleCount; i++) {
        try {
          const battle = await callViewMethod<Battle>('getBattle', [i], 'baultroGames');
          fetchedBattles.push(battle);
        } catch {
          // Skip battles that can't be fetched
          console.log(`Battle ${i} not found or error fetching`);
        }
      }

      // Sort by ID (newest first)
      setBattles(fetchedBattles.sort((a, b) => Number(b.id - a.id)));
    } catch (error) {
      console.error("Error fetching battles:", error);
      toast.error("Failed to fetch battles");
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    await signIn();
  };

  const resolveBattle = async (battleId: bigint, success: boolean) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to resolve battles");
      return;
    }

    if (!isAdmin) {
      toast.error("Only the contract owner can resolve battles");
      return;
    }

    try {
      setProcessingBattleId(battleId);
      
      // Call the resolveBattle function
      const result = await callMethod(
        'resolveBattle',
        [battleId, success],
        '0',
        chainSelector.getGameModesAddress()
      );

      if (result.success) {
        toast.success(`Battle ${battleId.toString()} resolved successfully as ${success ? "win" : "loss"}`);
        // Refresh the battles
        fetchBattles();
      } else {
        toast.error(`Failed to resolve battle: ${result.status}`);
      }
    } catch (error) {
      console.error(`Error resolving battle ${battleId}:`, error);
      toast.error("Failed to resolve battle");
    } finally {
      setProcessingBattleId(null);
    }
  };

  // Format timestamp to relative time
  const formatTime = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return "N/A";
    const date = new Date(Number(timestamp) * 1000);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  // Format stake to readable format
  const formatStake = (stake: bigint) => {
    return `${Number(stake) / 10**18} CORE`;
  };

  const renderBattleTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading battles...</span>
        </div>
      );
    }

    if (battles.length === 0) {
      return <p className="text-center p-5">No battles found.</p>;
    }

    // Filter to show unresolved battles first
    const pendingBattles = battles.filter(battle => !battle.completed);
    const completedBattles = battles.filter(battle => battle.completed);

    return (
      <Table>
        <TableCaption>
          Admin Battle Management - Total Battles: {totalBattles}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Stake</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingBattles.map((battle) => (
            <TableRow key={battle.id.toString()} className="bg-yellow-50 dark:bg-yellow-950">
              <TableCell>{battle.id.toString()}</TableCell>
              <TableCell className="font-mono text-xs">{battle.creator.substring(0, 8)}...{battle.creator.substring(36)}</TableCell>
              <TableCell>{battle.difficulty}</TableCell>
              <TableCell>{formatStake(battle.stake)}</TableCell>
              <TableCell>
                <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                  <Loader2 className="mr-1 h-4 w-4" /> Pending
                </span>
              </TableCell>
              <TableCell>{formatTime(battle.createdAt)}</TableCell>
              <TableCell>{formatTime(battle.completedAt)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                    onClick={() => resolveBattle(battle.id, true)}
                    disabled={!isAdmin || processingBattleId === battle.id}
                  >
                    {processingBattleId === battle.id ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1 h-4 w-4" />
                    )}
                    Win
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => resolveBattle(battle.id, false)}
                    disabled={!isAdmin || processingBattleId === battle.id}
                  >
                    {processingBattleId === battle.id ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-1 h-4 w-4" />
                    )}
                    Lose
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {completedBattles.map((battle) => (
            <TableRow key={battle.id.toString()}>
              <TableCell>{battle.id.toString()}</TableCell>
              <TableCell className="font-mono text-xs">{battle.creator.substring(0, 8)}...{battle.creator.substring(36)}</TableCell>
              <TableCell>{battle.difficulty}</TableCell>
              <TableCell>{formatStake(battle.stake)}</TableCell>
              <TableCell>
                {battle.success ? (
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="mr-1 h-4 w-4" /> Success
                  </span>
                ) : (
                  <span className="flex items-center text-red-600 dark:text-red-400">
                    <XCircle className="mr-1 h-4 w-4" /> Failed
                  </span>
                )}
              </TableCell>
              <TableCell>{formatTime(battle.createdAt)}</TableCell>
              <TableCell>{formatTime(battle.completedAt)}</TableCell>
              <TableCell>
                <span className="text-gray-400">Resolved</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Battle Admin Dashboard</h1>
        <div className="flex items-center">
          {isAdmin && (
            <div className="flex items-center mr-4 bg-green-100 dark:bg-green-900 rounded-full px-3 py-1">
              <Shield className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400">Admin Access</span>
            </div>
          )}
          {!isConnected ? (
            <Button onClick={connectWallet}>Connect Wallet</Button>
          ) : (
            <div className="font-mono text-sm">
              {address?.substring(0, 6)}...{address?.substring(38)}
            </div>
          )}
        </div>
      </div>

      {isConnected && !isAdmin && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 mb-6 rounded-md">
          ⚠️ Warning: You are not the contract owner. Only the contract owner can resolve battles.
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Battles</h2>
            <Button 
              onClick={fetchBattles} 
              variant="outline" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {renderBattleTable()}
        </div>
      </div>
    </div>
  );
} 