import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapConfig } from '../types';

class MapboxAdapter {
  private container: HTMLElement;
  private options: MapConfig;
  private map: mapboxgl.Map | null = null;

  constructor(container: HTMLElement, options: MapConfig) {
    this.container = container;
    this.options = options;
  }

  async initialize(): Promise<void> {
    mapboxgl.accessToken = 'pk.eyJ1Ijoia2FzLXNlIiwiYSI6ImNtaGl1ZDdwajBoY2kybHF3ajQ1b2k3ZjkifQ.J7wxCujqrQ77uysYs4zfQw'; // TO DO: Get from env

    // Create the map
    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [2.3522, 48.8566], // Paris for now TO DO: Double check instructions!
      zoom: 9
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