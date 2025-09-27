import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Header } from './Header';
import { GamePlay } from './GamePlay';
import { GameStatus } from './GameStatus';
import { AdminPanel } from './AdminPanel';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import '../styles/GameApp.css';

export function GameApp() {
  const [activeTab, setActiveTab] = useState<'play' | 'status'>('play');
  const { address } = useAccount();
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  } as any);
  const isOwner = !!address && !!owner && (address as string).toLowerCase() === (owner as string).toLowerCase();

  return (
    <div className="game-app">
      <Header />
      <main className="main-content">
        <div>
          <div className="tab-navigation">
            <nav className="tab-nav">
              <button
                onClick={() => setActiveTab('play')}
                className={`tab-button ${activeTab === 'play' ? 'active' : 'inactive'}`}
              >
                Play
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`tab-button ${activeTab === 'status' ? 'active' : 'inactive'}`}
              >
                Status
              </button>
              {isOwner && (
                <button
                  onClick={() => setActiveTab('admin' as any)}
                  className={`tab-button ${activeTab === ('admin' as any) ? 'active' : 'inactive'}`}
                >
                  Admin
                </button>
              )}
            </nav>
          </div>

          {activeTab === 'play' && <GamePlay />}
          {activeTab === 'status' && <GameStatus />}
          {isOwner && (activeTab as any) === 'admin' && <AdminPanel />}
        </div>
      </main>
    </div>
  );
}
