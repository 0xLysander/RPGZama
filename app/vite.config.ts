import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    fallback: {
      'tfhe_bg.wasm': require.resolve('@zama-fhe/relayer-sdk/tfhe/tfhe_bg.wasm'),
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    host: true
  }
})