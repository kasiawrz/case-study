import { describe, it, expect, beforeEach, vi } from 'vitest';
import MapboxAdapter from './MapboxAdapter';
import ApiClient from '../api/client';

// Mock dependencies
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      on: vi.fn((event, callback) => {
        if (event === 'load') {
          setTimeout(callback, 0);
        }
      }),
      addControl: vi.fn(),
      remove: vi.fn(),
    })),
    NavigationControl: vi.fn(),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setPopup: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    })),
    Popup: vi.fn(() => ({
      setHTML: vi.fn().mockReturnThis(),
      on: vi.fn(),
      getElement: vi.fn(() => document.createElement('div')),
    })),
  },
}));

vi.mock('../api/client');
vi.mock('../utils/dates', () => ({
  getToday: () => '2025-11-04',
  getTomorrow: () => '2025-11-05',
}));
vi.mock('../utils/whitelabel', () => ({
  buildWhitelabelUrl: vi.fn(() => 'https://example.com'),
}));

describe('MapboxAdapter error handling', () => {
  let container: HTMLElement;
  let mockApiClient: any;

  beforeEach(() => {
    document.body.innerHTML = '<div id="test-map"></div>';
    container = document.getElementById('test-map')!;
    mockApiClient = {
      getPlace: vi.fn(),
      getHotels: vi.fn(),
      getRates: vi.fn(),
      getMapToken: vi.fn().mockResolvedValue('test-map-token'),
    };
    (ApiClient as any).mockImplementation(() => mockApiClient);
  });

  describe('initialize', () => {
    it('should throw error when place data is missing viewport', async () => {
      mockApiClient.getPlace.mockResolvedValueOnce({
        data: {
          // Missing viewport
          location: { latitude: 48.8566, longitude: 2.3522 },
        },
      });

      const adapter = new MapboxAdapter(container, {
        selector: '#test-map',
        apiUrl: 'http://test.com',
        placeId: 'test-place',
      });

      await expect(adapter.initialize()).rejects.toThrow(
        'Invalid place data received for placeId "test-place": viewport information is missing',
      );
    });

    it('should throw error when API client fails to fetch place', async () => {
      mockApiClient.getPlace.mockRejectedValueOnce(
        new Error('Failed to fetch place data for "test-place": Place not found'),
      );

      const adapter = new MapboxAdapter(container, {
        selector: '#test-map',
        apiUrl: 'http://test.com',
        placeId: 'test-place',
      });

      await expect(adapter.initialize()).rejects.toThrow(
        'Failed to fetch place data for "test-place": Place not found',
      );
    });
  });

  describe('loadHotels', () => {
    it('should handle error when hotels API fails', async () => {
      mockApiClient.getPlace.mockResolvedValueOnce({
        data: {
          viewport: {
            high: { latitude: 48.9022, longitude: 2.4699 },
            low: { latitude: 48.8156, longitude: 2.2242 },
          },
          addressComponents: [
            { types: ['locality'], longText: 'Paris' },
            { types: ['country'], shortText: 'FR' },
          ],
        },
      });

      mockApiClient.getHotels.mockRejectedValueOnce(
        new Error('Failed to fetch hotels: Network error'),
      );

      const adapter = new MapboxAdapter(container, {
        selector: '#test-map',
        apiUrl: 'http://test.com',
        placeId: 'test-place',
      });

      await adapter.initialize();

      // Wait for load event
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not throw, but log error
      expect(mockApiClient.getHotels).toHaveBeenCalled();
    });

    it('should handle error when rates API fails', async () => {
      mockApiClient.getPlace.mockResolvedValueOnce({
        data: {
          viewport: {
            high: { latitude: 48.9022, longitude: 2.4699 },
            low: { latitude: 48.8156, longitude: 2.2242 },
          },
          addressComponents: [
            { types: ['locality'], longText: 'Paris' },
            { types: ['country'], shortText: 'FR' },
          ],
        },
      });

      mockApiClient.getHotels.mockResolvedValueOnce({
        data: [{ id: 'hotel1', name: 'Test', latitude: 48.8566, longitude: 2.3522 }],
      });

      mockApiClient.getRates.mockRejectedValueOnce(
        new Error('Failed to fetch hotel rates: Invalid parameters'),
      );

      const adapter = new MapboxAdapter(container, {
        selector: '#test-map',
        apiUrl: 'http://test.com',
        placeId: 'test-place',
      });

      await adapter.initialize();

      // Wait for load event
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not throw, but log error
      expect(mockApiClient.getRates).toHaveBeenCalled();
    });

    it('should handle empty hotel data gracefully', async () => {
      mockApiClient.getPlace.mockResolvedValueOnce({
        data: {
          viewport: {
            high: { latitude: 48.9022, longitude: 2.4699 },
            low: { latitude: 48.8156, longitude: 2.2242 },
          },
          addressComponents: [
            { types: ['locality'], longText: 'Paris' },
            { types: ['country'], shortText: 'FR' },
          ],
        },
      });

      mockApiClient.getHotels.mockResolvedValueOnce({ data: [] });
      mockApiClient.getRates.mockResolvedValueOnce({ data: [] });

      const adapter = new MapboxAdapter(container, {
        selector: '#test-map',
        apiUrl: 'http://test.com',
        placeId: 'test-place',
      });

      await adapter.initialize();

      // Wait for load event
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should handle gracefully
      expect(mockApiClient.getHotels).toHaveBeenCalled();
    });
  });
});
