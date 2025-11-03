import { MapConfig } from './types';

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
    // Find the DOM element
    this.container = document.querySelector(this.options.selector);
    if (!this.container) {
      throw new Error(`Container not found: ${this.options.selector}`);
    }

    // TODO: Create the adapter here
    // TODO: Initialize the map
    
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