import react from '@vitejs/plugin-react';
import { Plugin, defineConfig } from 'vite';
import { resolve } from 'path';
import firebaseConfig from '../firebase-config.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    transformHtmlPlugin({ webUrl: firebaseConfig.webUrl }),
  ],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared/src'),
      '@shared/firestore-adapter': resolve(__dirname, './src/firestore-adapter'),
    },
  },
  // The following scrip keeps file names without hashes.
  // Thanks to https://www.fabiofranchino.com/log/how-to-remove-hashing-in-vite-built-file-names/
  // But we need the hashes so that browsers don't cache modified files.
  // build: {
  //   rollupOptions: {
  //     output: {
  //       entryFileNames: `assets/[name].js`,
  //       chunkFileNames: `assets/[name].js`,
  //       assetFileNames: `assets/[name].[ext]`
  //     }
  //   }
  // }
})

/**
 * From https://stackoverflow.com/a/75644929/1093712
 * Given input { key: value }, replaces string $key$ with value in html.
 */
function transformHtmlPlugin(data: any): Plugin {
  return {
    name: 'transform-html',
    transformIndexHtml: {
      enforce: 'pre',
      transform(this, html) {
        return html.replace(
          /\$(\w+)\$/gi,
          (match, p1) => data[p1] || ''
        );
      }
    }
  }
};