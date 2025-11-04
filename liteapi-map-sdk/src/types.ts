export interface MapConfig {
  selector: string;
  placeId: string;
  apiUrl: string;
  //TODO: Double check
}

// LiteAPI place response
export interface PlaceData {
  data: {
    location: {
      latitude: number;
      longitude: number;
    };
    viewport: {
      high: {
        latitude: number;
        longitude: number;
      };
      low: {
        latitude: number;
        longitude: number;
      };
    };
  };
}

// Parameters for fetching hotels (GET /api/hotels)
export interface HotelsParams {
  countryCode: string;
  cityName: string;
  limit?: number;
}

// LiteAPI /data/hotels response (has coordinates)
export interface HotelsResponse {
  data: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    main_photo: string;
    rating: number;
    stars: number;
    currency: string;
    city: string;
    country: string;
  }>;
}

// LiteAPI /hotels/rates response (has prices, NO coordinates)
export interface RatesResponse {
  data: Array<{
    hotelId: string;
    roomTypes: Array<{
      rates: Array<{
        retailRate: {
          total: Array<{
            amount: number;
            currency: string;
          }>;
        };
      }>;
    }>;
  }>;
  hotels: Array<{
    id: string;
    name: string;
    main_photo: string;
    address: string;
    rating: number;
  }>;
}

// Merged hotel structure
export interface Hotel {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  price?: number; // TODO
  currency?: string;
  address?: string;
  rating?: number;
  photo?: string;
  stars?: number;
}
