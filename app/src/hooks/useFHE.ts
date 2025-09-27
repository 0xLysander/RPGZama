import { useCallback, useEffect, useState } from 'react';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

export interface FHEInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  userDecrypt: (...args: any[]) => Promise<any>;
  publicDecrypt: (handles: string[]) => Promise<any>;
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (...args: any[]) => any;
}

export const useFHE = () => {
  const [fheInstance, setFheInstance] = useState<FHEInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFHE = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing FHE SDK...');

        // Initialize WASM
        await initSDK();
        console.log('SDK initialized successfully');

        // Create FHE instance with Sepolia config
        const config = {
          ...SepoliaConfig,
          network: (window as any).ethereum, // Use injected provider
        };

        const instance = await createInstance(config);
        console.log('FHE instance created:', instance);

        setFheInstance(instance);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize FHE:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFHE();
  }, []);

  const encryptChoice = useCallback(async (
    contractAddress: string,
    userAddress: string,
    choice: number
  ) => {
    if (!fheInstance) {
      throw new Error('FHE instance not initialized');
    }

    try {
      console.log('Encrypting choice:', choice);

      // Create encrypted input
      const input = fheInstance.createEncryptedInput(contractAddress, userAddress);
      input.add8(choice); // Add 8-bit integer choice (1 or 2)

      // Encrypt the input
      const encryptedInput = await input.encrypt();
      console.log('Encrypted input created:', encryptedInput);

      return {
        handle: encryptedInput.handles[0],
        inputProof: encryptedInput.inputProof
      };
    } catch (err) {
      console.error('Encryption failed:', err);
      throw new Error(`Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [fheInstance]);

  const decryptChoice = useCallback(async (
    handle: string,
    contractAddress: string,
    userAddress: string,
    signer: any
  ) => {
    if (!fheInstance) {
      throw new Error('FHE instance not initialized');
    }

    try {
      console.log('Decrypting choice for handle:', handle);

      const keypair = fheInstance.generateKeypair();
      const handleContractPairs = [
        {
          handle: handle,
          contractAddress: contractAddress,
        },
      ];

      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [contractAddress];

      const eip712 = fheInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message
      );

      const result = await fheInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        userAddress,
        startTimeStamp,
        durationDays
      );

      return result[handle];
    } catch (err) {
      console.error('Decryption failed:', err);
      throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [fheInstance]);

  const publicDecrypt = useCallback(async (handles: string[]) => {
    if (!fheInstance) {
      throw new Error('FHE instance not initialized');
    }

    try {
      console.log('Public decrypting handles:', handles);
      const result = await fheInstance.publicDecrypt(handles);
      console.log('Public decryption result:', result);
      return result;
    } catch (err) {
      console.error('Public decryption failed:', err);
      throw new Error(`Public decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [fheInstance]);

  return {
    fheInstance,
    isLoading,
    error,
    encryptChoice,
    decryptChoice,
    publicDecrypt,
  };
};