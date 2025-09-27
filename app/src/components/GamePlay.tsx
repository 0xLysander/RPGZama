import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/GamePlay.css';

type Choice = 1 | 2; // 1 = yes, 2 = no

export function GamePlay() {
  const { address } = useAccount();
  const { instance, isLoading: zamaLoading } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [step, setStep] = useState<number>(0);
  const [choices, setChoices] = useState<Choice[]>([1, 1, 1, 1]);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const npcs = [
    { name: 'NPC 1', prompt: 'Will you help the villagers?' },
    { name: 'NPC 2', prompt: 'Do you cross the ancient bridge?' },
    { name: 'NPC 3', prompt: 'Do you trust the stranger?' },
    { name: 'NPC 4', prompt: 'Do you enter the hidden cave?' },
  ];

  const setChoice = (idx: number, value: Choice) => {
    setChoices((prev) => {
      const next = [...prev] as Choice[];
      next[idx] = value;
      return next;
    });
    if (idx < 3) setStep(idx + 1); else setStep(4);
  };

  const submit = async () => {
    if (!instance || !address || !signerPromise) return;
    setSubmitting(true);
    try {
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add8(choices[0]);
      input.add8(choices[1]);
      input.add8(choices[2]);
      input.add8(choices[3]);
      const enc = await input.encrypt();

      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setConfirming(true);
      const tx = await contract.submitChoices(
        enc.handles[0], enc.handles[1], enc.handles[2], enc.handles[3], enc.inputProof
      );
      const rcpt = await tx.wait();
      console.log('submitChoices receipt:', rcpt?.hash);
      setDone(true);
    } catch (e) {
      console.error(e);
      alert('Submit failed');
    } finally {
      setConfirming(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="game-container">
      <div className="game-card">
        <h2 className="game-title">Encrypted RPG</h2>
        <p className="game-desc">Answer 4 questions (Yes=1 / No=2). If all correct, you earn an NFT.</p>
        <p>Your selections are encrypted. Also the right answer is encrypted.</p>
        {npcs.map((npc, idx) => (
          <div key={idx} className={`npc-block ${idx > step ? 'locked' : ''}`}>
            <div className="npc-header">
              <span className="npc-name">{npc.name}</span>
              <span className="npc-step">{idx + 1}/4</span>
            </div>
            <div className="npc-prompt">{npc.prompt}</div>
            <div className="npc-actions">
              <button disabled={idx > step} onClick={() => setChoice(idx, 1)} className={`action-btn ${choices[idx] === 1 ? 'selected' : ''}`}>Yes (1)</button>
              <button disabled={idx > step} onClick={() => setChoice(idx, 2)} className={`action-btn ${choices[idx] === 2 ? 'selected' : ''}`}>No (2)</button>
            </div>
          </div>
        ))}

        <div className="submit-row">
          <button
            className="submit-btn"
            disabled={zamaLoading || submitting || confirming || step < 4}
            onClick={submit}
          >
            {zamaLoading ? 'Initializing Zama...' : confirming ? 'Confirming...' : 'Submit Choices'}
          </button>
          {done && (
            <p className="hint">Submitted. Wait for decryption callback to mint if you won.</p>
          )}
        </div>
      </div>
    </div>
  );
}

