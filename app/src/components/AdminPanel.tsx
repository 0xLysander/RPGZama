import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Contract } from 'ethers';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';

type Choice = 1 | 2;

export function AdminPanel() {
  const { address } = useAccount();
  const { instance, isLoading: zamaLoading } = useZamaInstance();
  const signerPromise = useEthersSigner();

  // Read owner and initialized flags via viem
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  const { data: initialized } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'initialized',
  });

  const isOwner =
    !!address && !!owner && (address as string).toLowerCase() === (owner as string).toLowerCase();

  const [answers, setAnswers] = useState<Array<Choice | null>>([null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const setAnswer = (idx: number, value: Choice) => {
    setAnswers((prev) => {
      const next = [...prev] as Choice[];
      (next as Array<Choice | null>)[idx] = value;
      return next;
    });
  };

  const submit = async () => {
    if (!isOwner) return;
    if (!instance || !address || !signerPromise) return;
    if (answers.some((a) => a === null)) return;
    setSubmitting(true);
    try {
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add8(answers[0] as Choice);
      input.add8(answers[1] as Choice);
      input.add8(answers[2] as Choice);
      input.add8(answers[3] as Choice);
      const enc = await input.encrypt();

      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setConfirming(true);
      const tx = await contract.initializeAnswers(
        enc.handles[0], enc.handles[1], enc.handles[2], enc.handles[3], enc.inputProof
      );
      await tx.wait();
      alert('Initialized answers successfully');
    } catch (e) {
      console.error(e);
      alert('Initialization failed');
    } finally {
      setConfirming(false);
      setSubmitting(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="status-container">
        <div className="status-card">
          <h3 className="status-title">🛡️ Admin Panel</h3>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)', opacity: 0.6 }}>🔒</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Access denied. You are not the contract owner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-container">
      <div className="status-card">
        <h3 className="status-title">🛡️ Initialize Answers</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: 0, textAlign: 'center', fontSize: '1.1rem' }}>
          Only the contract owner can initialize answers, and only once.
        </p>

        <div className="status-grid" style={{ marginTop: 'var(--spacing-xl)' }}>
          {[0,1,2,3].map((i) => (
            <div key={i} className="status-item">
              <span className="status-label">🎯 Answer {i+1}</span>
              <select
                value={answers[i] ?? ''}
                onChange={(e) => setAnswer(i, Number(e.target.value) as Choice)}
              >
                <option value="" disabled>Select Answer</option>
                <option value={1}>✅ Yes (1)</option>
                <option value={2}>❌ No (2)</option>
              </select>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-2xl)', paddingTop: 'var(--spacing-xl)', borderTop: '1px solid var(--card-border)' }}>
          <button
            onClick={submit}
            disabled={!!initialized || submitting || confirming || zamaLoading || answers.some((a) => a === null)}
            className="submit-btn"
          >
            {initialized ? '✅ Already Initialized' :
             confirming ? '⏳ Confirming Transaction...' :
             zamaLoading ? '🔄 Initializing Zama...' :
             answers.some((a) => a === null) ? '📝 Select All Answers' :
             '🚀 Initialize Answers' }
          </button>
          {initialized ? (
            <div className="hint">
              ✅ Answers have been successfully initialized and encrypted.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
