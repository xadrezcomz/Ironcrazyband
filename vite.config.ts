import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base relativa: o build funciona na raiz de um domínio ou numa subpasta (GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/tone')) return 'tone';
          if (id.includes('@react-three') || id.includes('postprocessing')) return 'r3f';
        },
      },
    },
  },
  test: { environment: 'node' },
});
