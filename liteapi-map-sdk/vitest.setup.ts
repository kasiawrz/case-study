import { beforeAll } from 'vitest';
import crypto from 'crypto';

// Polyfill crypto.getRandomValues for jsdom
beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    (globalThis as any).crypto = crypto.webcrypto;
  }
});
