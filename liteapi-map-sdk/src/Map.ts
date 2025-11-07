import { MapConfig } from './types';
import MapboxAdapter from './adapters/MapboxAdapter';

class Map {
  private options: MapConfig;
  private adapter: MapboxAdapter | null = null;
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

  static async init(config: MapConfig): Promise<Map> {
    const instance = new Map(config);
    await instance._initialize();
    return instance;
  }

  private async _initialize(): Promise<void> {
    // Validate config
    if (!this.options.selector || this.options.selector.trim() === '') {
      throw new Error(
        'Map selector is required. Provide a valid CSS selector (e.g., "#map" or ".map-container")',
      );
    }
    if (!this.options.apiUrl || this.options.apiUrl.trim() === '') {
      throw new Error(
        'apiUrl is required. Provide the base URL of your backend API (e.g., "https://api.example.com")',
      );
    }

    // Validate location - exactly one of hasPlaceId, hasCity, hasCoordinates needs to be treu
    const hasPlaceId = !!this.options.placeId;
    const hasCity = !!(this.options.city?.name && this.options.city?.countryCode);
    const hasCoordinates = !!(
      this.options.coordinates?.latitude && this.options.coordinates?.longitude
    );

    const locationCount = [hasPlaceId, hasCity, hasCoordinates].filter(Boolean).length;

    if (locationCount === 0) {
      throw new Error(
        'Location is required. Provide exactly one of the following:\n' +
          '  - placeId: string (e.g., "ChIJD7fiBh9u5kcRYJSMaMOCCwQ")\n' +
          '  - city: { name: string, countryCode: string } (e.g., { name: "Paris", countryCode: "FR" })\n' +
          '  - coordinates: { latitude: number, longitude: number } (e.g., { latitude: 48.8566, longitude: 2.3522 })',
      );
    }

    if (locationCount > 1) {
      const provided = [];
      if (hasPlaceId) provided.push('placeId');
      if (hasCity) provided.push('city');
      if (hasCoordinates) provided.push('coordinates');
      throw new Error(
        `Multiple location methods provided: ${provided.join(', ')}. Please provide only ONE location method.`,
      );
    }

    // Find the DOM element
    this.container = document.querySelector(this.options.selector);
    if (!this.container) {
      throw new Error(
        `Container element not found for selector "${this.options.selector}". Make sure the element exists in the DOM before initializing the map.`,
      );
    }
    // Create adapter
    this.adapter = new MapboxAdapter(this.container, this.options);

    // Initialize the map
    await this.adapter.initialize();
  }

  /**
   * Update map configuration at runtime and reload hotels
   * @param updates - Partial configuration to update (currency, adults, guestNationality, checkin, checkout, minRating)
   */
  async updateConfig(
    updates: Partial<
      Pick<
        MapConfig,
        | 'currency'
        | 'adults'
        | 'children'
        | 'guestNationality'
        | 'checkin'
        | 'checkout'
        | 'minRating'
      >
    >,
  ): Promise<void> {
    // Merge updates into existing options
    this.options = { ...this.options, ...updates };

    // Update adapter options and dates
    if (this.adapter) {
      (this.adapter as any).options = { ...(this.adapter as any).options, ...updates };

      if (updates.checkin) {
        (this.adapter as any).checkin = updates.checkin;
      }
      if (updates.checkout) {
        (this.adapter as any).checkout = updates.checkout;
      }
      if (updates.children) {
        (this.adapter as any).children = updates.children;
      }

      // Reload hotels with new configuration
      await (this.adapter as any).loadHotels();
    }
  }

  // Destroy the map instance
  destroy(): void {
    if (this.adapter && typeof this.adapter.destroy === 'function') {
      this.adapter.destroy();
    }

    this.adapter = null;
    this.container = null;
    this.options = null as any;

    console.log('Map destroyed');
  }
}

export default Map;
