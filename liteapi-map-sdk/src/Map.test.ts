import { describe, it, expect, beforeEach, vi } from 'vitest';
import Map from './Map';

// Mock mapbox-gl BEFORE importing Map
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      on: vi.fn((event, callback) => {
        if (event === 'load') callback();
      }),
    })),
    NavigationControl: vi.fn(),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setPopup: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      getElement: vi.fn(() => document.createElement('div')),
    })),
    Popup: vi.fn(() => ({
      setHTML: vi.fn().mockReturnThis(),
      on: vi.fn(),
      getElement: vi.fn(() => document.createElement('div')),
    })),
  },
}));

// Mock MapboxAdapter
let mockAdapterInstance: any;
vi.mock('./adapters/MapboxAdapter', () => ({
  default: class MockMapboxAdapter {
    options: any;
    checkin: string = '';
    checkout: string = '';
    loadHotels = vi.fn().mockResolvedValue(undefined);

    constructor(container: HTMLElement, options: any) {
      this.options = { ...options };
      mockAdapterInstance = this;
    }

    async initialize() {
      return Promise.resolve();
    }
    destroy() {}
  },
}));

describe('Map initialization validation', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-map"></div>';
  });

  it('should throw error when selector is missing', async () => {
    await expect(
      Map.init({
        selector: '',
        placeId: 'test',
        apiUrl: 'http://test.com',
        mapToken: 'test',
      } as any)
    ).rejects.toThrowError('Map selector is required');
  });

  it('should throw error when apiUrl is missing', async () => {
    await expect(
      Map.init({
        selector: '#test-map',
        placeId: 'test',
        mapToken: 'test',
      } as any)
    ).rejects.toThrowError('apiUrl is required');
  });

  it('should throw error when element not found', async () => {
    await expect(
      Map.init({
        selector: '#nonexistent',
        placeId: 'test',
        apiUrl: 'http://test.com',
        mapToken: 'test',
      }),
    ).rejects.toThrow('Container element not found');
  });

  it('should throw error when no location is provided', async () => {
    await expect(
      Map.init({
        selector: '#test-map',
        apiUrl: 'http://test.com',
        mapToken: 'test',
      } as any),
    ).rejects.toThrow('Location is required');
  });

  it('should throw error when multiple locations are provided', async () => {
    await expect(
      Map.init({
        selector: '#test-map',
        placeId: 'test',
        city: { name: 'Paris', countryCode: 'FR' },
        apiUrl: 'http://test.com',
        mapToken: 'test',
      } as any),
    ).rejects.toThrow('Multiple location methods provided');
  });
});

describe('Map.updateConfig', () => {
  let mapInstance: Map;

  beforeEach(async () => {
    document.body.innerHTML = '<div id="test-map"></div>';
    mockAdapterInstance = null;

    // Create a map instance
    mapInstance = await Map.init({
      selector: '#test-map',
      placeId: 'test-place',
      apiUrl: 'http://test.com',
      mapToken: 'test-token',
      currency: 'USD',
      adults: 2,
      minRating: 8,
    });

    // Wait for async initialization to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Reset loadHotels call count from initialization
    if (mockAdapterInstance) {
      mockAdapterInstance.loadHotels.mockClear();
    }
  });

  it('should update currency and reload hotels', async () => {
    await mapInstance.updateConfig({ currency: 'EUR' });

    expect(mockAdapterInstance).toBeDefined();
    expect(mockAdapterInstance.options.currency).toBe('EUR');
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(1);
  });

  it('should update adults and reload hotels', async () => {
    await mapInstance.updateConfig({ adults: 4 });

    expect(mockAdapterInstance.options.adults).toBe(4);
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(1);
  });

  it('should update minRating and reload hotels', async () => {
    await mapInstance.updateConfig({ minRating: 9 });

    expect(mockAdapterInstance.options.minRating).toBe(9);
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(1);
  });

  it('should update guestNationality and reload hotels', async () => {
    await mapInstance.updateConfig({ guestNationality: 'FR' });

    expect(mockAdapterInstance.options.guestNationality).toBe('FR');
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(1);
  });

  it('should update checkin date and reload hotels', async () => {
    await mapInstance.updateConfig({ checkin: '2025-12-01' });

    expect(mockAdapterInstance.checkin).toBe('2025-12-01');
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(1);
  });

  it('should update checkout date and reload hotels', async () => {
    await mapInstance.updateConfig({ checkout: '2025-12-05' });

    expect(mockAdapterInstance.checkout).toBe('2025-12-05');
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(1);
  });

  it('should update multiple fields at once', async () => {
    await mapInstance.updateConfig({
      currency: 'GBP',
      adults: 3,
      minRating: 9,
      guestNationality: 'UK',
    });

    expect(mockAdapterInstance.options.currency).toBe('GBP');
    expect(mockAdapterInstance.options.adults).toBe(3);
    expect(mockAdapterInstance.options.minRating).toBe(9);
    expect(mockAdapterInstance.options.guestNationality).toBe('UK');
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(1);
  });

  it('should preserve existing options when updating', async () => {
    await mapInstance.updateConfig({ currency: 'EUR' });

    // Original options should be preserved
    expect(mockAdapterInstance.options.minRating).toBe(8);
    expect(mockAdapterInstance.options.apiUrl).toBe('http://test.com');
    expect(mockAdapterInstance.options.placeId).toBe('test-place');
    expect(mockAdapterInstance.options.mapToken).toBe('test-token');
  });

  it('should handle multiple sequential updates', async () => {
    await mapInstance.updateConfig({ currency: 'EUR' });
    await mapInstance.updateConfig({ minRating: 9 });
    await mapInstance.updateConfig({ adults: 4 });

    expect(mockAdapterInstance.options.currency).toBe('EUR');
    expect(mockAdapterInstance.options.minRating).toBe(9);
    expect(mockAdapterInstance.options.adults).toBe(4);
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(3);
  });

  it('should handle empty update object gracefully', async () => {
    await mapInstance.updateConfig({});

    // Should still call loadHotels even with no changes
    expect(mockAdapterInstance.loadHotels).toHaveBeenCalledTimes(1);
  });
});
