import React from 'react';
import { GameState } from '../types';

interface GameStatusProps {
  gameState: GameState;
}

const GameStatus: React.FC<GameStatusProps> = ({ gameState }) => {
  const progress = (gameState.currentNPC / gameState.totalNPCs) * 100;

  return (
    <div className="game-status">
      <h2>Quest Progress</h2>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p>
        NPC {gameState.currentNPC} of {gameState.totalNPCs} completed
      </p>

      {gameState.gameCompleted && (
        <div className="game-completed">
          <h3>🎉 Quest Complete! 🎉</h3>
          {gameState.hasWonNFT ? (
            <div className="nft-reward">
              <h4>🏆 Congratulations! 🏆</h4>
              <p>You've won an NFT reward! All your choices were correct.</p>
              <p>NFTs owned: {gameState.nftBalance}</p>
            </div>
          ) : (
            <div>
              <p>You've completed the quest, but didn't get all answers right.</p>
              <p>Try again to win the NFT reward!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameStatus;