import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapConfig, Hotel } from '../types';
import ApiClient from '../api/client';

class MapboxAdapter {
  private container: HTMLElement;
  private options: MapConfig;
  private map: mapboxgl.Map | null = null;
  private apiClient: ApiClient;
  private markers: mapboxgl.Marker[] = [];

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
    });

    this.map.on('load', async() => {
      await this.loadHotels()
    })

    console.log('✅ Mapbox map created!');
  }

  private async loadHotels(): Promise<void> {
    try {
      // TO DO: Passt countryCode and cityName
      // Paris hardcoded
      const hotelsData = await this.apiClient.getHotels({
        countryCode: 'FR',
        cityName: 'Paris',
        limit: 20
      });

      if (!hotelsData || !hotelsData.data) {
        console.warn('No hotel data received');
        return;
      }

      this.clearMarkers();

      // Add markers for each hotel
      hotelsData.data.forEach(hotel => {
        this.addHotelMarker(hotel);
      });

      console.log(`✅ Loaded ${hotelsData.data.length} hotels`);
    } catch (error) {
      console.error('Failed to load hotels:', error);
    }
  }

  private addHotelMarker(hotel: Hotel): void {
    if (!hotel.latitude || !hotel.longitude || !this.map) {
      return;
    }

    // Create a popup 
    // TO DO: Add price
    const popupContent = `
      <div style="padding: 8px;">
        <strong>${hotel.name}</strong><br/>
        <span style="font-size: 12px; color: #666;">${hotel.address}</span><br/>
        <span style="font-size: 14px;">⭐ ${hotel.rating || 'N/A'}</span>
      </div>
    `;

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false
    }).setHTML(popupContent);

    const marker = new mapboxgl.Marker()
      .setLngLat([hotel.longitude, hotel.latitude])
      .setPopup(popup)
      .addTo(this.map);

    this.markers.push(marker);
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export default MapboxAdapter;
