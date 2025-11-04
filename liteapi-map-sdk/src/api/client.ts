import { PlaceData, HotelsParams, HotelsResponse, RatesParams, RatesResponse } from '../types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getPlace(placeId: string): Promise<PlaceData> {
    const response = await fetch(`${this.baseUrl}/api/places/${placeId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch place: ${response.statusText}`);
    }
    return response.json();
  }

  async getHotels(params: HotelsParams): Promise<HotelsResponse> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await fetch(`${this.baseUrl}/api/hotels?${queryString}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch hotels: ${response.statusText}`);
    }
    return response.json();
  }

  async getRates(params: RatesParams): Promise<RatesResponse> {
    const response = await fetch(`${this.baseUrl}/api/hotels/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`);
    }
    return response.json();
  }
}

export default ApiClient;
