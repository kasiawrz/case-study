import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapConfig } from '../types';
import ApiClient from '../api/client';

class MapboxAdapter {
  private container: HTMLElement;
  private options: MapConfig;
  private map: mapboxgl.Map | null = null;
  private apiClient: ApiClient;

  constructor(container: HTMLElement, options: MapConfig) {
    this.container = container;
    this.apiClient = new ApiClient(options.apiUrl);
    this.options = options;
  }

  async initialize(): Promise<void> {
    mapboxgl.accessToken =
      'pk.eyJ1Ijoia2FzLXNlIiwiYSI6ImNtaGl1ZDdwajBoY2kybHF3ajQ1b2k3ZjkifQ.J7wxCujqrQ77uysYs4zfQw'; // TO DO: Get from env

    // Fetch place data from LiteAPI
    const placeData = await this.apiClient.getPlace(this.options.placeId);

    if (!placeData) {
      throw new Error(`Failed to fetch place data for placeId: ${this.options.placeId}`);
    }

    const { viewport } = placeData.data;
    // Create the map
    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/streets-v12',
      bounds: [
        [viewport.low.longitude, viewport.low.latitude], // southwest
        [viewport.high.longitude, viewport.high.latitude], // northeast
      ],
      fitBoundsOptions: {
        padding: 50,
      },
      // zoom: 9
    });

    console.log('✅ Mapbox map created!');
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export default MapboxAdapter;
