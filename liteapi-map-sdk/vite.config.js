import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'LiteAPIMap',
      formats: ['es', 'umd'],
      fileName: (format) => `liteapi-map-sdk.${format}.js`
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        globals: {}
      }
    }
  },
  server: {
    open: '/demo/index.html'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  test: {
    globals: true,
    environment: 'jsdom', // For DOM-related tests
    setupFiles: './src/test/setup.ts',
  },
});