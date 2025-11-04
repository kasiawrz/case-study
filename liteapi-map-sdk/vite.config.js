import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'LiteAPIMap',
      formats: ['es', 'umd'],
      fileName: (format) => `liteapi-map-sdk.${format}.js`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        globals: {},
      },
    },
    // Strip console statements in production builds (only console.log, warn/error kept)
    minify: 'esbuild',
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console'] : [],
    },
  },
  server: {
    open: '/demo/index.html',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
