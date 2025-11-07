import { describe, it, expect, beforeEach, vi } from 'vitest';
import ApiClient from './client';

// Mock global fetch
global.fetch = vi.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockBaseUrl = 'https://api.example.com';

  beforeEach(() => {
    apiClient = new ApiClient(mockBaseUrl);
    vi.clearAllMocks();
  });

  describe('getPlace', () => {
    it('should fetch place data successfully', async () => {
      const mockPlaceData = {
        data: {
          location: { latitude: 48.8566, longitude: 2.3522 },
          viewport: {
            high: { latitude: 48.9022, longitude: 2.4699 },
            low: { latitude: 48.8156, longitude: 2.2242 },
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlaceData,
      });

      const result = await apiClient.getPlace('test-place-id');

      expect(result).toEqual(mockPlaceData);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/api/places/test-place-id`);
    });

    it('should throw error with status code when request fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Place not found' }),
      });

      await expect(apiClient.getPlace('invalid-id')).rejects.toThrow(
        'Failed to fetch place data for "invalid-id": Place not found',
      );
    });

    it('should throw error with HTTP status when JSON error unavailable', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiClient.getPlace('test-id')).rejects.toThrow(
        'Failed to fetch place data for "test-id" (HTTP 500: Internal Server Error)',
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.getPlace('test-id')).rejects.toThrow('Network error');
    });
  });

  describe('getHotels', () => {
    it('should fetch hotels successfully', async () => {
      const mockHotelsData = {
        data: [
          {
            id: 'hotel1',
            name: 'Test Hotel',
            latitude: 48.8566,
            longitude: 2.3522,
            address: '123 Test St',
            rating: 4.5,
            main_photo: 'photo.jpg',
            stars: 4,
            currency: 'USD',
            city: 'Paris',
            country: 'France',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHotelsData,
      });

      const params = {
        placeId: 'test-place',
        limit: 20,
        minRating: 8,
      };

      const result = await apiClient.getHotels(params);

      expect(result).toEqual(mockHotelsData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${mockBaseUrl}/api/hotels?`),
      );
    });

    it('should throw error with status code when request fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid parameters' }),
      });

      await expect(apiClient.getHotels({ placeId: 'test' })).rejects.toThrow(
        'Failed to fetch hotels: Invalid parameters',
      );
    });

    it('should throw error with HTTP status when JSON error unavailable', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiClient.getHotels({ placeId: 'test' })).rejects.toThrow(
        'Failed to fetch hotels (HTTP 503: Service Unavailable)',
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(apiClient.getHotels({ placeId: 'test' })).rejects.toThrow('Connection timeout');
    });
  });

  describe('getRates', () => {
    it('should fetch rates successfully', async () => {
      const mockRatesData = {
        data: [
          {
            hotelId: 'hotel1',
            roomTypes: [
              {
                suggestedSellingPrice: {
                  amount: 150.5,
                  currency: 'USD',
                },
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRatesData,
      });

      const params = {
        occupancies: [{ adults: 2 }],
        checkin: '2025-11-04',
        checkout: '2025-11-05',
        guestNationality: 'US',
        currency: 'USD',
        countryCode: 'FR',
        cityName: 'Paris',
      };

      const result = await apiClient.getRates(params);

      expect(result).toEqual(mockRatesData);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/hotels/rates`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }),
      );
    });

    it('should throw error with status code when request fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ error: 'Invalid date range' }),
      });

      await expect(
        apiClient.getRates({
          occupancies: [{ adults: 2 }],
          checkin: 'invalid',
          checkout: 'invalid',
          guestNationality: 'US',
          currency: 'USD',
          countryCode: 'FR',
          cityName: 'Paris',
        }),
      ).rejects.toThrow('Failed to fetch hotel rates: Invalid date range');
    });

    it('should throw error with HTTP status when JSON error unavailable', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        apiClient.getRates({
          occupancies: [{ adults: 2 }],
          checkin: '2025-11-04',
          checkout: '2025-11-05',
          guestNationality: 'US',
          currency: 'USD',
          countryCode: 'FR',
          cityName: 'Paris',
        }),
      ).rejects.toThrow('Failed to fetch hotel rates (HTTP 429: Too Many Requests)');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Failed to connect'));

      await expect(
        apiClient.getRates({
          occupancies: [{ adults: 2 }],
          checkin: '2025-11-04',
          checkout: '2025-11-05',
          guestNationality: 'US',
          currency: 'USD',
          countryCode: 'FR',
          cityName: 'Paris',
        }),
      ).rejects.toThrow('Failed to connect');
    });
  });
});
