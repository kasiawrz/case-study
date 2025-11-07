export interface MapConfig {
  selector: string;
  apiUrl: string;

  // Location - ONE of these is required
  placeId?: string;
  city?: {
    name: string;
    countryCode: string; // ISO-2 (e.g., 'US', 'FR', 'SG')
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Optional overrides
  currency?: string;
  adults?: number;
  children?: number[];
  guestNationality?: string;
  checkin?: string;
  checkout?: string;
  minRating?: number; // Minimum hotel rating (0-10)
  whitelabelUrl?: string; // Custom whitelabel domain (e.g., 'https://your-whitelabel.com')
}

// LiteAPI place response
export interface PlaceData {
  data: {
    addressComponents: Array<{
      languageCode: string;
      longText: string;
      shortText: string;
      types: string[];
    }>;
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
  countryCode?: string;
  cityName?: string;
  placeId?: string;
  limit?: number;
  minRating?: number;
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

// Parameters for fetching rates (POST /api/hotels/rates)
// TO DO - chouble check LOCATION param
export interface RatesParams {
  occupancies: Array<{ adults: number; children?: number[] }>;
  checkin: string;
  checkout: string;
  guestNationality: string;
  currency: string;
  countryCode: string;
  cityName: string;
  maxRatesPerHotel?: number;
  limit?: number;
}

// LiteAPI /hotels/rates response (has prices, NO coordinates)
export interface RatesResponse {
  data: Array<{
    hotelId: string;
    roomTypes: Array<{
      suggestedSellingPrice: {
        amount: number;
        currency: string;
      };
    }>;
  }>;
}

// Merged hotel structure
export interface Hotel {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  priceInfo?: {
    price: number;
    currency: string;
  };
  address?: string;
  rating?: number;
  photo?: string;
  stars?: number;
}
