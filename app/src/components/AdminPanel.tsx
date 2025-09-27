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

  const [answers, setAnswers] = useState<Choice[]>([1, 1, 1, 1]);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const setAnswer = (idx: number, value: Choice) => {
    setAnswers((prev) => {
      const next = [...prev] as Choice[];
      next[idx] = value;
      return next;
    });
  };

  const submit = async () => {
    if (!isOwner) return;
    if (!instance || !address || !signerPromise) return;
    setSubmitting(true);
    try {
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add8(answers[0]);
      input.add8(answers[1]);
      input.add8(answers[2]);
      input.add8(answers[3]);
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
      <div className="status-card">
        <h3 className="status-title">Admin</h3>
        <p>You are not the contract owner.</p>
      </div>
    );
  }

  return (
    <div className="status-card">
      <h3 className="status-title">Initialize Answers</h3>
      <p style={{ color: '#6b7280', marginTop: 0 }}>Only owner can initialize, and only once.</p>

      <div className="status-grid" style={{ marginTop: '.5rem' }}>
        {[0,1,2,3].map((i) => (
          <div key={i} className="status-item">
            <span className="status-label">Answer {i+1}</span>
            <select
              value={answers[i]}
              onChange={(e) => setAnswer(i, Number(e.target.value) as Choice)}
              style={{ padding: '.4rem .5rem', border: '1px solid #e5e7eb', borderRadius: '.375rem' }}
            >
              <option value={1}>Yes (1)</option>
              <option value={2}>No (2)</option>
            </select>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '1rem' }}>
        <button
          onClick={submit}
          disabled={!!initialized || submitting || confirming || zamaLoading}
          className="submit-btn"
          style={{ background: initialized ? '#9ca3af' : '#3b82f6' }}
        >
          {initialized ? 'Already Initialized' : confirming ? 'Confirming...' : zamaLoading ? 'Initializing Zama...' : 'Initialize' }
        </button>
        {initialized ? <span className="hint">Answers already set.</span> : null}
      </div>
    </div>
  );
}

