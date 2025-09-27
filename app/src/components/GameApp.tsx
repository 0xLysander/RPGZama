import { useState } from 'react';
import { Header } from './Header';
import { GamePlay } from './GamePlay';
import { GameStatus } from './GameStatus';
import '../styles/GameApp.css';

export function GameApp() {
  const [activeTab, setActiveTab] = useState<'play' | 'status'>('play');

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
            </nav>
          </div>

          {activeTab === 'play' && <GamePlay />}
          {activeTab === 'status' && <GameStatus />}
        </div>
      </main>
    </div>
  );
}

