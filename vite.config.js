import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  base: './',
  define: { __HERO_RUN_VERSION__: JSON.stringify(version) },
  server: { host: '0.0.0.0' },
  build: {
    target: 'es2022',
    sourcemap: true,
    manifest: true,
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
