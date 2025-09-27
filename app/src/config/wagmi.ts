import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'RPG Zama Game',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect
  chains: [sepolia],
  ssr: false,
});