import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useFHE } from './useFHE';
import { GameState } from '../types';

// Contract ABI - Update this with the actual ABI after contract compilation
const RPG_ABI = [
  {
    "inputs": [
      {"name": "player", "type": "address"}
    ],
    "name": "getCurrentNPC",
    "outputs": [
      {"name": "npcId", "type": "uint8"},
      {"name": "question", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "encryptedChoice", "type": "uint256"},
      {"name": "inputProof", "type": "bytes"}
    ],
    "name": "makeChoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "player", "type": "address"}
    ],
    "name": "getGameStats",
    "outputs": [
      {"name": "progress", "type": "uint8"},
      {"name": "completedGame", "type": "bool"},
      {"name": "wonNFT", "type": "bool"},
      {"name": "nftBalance", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllQuestions",
    "outputs": [
      {"name": "", "type": "string[4]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestWinCheck",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resetGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = "0x..."; // Will be updated after deployment

export const useRPGContract = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { encryptChoice, isLoading: fheLoading, error: fheError } = useFHE();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentNPC: 0,
    totalNPCs: 4,
    gameCompleted: false,
    hasWonNFT: false,
    nftBalance: 0
  });

  // Mock data for now - replace with actual contract calls
  const [questions] = useState<string[]>([
    "Ancient Guardian: 'Do you seek the path of wisdom over strength?'",
    "Mystical Oracle: 'Will you sacrifice your comfort for others' wellbeing?'",
    "Shadow Merchant: 'Do you believe honesty is more valuable than gold?'",
    "Forest Spirit: 'Would you protect nature even if it costs you personally?'"
  ]);

  const makeChoice = useCallback(async (npcId: number, choice: number) => {
    if (!address || !walletClient) {
      setError('Wallet not connected');
      return;
    }

    if (fheLoading) {
      setError('FHE system is still loading');
      return;
    }

    if (fheError) {
      setError(`FHE Error: ${fheError}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Making choice ${choice} for NPC ${npcId}`);

      // Encrypt the choice
      const encryptedData = await encryptChoice(CONTRACT_ADDRESS, address, choice);

      console.log('Encrypted choice data:', encryptedData);

      // For now, simulate the contract call
      // In real implementation, this would be:
      /*
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: RPG_ABI,
        functionName: 'makeChoice',
        args: [encryptedData.handle, encryptedData.inputProof],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      */

      // Simulate successful transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local game state
      setGameState(prev => {
        const newState = {
          ...prev,
          currentNPC: Math.min(prev.currentNPC + 1, prev.totalNPCs),
          gameCompleted: prev.currentNPC + 1 >= prev.totalNPCs
        };

        // Simulate NFT win check
        if (newState.gameCompleted) {
          // For demo purposes, randomly determine if player won
          const hasWon = Math.random() > 0.5;
          newState.hasWonNFT = hasWon;
          newState.nftBalance = hasWon ? 1 : 0;
        }

        return newState;
      });

      console.log('Choice submitted successfully');

    } catch (err) {
      console.error('Failed to make choice:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit choice');
    } finally {
      setIsLoading(false);
    }
  }, [address, walletClient, encryptChoice, fheLoading, fheError]);

  const resetGame = useCallback(async () => {
    if (!gameState.gameCompleted) {
      setError('Game not completed yet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For now, simulate the contract call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGameState({
        currentNPC: 0,
        totalNPCs: 4,
        gameCompleted: false,
        hasWonNFT: false,
        nftBalance: 0
      });

      console.log('Game reset successfully');
    } catch (err) {
      console.error('Failed to reset game:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset game');
    } finally {
      setIsLoading(false);
    }
  }, [gameState.gameCompleted]);

  const getCurrentQuestion = useCallback(() => {
    if (gameState.currentNPC >= questions.length) {
      return "Game completed!";
    }
    return questions[gameState.currentNPC];
  }, [gameState.currentNPC, questions]);

  return {
    gameState,
    questions,
    isLoading: isLoading || fheLoading,
    error: error || fheError,
    makeChoice,
    resetGame,
    getCurrentQuestion,
    contractAddress: CONTRACT_ADDRESS
  };
};