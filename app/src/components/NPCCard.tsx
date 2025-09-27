import React from 'react';
import { NPC, CHOICES } from '../types';

interface NPCCardProps {
  npc: NPC;
  isCurrent: boolean;
  isCompleted: boolean;
  onChoice: (npcId: number, choice: number) => void;
  isLoading: boolean;
}

const NPCCard: React.FC<NPCCardProps> = ({
  npc,
  isCurrent,
  isCompleted,
  onChoice,
  isLoading
}) => {
  const npcNames = [
    "Ancient Guardian",
    "Mystical Oracle",
    "Shadow Merchant",
    "Forest Spirit"
  ];

  return (
    <div className={`npc-card ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}>
      <div className="npc-title">
        {npcNames[npc.id]} {isCompleted && '✓'}
      </div>
      <div className="npc-question">
        {npc.question}
      </div>

      {isCurrent && !isCompleted && (
        <div className="choice-buttons">
          {CHOICES.map((choice) => (
            <button
              key={choice.value}
              className={`choice-btn ${choice.value === 2 ? 'no' : ''}`}
              onClick={() => onChoice(npc.id, choice.value)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : (
                choice.label
              )}
            </button>
          ))}
        </div>
      )}

      {isCompleted && (
        <div style={{ textAlign: 'center', color: '#4CAF50', fontWeight: 'bold' }}>
          Choice Made!
        </div>
      )}
    </div>
  );
};

export default NPCCard;