import { PlaceData, HotelsParams, HotelsResponse, RatesParams, RatesResponse } from '../types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getPlace(placeId: string): Promise<PlaceData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/places/${placeId}`);

      if (!response.ok) {
        let errorMessage = `Failed to fetch place data for "${placeId}"`;
        try {
          const errorData = await response.json().catch(() => null);
          if (errorData?.error || errorData?.message) {
            errorMessage += `: ${errorData.error || errorData.message}`;
          } else {
            errorMessage += ` (HTTP ${response.status}: ${response.statusText})`;
          }
        } catch {
          errorMessage += ` (HTTP ${response.status}: ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error while fetching place data for "${placeId}": ${error}`);
    }
  }

  async getHotels(params: HotelsParams): Promise<HotelsResponse> {
    try {
      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(`${this.baseUrl}/api/hotels?${queryString}`);

      if (!response.ok) {
        let errorMessage = 'Failed to fetch hotels';
        try {
          const errorData = await response.json().catch(() => null);
          if (errorData?.error || errorData?.message) {
            errorMessage += `: ${errorData.error || errorData.message}`;
          } else {
            errorMessage += ` (HTTP ${response.status}: ${response.statusText})`;
          }
        } catch {
          errorMessage += ` (HTTP ${response.status}: ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error while fetching hotels: ${error}`);
    }
  }

  async getRates(params: RatesParams): Promise<RatesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/hotels/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch hotel rates';
        try {
          const errorData = await response.json().catch(() => null);
          if (errorData?.error || errorData?.message) {
            errorMessage += `: ${errorData.error || errorData.message}`;
          } else {
            errorMessage += ` (HTTP ${response.status}: ${response.statusText})`;
          }
        } catch {
          errorMessage += ` (HTTP ${response.status}: ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error while fetching rates: ${error}`);
    }
  }
}

export default ApiClient;
