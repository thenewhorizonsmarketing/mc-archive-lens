import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    lib: {
      entry: {
        main: 'electron/main.ts',
        preload: 'electron/preload.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['electron', 'path', 'url', 'fs'],
      output: {
        entryFileNames: '[name].js',
      },
    },
    target: 'node18',
    minify: isProduction ? 'esbuild' : false,
    sourcemap: !isProduction,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
