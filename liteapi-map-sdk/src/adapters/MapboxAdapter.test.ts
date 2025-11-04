import { describe, it, expect } from 'vitest';
import type { HotelsResponse, RatesResponse, Hotel } from '../types';

// Extract the merge logic to test it separately
function mergeHotelsWithRates(
  hotels: HotelsResponse['data'],
  rates: RatesResponse['data']
): Hotel[] {
  const priceMap = new Map<string, { price: number; currency: string }>();

  rates.forEach((rate) => {
    const sellingPrice = rate.roomTypes[0]?.suggestedSellingPrice?.amount;
    const currency = rate.roomTypes[0]?.suggestedSellingPrice?.currency;

    if (sellingPrice && currency) {
      priceMap.set(rate.hotelId, {
        price: sellingPrice,
        currency,
      });
    }
  });

  const hotelsWithPrices: Hotel[] = [];

  hotels.forEach((hotel) => {
    const priceInfo = priceMap.get(hotel.id);

    if (priceInfo) {
      hotelsWithPrices.push({
        id: hotel.id,
        name: hotel.name,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        address: hotel.address,
        rating: hotel.rating,
        photo: hotel.main_photo,
        stars: hotel.stars,
        priceInfo: {
          price: priceInfo.price,
          currency: priceInfo.currency,
        },
      });
    }
  });

  return hotelsWithPrices;
}

describe('mergeHotelsWithRates', () => {
  it('should merge hotels with their prices', () => {
    const hotels: HotelsResponse['data'] = [
      {
        id: 'hotel1',
        name: 'Hotel Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        address: '123 Paris St',
        rating: 4.5,
        main_photo: 'photo.jpg',
        stars: 4,
      },
    ];

    const rates: RatesResponse['data'] = [
      {
        hotelId: 'hotel1',
        roomTypes: [
          {
            suggestedSellingPrice: {
              amount: 150.5,
              currency: 'USD',
              source: 'providerDirect',
            },
            rates: [],
            roomTypeId: 'room1',
            offerId: 'offer1',
          },
        ],
      },
    ];

    const result = mergeHotelsWithRates(hotels, rates);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('hotel1');
    expect(result[0].priceInfo?.price).toBe(150.5);
    expect(result[0].priceInfo?.currency).toBe('USD');
  });

  it('should exclude hotels without prices', () => {
    const hotels: HotelsResponse['data'] = [
      {
        id: 'hotel1',
        name: 'Hotel With Price',
        latitude: 48.8566,
        longitude: 2.3522,
        address: '123 Paris St',
        rating: 4.5,
        main_photo: 'photo.jpg',
        stars: 4,
      },
      {
        id: 'hotel2',
        name: 'Hotel Without Price',
        latitude: 48.8566,
        longitude: 2.3522,
        address: '456 Paris St',
        rating: 4.0,
        main_photo: 'photo2.jpg',
        stars: 3,
      },
    ];

    const rates: RatesResponse['data'] = [
      {
        hotelId: 'hotel1',
        roomTypes: [
          {
            suggestedSellingPrice: {
              amount: 150.5,
              currency: 'USD',
              source: 'providerDirect',
            },
            rates: [],
            roomTypeId: 'room1',
            offerId: 'offer1',
          },
        ],
      },
    ];

    const result = mergeHotelsWithRates(hotels, rates);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('hotel1');
  });

  it('should handle multiple hotels with prices', () => {
    const hotels: HotelsResponse['data'] = [
      {
        id: 'hotel1',
        name: 'Hotel 1',
        latitude: 48.8566,
        longitude: 2.3522,
        address: '123 St',
        rating: 4.5,
        main_photo: 'photo1.jpg',
        stars: 4,
      },
      {
        id: 'hotel2',
        name: 'Hotel 2',
        latitude: 48.8567,
        longitude: 2.3523,
        address: '456 St',
        rating: 4.0,
        main_photo: 'photo2.jpg',
        stars: 3,
      },
    ];

    const rates: RatesResponse['data'] = [
      {
        hotelId: 'hotel1',
        roomTypes: [
          {
            suggestedSellingPrice: {
              amount: 150.5,
              currency: 'USD',
            },
            rates: [],
            roomTypeId: 'room1',
            offerId: 'offer1',
          },
        ],
      },
      {
        hotelId: 'hotel2',
        roomTypes: [
          {
            suggestedSellingPrice: {
              amount: 200.75,
              currency: 'EUR',
            },
            rates: [],
            roomTypeId: 'room2',
            offerId: 'offer2',
          },
        ],
      },
    ];

    const result = mergeHotelsWithRates(hotels, rates);

    expect(result).toHaveLength(2);
    expect(result[0].priceInfo?.price).toBe(150.5);
    expect(result[1].priceInfo?.price).toBe(200.75);
  });

  it('should return empty array when no hotels have prices', () => {
    const hotels: HotelsResponse['data'] = [
      {
        id: 'hotel1',
        name: 'Hotel 1',
        latitude: 48.8566,
        longitude: 2.3522,
        address: '123 St',
        rating: 4.5,
        main_photo: 'photo.jpg',
        stars: 4,
      },
    ];

    const rates: RatesResponse['data'] = [];

    const result = mergeHotelsWithRates(hotels, rates);

    expect(result).toHaveLength(0);
  });
});