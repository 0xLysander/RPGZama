import React from 'react';
import { useAccount } from 'wagmi';
import WalletConnection from './WalletConnection';
import NPCCard from './NPCCard';
import GameStatus from './GameStatus';
import { useRPGContract } from '../hooks/useRPGContract';

const Game: React.FC = () => {
  const { isConnected } = useAccount();
  const {
    gameState,
    questions,
    isLoading,
    error,
    makeChoice,
    resetGame,
    getCurrentQuestion
  } = useRPGContract();

  if (!isConnected) {
    return <WalletConnection />;
  }

  const npcs = questions.map((question, index) => ({
    id: index,
    name: `NPC ${index + 1}`,
    question,
    completed: index < gameState.currentNPC
  }));

  return (
    <div className="game-container">
      <WalletConnection />

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <GameStatus gameState={gameState} />

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Processing your choice...</p>
        </div>
      )}

      <div className="npcs-container">
        {npcs.map((npc) => (
          <NPCCard
            key={npc.id}
            npc={npc}
            isCurrent={npc.id === gameState.currentNPC && !gameState.gameCompleted}
            isCompleted={npc.completed}
            onChoice={makeChoice}
            isLoading={isLoading}
          />
        ))}
      </div>

      {gameState.gameCompleted && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            className="wallet-button"
            onClick={resetGame}
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Play Again'}
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px', color: '#ccc' }}>
        <p>Powered by Zama's Fully Homomorphic Encryption</p>
        <p>Your choices are encrypted and remain private throughout the game</p>
      </div>
    </div>
  );
};

export default Game;