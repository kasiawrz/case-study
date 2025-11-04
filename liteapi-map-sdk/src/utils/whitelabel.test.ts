import { describe, it, expect } from 'vitest';
import { buildWhitelabelUrl } from './whitelabel';

describe('buildWhitelabelUrl', () => {
  it('should build a valid Whitelabel URL with all parameters', () => {
    const params = {
      hotelId: 'lp19ebf',
      placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
      checkin: '2025-11-04',
      checkout: '2025-11-05',
      adults: 2,
    };

    const url = buildWhitelabelUrl(params);

    expect(url).toContain('/hotels/lp19ebf');
    expect(url).toContain('placeId=ChIJD7fiBh9u5kcRYJSMaMOCCwQ');
    expect(url).toContain('checkin=2025-11-04');
    expect(url).toContain('checkout=2025-11-05');
    expect(url).toContain('occupancies=');
  });

  it('should include the correct hotelId in the path', () => {
    const params = {
      hotelId: 'lp12345',
      placeId: 'Amsterdam',
      checkin: '2025-12-25',
      checkout: '2025-12-26',
      adults: 2,
    };

    const url = buildWhitelabelUrl(params);

    expect(url).toMatch(/\/hotels\/lp12345\?/);
  });
});
