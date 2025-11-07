import { beforeAll } from 'vitest';
import crypto from 'crypto';
import { URLSearchParams } from 'url';

// Polyfill crypto.getRandomValues for jsdom
beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    (globalThis as any).crypto = crypto.webcrypto;
  }
  // Polyfill URLSearchParams for jsdom
  if (typeof globalThis.URLSearchParams === 'undefined') {
    (globalThis as any).URLSearchParams = URLSearchParams;
  }
});
