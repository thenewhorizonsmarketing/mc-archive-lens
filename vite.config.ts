import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, mkdirSync, existsSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    // Copy SQL.js wasm file for offline operation (Requirement 8.3)
    {
      name: 'copy-sql-wasm',
      closeBundle() {
        const wasmSrc = path.resolve(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm');
        const wasmDest = path.resolve(__dirname, 'dist/node_modules/sql.js/dist');
        
        if (existsSync(wasmSrc)) {
          mkdirSync(wasmDest, { recursive: true });
          copyFileSync(wasmSrc, path.join(wasmDest, 'sql-wasm.wasm'));
          console.log('✓ Copied SQL.js wasm file for offline operation');
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ensure all assets are inlined or bundled locally (Requirement 8.3)
    assetsInlineLimit: 0, // Don't inline assets, keep them as files
    rollupOptions: {
      output: {
        // Organize assets by type
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          } else if (/glb|gltf/i.test(ext)) {
            return `assets/models/[name]-[hash][extname]`;
          } else if (/ktx2?|basis/i.test(ext)) {
            return `assets/textures/[name]-[hash][extname]`;
          } else if (/wasm/i.test(ext)) {
            return `assets/wasm/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Target modern browsers for kiosk
    target: 'esnext',
    // Optimize for production
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode === 'development',
  },
  // Ensure wasm files are treated as assets
  assetsInclude: ['**/*.wasm'],
}));
