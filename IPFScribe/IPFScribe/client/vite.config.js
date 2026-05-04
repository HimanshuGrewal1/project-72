import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
export default defineConfig({
  plugins: [
    nodePolyfills(),
    react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    // This forces Vite to pre-bundle these libraries into ESM
    include: ['tslib', '@lit-protocol/lit-node-client'],
  },
  build: {
    commonjsOptions: {
      include: [/tslib/, /node_modules/],
    },
  },
});