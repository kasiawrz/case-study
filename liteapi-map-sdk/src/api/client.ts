import { PlaceData } from '../types';

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
}

export default ApiClient;
