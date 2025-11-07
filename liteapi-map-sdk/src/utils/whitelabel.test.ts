import { describe, it, expect } from 'vitest';
import { buildWhitelabelUrl } from './whitelabel';
import { Buffer } from 'node:buffer';

globalThis.btoa = (value: string) => Buffer.from(value, 'utf-8').toString('base64');
globalThis.atob = (value: string) => Buffer.from(value, 'base64').toString('utf-8');

describe('buildWhitelabelUrl', () => {
  it('should build a valid Whitelabel URL with all parameters', () => {
    const params = {
      hotelId: 'lp19ebf',
      checkin: '2025-11-04',
      checkout: '2025-11-05',
      adults: 2,
    };

    const url = buildWhitelabelUrl(params);

    expect(url).toContain('/hotels/lp19ebf');
    expect(url).toContain('checkin=2025-11-04');
    expect(url).toContain('checkout=2025-11-05');
    expect(url).toContain('occupancies=');
  });

  it('should include the correct hotelId in the path', () => {
    const params = {
      hotelId: 'lp12345',
      checkin: '2025-12-25',
      checkout: '2025-12-26',
      adults: 2,
    };

    const url = buildWhitelabelUrl(params);

    expect(url).toMatch(/\/hotels\/lp12345\?/);
  });

  it('should include the correct occupancy in the path when kids are provided', () => {
    const params = {
      hotelId: 'lp12345',
      checkin: '2025-12-25',
      checkout: '2025-12-26',
      adults: 2,
      children: [3, 5],
    };

    const url = buildWhitelabelUrl(params);

    const urlObj = new URL(url);
    const occupanciesParam = urlObj.searchParams.get('occupancies');

    expect(occupanciesParam).toBeTruthy();

    // Decode and verify
    const decoded = JSON.parse(atob(occupanciesParam!));
    expect(decoded).toEqual([{ adults: 2, children: [3, 5] }]);
  });
});
