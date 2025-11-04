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
  minRating?: number; // TO DO? Should I keep it?
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
  occupancies: Array<{ adults: number }>;
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
    }>
    }>
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
