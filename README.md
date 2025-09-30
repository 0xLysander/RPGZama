# RPGZama — Encrypted RPG with FHE + NFT Reward

RPGZama is a privacy‑preserving on‑chain mini‑RPG built with Zama’s FHEVM. Players talk to 4 NPCs in sequence and make binary choices (Yes=1 / No=2). Both the player’s choices and the game’s correct answers are fully encrypted on‑chain using Zama’s FHE. If and only if all 4 choices match the encrypted answers, the contract mints an ERC‑721 reward NFT to the player.

The game demonstrates how fully homomorphic encryption enables fair, verifiable game logic without revealing private inputs or the correct solution to the public mempool or chain state.

## Why It Matters

- Privacy by default: Player selections and the creator’s answers remain encrypted on‑chain.
- Fairness and anti‑spoofing: Correctness is evaluated homomorphically; there’s no plaintext oracle or vulnerable off‑chain comparison.
- Trust‑minimized UX: Decryption only reveals the minimal outcome (win/lose) via Zama’s oracle verification, not the underlying secrets.
- Composable NFT reward: Winners receive an ERC‑721 that can integrate with wider ecosystems.

## Core Gameplay

- 4 NPCs, sequential progression. You can only talk to NPC n+1 after answering NPC n.
- Binary choices per NPC: Yes=1, No=2.
- 8 possible outcomes; exactly one path yields the NFT reward.
- Creator encrypts and sets the 4 correct answers once at contract initialization.
- Players submit 4 encrypted choices; if all match, the contract mints an NFT after the decryption callback confirms the result.

## Architecture

- On‑chain confidential logic using Zama FHEVM primitives.
- Contract stores encrypted answers (`euint8[4]`), compares them to encrypted inputs using `FHE.eq` and boolean composition.
- Public outcome is revealed through Zama’s decryption request + oracle callback, which verifies signatures before minting.
- Minimal ERC‑721 implementation mints a reward NFT to the winner.

## Tech Stack

- Smart contracts: Solidity + Hardhat, Zama FHEVM (`@fhevm/solidity`, `@fhevm/hardhat-plugin`).
- Frontend: React + Vite + RainbowKit + Wagmi/viem for reads, ethers.js for writes.
- Package manager: npm.

## Repository Structure

- `contracts` — RPGZama core contract (encrypted game + minimal ERC‑721).
- `deploy` — Hardhat deployment scripts for local and Sepolia networks.
- `tasks` — Hardhat tasks to initialize encrypted answers and submit encrypted choices.
- `test` — FHEVM example tests (template counter). RPGZama tasks drive main flows.
- `app` — Frontend application (no Tailwind; viem for reads, ethers for writes).
- `deployments/sepolia` — Canonical address + ABI artifacts used by the frontend.

Key files for reference:
- `contracts/RPGZama.sol:1` — Contract implementing encrypted comparisons and NFT minting.
- `deploy/00_deploy_rpg.ts:1` — Deployment script for `RPGZama`.
- `tasks/setupGame.ts:1` — Tasks: `rpg:init-answers` and `rpg:submit`.
- `app/src/components/GamePlay.tsx:1` — Encrypted choice submission flow (ethers writes).
- `app/src/components/GameStatus.tsx:1` — User status and NFT balance (viem reads).
- `app/src/components/AdminPanel.tsx:1` — Owner‑only answer initialization (single‑use).
- `app/src/config/contracts.ts:1` — Address + ABI synced from `deployments/sepolia`.
- `app/src/config/wagmi.ts:1` — Chain config (Sepolia) + WalletConnect projectId.

## Smart Contracts

Contract: `RPGZama`
- Initialize answers: `initializeAnswers(externalEuint8[4], bytes inputProof)` — owner‑only, callable once. Saves encrypted correct answers.
- Submit choices: `submitChoices(externalEuint8[4], bytes inputProof)` — compares encrypted inputs against encrypted answers and issues a decryption request.
- Decryption callback: `decryptionCallback(uint256 requestId, bytes cleartexts, bytes decryptionProof)` — verifies proof; if the result is true and the user hasn’t won before, mints an NFT.
- View state: `getStatus(address)` returns `(submitted, pending, won)`; `balanceOf(address)` exposes ERC‑721 balance; `getLastAllCorrect(address)` returns encrypted last result for the user.

Security and privacy notes
- View methods never rely on `msg.sender`; all user‑specific reads accept an explicit address.
- Encrypted values are compared entirely within FHE; neither answers nor choices are revealed.
- Only the minimal boolean outcome (win/lose) is publicly revealed through the decryption fulfillment.

## Frontend

- Network: Configured for Sepolia only. Do not use localhost in the UI.
- Reads: viem via Wagmi hooks (e.g., `useReadContract`).
- Writes: ethers.js with a signer (e.g., `new Contract(address, abi, signer)`).
- Wallet: RainbowKit + WalletConnect. Set `projectId` in `app/src/config/wagmi.ts:1`.
- ABI source of truth: Copy from `deployments/sepolia/RPGZama.json:1` into `app/src/config/contracts.ts:1` (address + ABI). The frontend must not import JSON files directly.
- No Tailwind and no localStorage usage.

User flow
- Connect wallet on Sepolia.
- Answer 4 NPC prompts sequentially (Yes=1 / No=2) — the UI enforces the order.
- Submit choices; the app encrypts inputs client‑side via Zama and sends a single transaction.
- Wait for decryption fulfillment; if you’re a winner, the contract mints the NFT to your address.

## Getting Started

Prerequisites
- Node.js 20+
- An Ethereum RPC provider (e.g., Infura) for Sepolia
- A funded Sepolia account for deployments and submissions

Install dependencies

```
npm install
```

Environment variables
- Create a `.env` at repo root with the following keys (do not commit secrets):
  - `PRIVATE_KEY` — Deployer private key (no `0x` prefix).
  - `INFURA_API_KEY` — For Sepolia RPC access.
  - `ETHERSCAN_API_KEY` — Optional, for verification.

Compile

```
npm run compile
```

Deploy to Sepolia

```
npx hardhat deploy --network sepolia
```

After deployment, sync the frontend address and ABI
- Open `deployments/sepolia/RPGZama.json:1` and copy:
  - `address` → `app/src/config/contracts.ts:1` `CONTRACT_ADDRESS`
  - `abi` → `app/src/config/contracts.ts:1` `CONTRACT_ABI`

Initialize encrypted answers (owner‑only, exactly once)

```
# Example: answers 1,2,1,2 (Yes, No, Yes, No)
npx hardhat --network sepolia rpg:init-answers --a1 1 --a2 2 --a3 1 --a4 2
```

Submit encrypted choices (any player)

```
# Example submission
npx hardhat --network sepolia rpg:submit --c1 1 --c2 2 --c3 1 --c4 2
```

Run the frontend (Sepolia only)

```
cd app
npm install
# Set WalletConnect projectId in app/src/config/wagmi.ts
npm run dev
```

Open the URL printed by Vite and ensure your wallet is connected to Sepolia.

## Problems Solved

- Confidential inputs on public blockchains: Players’ choices and the game’s answer key remain private yet verifiable.
- Front‑running resistance: No plaintext secrets exist on‑chain or in mempool transactions.
- Minimal disclosure: The only revealed information is the final boolean outcome that triggers NFT minting.
- Simple dev workflow: Hardhat tasks and a small React app demonstrate end‑to‑end encrypted interactions.
- Composability: The reward NFT can be used by other contracts and apps.

## Operational Notes

- Frontend constraints: No Tailwind, no localStorage, no localhost chain. Reads via viem, writes via ethers.
- ABI hygiene: Always copy address + ABI from `deployments/sepolia` after redeploys.
- Gas and funds: Ensure the deployer and players have Sepolia ETH.
- Zama initialization: Frontend initializes Zama client before encrypting inputs; wait for it to be ready.

## Testing

- Template tests for `FHECounter` are included under `test/`. They illustrate FHEVM testing patterns.
- RPGZama flows are exercised via Hardhat tasks (`rpg:init-answers`, `rpg:submit`) and the frontend UI.

Run tests

```
npm test
```

Note: Some template tests are intended for the local FHEVM mock; Sepolia‑specific behavior is covered by on‑network interactions and the decryption callback.

## Roadmap

- NFT metadata and reveal: Add token URI, artwork, and on‑chain reveal mechanics.
- Richer narratives: More NPCs, branching paths, and encrypted score/flags.
- Multi‑reward modes: Tiered rewards or soulbound achievements based on partial correctness.
- Gas optimizations: Batch encryption handles and calldata size reductions where possible.
- Enhanced UX: Progress indicators for decryption callback, notifications, and history.
- Security hardening: Replay protection and more granular rate limits for submissions.
- Multi‑chain: Extend to other FHEVM‑enabled networks as they become available.

## Troubleshooting

- Zama client not ready: Wait for the frontend to finish initializing the Zama instance before submitting.
- Invalid inputProof: Ensure you encrypt with the contract address and the connected account before calling the contract.
- Decryption pending: The callback is asynchronous; status shows `pending` until the oracle fulfills the request.
- Incorrect chain: The app only supports Sepolia; switch your wallet network accordingly.
- Insufficient funds: Both initializing answers and submitting choices require gas on Sepolia.

## License

See the [LICENSE](LICENSE) file in this repository.

## Acknowledgments

- Zama FHEVM and tooling (`@fhevm/solidity`, `@fhevm/hardhat-plugin`).
- RainbowKit, Wagmi/viem, and ethers.js for a smooth wallet and contract UX.
