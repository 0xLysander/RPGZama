import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const WalletConnection: React.FC = () => {
  return (
    <div className="wallet-section">
      <h1>🐉 RPG Zama Adventure</h1>
      <p>Experience the first encrypted RPG game powered by Zama's FHE technology</p>
      <ConnectButton />
    </div>
  );
};

export default WalletConnection;