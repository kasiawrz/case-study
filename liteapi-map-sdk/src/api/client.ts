import { PlaceData, HotelsParams, HotelsResponse, RatesParams, RatesResponse } from '../types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getPlace(placeId: string, signal?: AbortSignal): Promise<PlaceData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/places/${placeId}`, {
        signal,
      });

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
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error while fetching place data for "${placeId}": ${error}`);
    }
  }

  async getHotels(params: HotelsParams, signal?: AbortSignal): Promise<HotelsResponse> {
    try {
      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(`${this.baseUrl}/api/hotels?${queryString}`, {
        signal,
      });

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
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error while fetching hotels: ${error}`);
    }
  }

  async getRates(params: RatesParams, signal?: AbortSignal): Promise<RatesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/hotels/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal,
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
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error while fetching rates: ${error}`);
    }
  }

  async getMapToken(signal?: AbortSignal): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/map-token`, {
        signal,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch map token';
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

      const data = await response.json();
      if (!data?.token) {
        throw new Error('Map token not found in response');
      }

      return data.token;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error while fetching map token: ${error}`);
    }
  }
}

export default ApiClient;
