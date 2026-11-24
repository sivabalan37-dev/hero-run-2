import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0' },
  build: {
    target: 'es2022',
    sourcemap: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-vendor',
              test: /node_modules.*three/,
            },
          ],
        },
      },
    },
  },
});
