import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import '../styles/GameStatus.css';

export function GameStatus() {
  const { address } = useAccount();

  const { data: status } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getStatus',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  if (!address) {
    return (
      <div className="status-container">
        <div className="status-card">
          <p>Please connect your wallet to view status.</p>
        </div>
      </div>
    );
  }

  const submitted = !!status && (status as any)[0] as boolean;
  const pending = !!status && (status as any)[1] as boolean;
  const won = !!status && (status as any)[2] as boolean;
  const bal = (balance as any)?.toString?.() ?? '0';

  return (
    <div className="status-container">
      <div className="status-card">
        <h3 className="status-title">Your Game Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Submitted</span>
            <span className="status-value">{submitted ? 'Yes' : 'No'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Decryption Pending</span>
            <span className="status-value">{pending ? 'Yes' : 'No'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Winner</span>
            <span className="status-value winner">{won ? 'Yes' : 'No'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">NFT Balance</span>
            <span className="status-value">{bal}</span>
          </div>
        </div>
        <p className="status-hint">If you won, the contract mints an NFT to you after decryption.</p>
      </div>
    </div>
  );
}

