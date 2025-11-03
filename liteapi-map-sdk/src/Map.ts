import { MapConfig } from './types';
import MapboxAdapter from './adapters/MapboxAdapter';

class Map {
  private options: MapConfig;
  private adapter: any = null; // TODO
  private container: HTMLElement | null = null;

  constructor(options: MapConfig) {
    this.options = options;
  }

  /*
  The SDK must be initialized with a method such as:
LiteAPI.Map.init({ selector: "#foo" })
   * Initialize the map
   * @param config - Configuration object
   * @returns Map instance
   */
  static init(config: MapConfig): Map {
    const instance = new Map(config);
    instance._initialize();
    return instance;
  }

  private async _initialize(): Promise<void> {
  // Validate config
  if (!this.options.selector) {
    throw new Error('Map selector is required');
  }

    // Find the DOM element
    this.container = document.querySelector(this.options.selector);
    if (!this.container) {
      throw new Error(`Container not found: ${this.options.selector}`);
    }
  // Create adapter
  this.adapter = new MapboxAdapter(this.container, this.options);

  // Initialize the map
  await this.adapter.initialize();
    
    console.log('Map initialized!', this.options);
  }

  /**
   * Destroy the map instance
   */
  destroy(): void {
    console.log('Map destroyed');
  }
}

export default Map;