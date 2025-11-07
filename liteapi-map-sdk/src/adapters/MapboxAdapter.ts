import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapConfig, Hotel, RatesResponse, HotelsResponse } from '../types';
import ApiClient from '../api/client';
import { getToday, getTomorrow } from '../utils/dates';
import { buildWhitelabelUrl } from '../utils/whitelabel';

// Constants
const DEFAULT_ADULTS = 2;
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_GUEST_NATIONALITY = 'US';
const DEFAULT_CHILDREN: number[] = [];
const HOTEL_LIMIT = 20;

// Map configuration
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const MAP_OPTIONS = {
  scrollZoom: false,
  boxZoom: true,
  dragRotate: true,
  keyboard: true,
  touchZoomRotate: true,
} as const;

class MapboxAdapter {
  private container: HTMLElement;
  private options: MapConfig;
  private map: mapboxgl.Map | null = null;
  private apiClient: ApiClient;
  private markers: mapboxgl.Marker[] = [];
  private checkin: string;
  private checkout: string;
  private locationParams: any = {};
  private abortController: AbortController | null = null;
  private mapToken: string = '';

  constructor(container: HTMLElement, options: MapConfig) {
    this.container = container;
    this.apiClient = new ApiClient(options.apiUrl);
    this.options = options;
    this.checkin = options.checkin || getToday();
    this.checkout = options.checkout || getTomorrow();
  }

  async initialize(): Promise<void> {
    if (!this.mapToken) {
      this.mapToken = await this.apiClient.getMapToken();
    }
    mapboxgl.accessToken = this.mapToken;

    if (this.options.placeId) {
      await this.initializeWithPlaceId();
    } else if (this.options.city) {
      await this.initializeWithCity();
    } else if (this.options.coordinates) {
      await this.initializeWithCoordinates();
    }

    this.map!.on('load', async () => {
      await this.loadHotels();
    });

    this.map!.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }

  // Helper: Create and manage AbortController
  private createAbortController(): AbortSignal {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    return this.abortController.signal;
  }

  // Helper: Check if request was aborted
  private checkAborted(signal: AbortSignal): boolean {
    return signal.aborted;
  }

  // Helper: Get default values
  private getDefaults() {
    return {
      adults: this.options.adults || DEFAULT_ADULTS,
      children: this.options.children || DEFAULT_CHILDREN,
      currency: this.options.currency || DEFAULT_CURRENCY,
      guestNationality: this.options.guestNationality || DEFAULT_GUEST_NATIONALITY,
    };
  }

  // Helper: Create map with bounds
  private createMapWithBounds(bounds: [[number, number], [number, number]]): void {
    this.map = new mapboxgl.Map({
      container: this.container,
      style: MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 50 },
      ...MAP_OPTIONS,
    });
  }

  // Helper: Create map with center
  private createMapWithCenter(center: [number, number], zoom: number = 9): void {
    this.map = new mapboxgl.Map({
      container: this.container,
      style: MAP_STYLE,
      center,
      zoom,
    });
  }

  private async initializeWithPlaceId(): Promise<void> {
    const signal = this.createAbortController();

    const placeData = await this.apiClient.getPlace(this.options.placeId!, signal);
    if (this.checkAborted(signal)) return;

    if (!placeData?.data?.viewport) {
      throw new Error(
        `Invalid place data received for placeId "${this.options.placeId}": viewport information is missing. Please verify the placeId is correct.`,
      );
    }

    const cityComponent = placeData.data.addressComponents?.find((c) =>
      c.types.includes('locality'),
    );
    const countryComponent = placeData.data.addressComponents?.find((c) =>
      c.types.includes('country'),
    );

    this.locationParams = {
      cityName: cityComponent?.longText,
      countryCode: countryComponent?.shortText,
      placeId: this.options.placeId,
    };

    const { viewport } = placeData.data;
    this.createMapWithBounds([
      [viewport.low.longitude, viewport.low.latitude],
      [viewport.high.longitude, viewport.high.latitude],
    ]);
  }

  private async initializeWithCity(): Promise<void> {
    const signal = this.createAbortController();

    this.locationParams = {
      cityName: this.options.city!.name,
      countryCode: this.options.city!.countryCode,
    };

    const geocodeData = await this.geocodeCity(
      this.options.city!.name,
      this.options.city!.countryCode,
      signal,
    );
    if (this.checkAborted(signal)) return;

    if (!geocodeData?.features?.[0]?.properties?.bbox) {
      throw new Error(
        `Failed to geocode city "${this.options.city!.name}, ${this.options.city!.countryCode}". Please verify the city name and country code are correct.`,
      );
    }

    const bbox = geocodeData.features[0].properties.bbox;
    this.createMapWithBounds([
      [bbox[0], bbox[1]], // [minLng, minLat]
      [bbox[2], bbox[3]], // [maxLng, maxLat]
    ]);
  }

  private async geocodeCity(
    cityName: string,
    countryCode: string,
    signal?: AbortSignal,
  ): Promise<any> {
    try {
      const query = encodeURIComponent(cityName);
      const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${query}&country=${countryCode}&access_token=${this.mapToken}`;
      const response = await fetch(url, { signal });

      if (!response.ok) {
        const errorMessage = await this.parseErrorResponse(
          response,
          `Failed to geocode city "${cityName}, ${countryCode}"`,
        );
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
      throw new Error(`Network error while geocoding city "${cityName}, ${countryCode}": ${error}`);
    }
  }

  // Helper: Parse error response
  private async parseErrorResponse(response: Response, baseMessage: string): Promise<string> {
    try {
      const errorData = await response.json().catch(() => null);
      if (errorData?.error || errorData?.message) {
        return `${baseMessage}: ${errorData.error || errorData.message}`;
      }
      return `${baseMessage} (HTTP ${response.status}: ${response.statusText})`;
    } catch {
      return `${baseMessage} (HTTP ${response.status}: ${response.statusText})`;
    }
  }

  private async initializeWithCoordinates(): Promise<void> {
    this.locationParams = {
      latitude: this.options.coordinates!.latitude,
      longitude: this.options.coordinates!.longitude,
    };

    this.createMapWithCenter([
      this.options.coordinates!.longitude,
      this.options.coordinates!.latitude,
    ]);
  }

  async loadHotels(): Promise<void> {
    const signal = this.createAbortController();

    try {
      const hotelsData = await this.apiClient.getHotels(
        {
          ...this.locationParams,
          limit: HOTEL_LIMIT,
          minRating: this.options.minRating,
        },
        signal,
      );
      if (this.checkAborted(signal)) return;

      const defaults = this.getDefaults();
      const ratesData = await this.apiClient.getRates(
        {
          ...this.locationParams,
          occupancies: [
            {
              adults: defaults.adults,
              ...(defaults.children.length > 0 ? { children: defaults.children } : {}),
            },
          ],
          checkin: this.checkin,
          checkout: this.checkout,
          guestNationality: defaults.guestNationality,
          currency: defaults.currency,
          maxRatesPerHotel: 1,
          limit: HOTEL_LIMIT,
        },
        signal,
      );
      if (this.checkAborted(signal)) return;

      if (!hotelsData?.data || !ratesData?.data) {
        console.warn('No hotel or rates data received');
        return;
      }

      const hotelsWithPrices = this.mergeHotelsWithRates(hotelsData.data, ratesData.data);
      this.clearMarkers();
      hotelsWithPrices.forEach((hotel) => this.addHotelMarker(hotel));

      console.log(`✅ Loaded ${hotelsWithPrices.length} hotels`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to load hotels:', error);
    }
  }

  private mergeHotelsWithRates(
    hotels: HotelsResponse['data'],
    rates: RatesResponse['data'],
  ): Hotel[] {
    const priceMap = new Map<string, { price: number; currency: string }>();

    rates.forEach((rate) => {
      const sellingPrice = rate.roomTypes[0]?.suggestedSellingPrice.amount;
      const currency = rate.roomTypes[0]?.suggestedSellingPrice.currency;

      if (sellingPrice && currency) {
        priceMap.set(rate.hotelId, { price: sellingPrice, currency });
      }
    });

    const hotelsWithPrices: Hotel[] = [];

    hotels.forEach((hotel) => {
      const priceInfo = priceMap.get(hotel.id);
      if (!priceInfo) return;

      hotelsWithPrices.push({
        id: hotel.id,
        name: hotel.name,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        address: hotel.address,
        rating: hotel.rating,
        photo: hotel.main_photo,
        stars: hotel.stars,
        priceInfo,
      });
    });

    return hotelsWithPrices;
  }

  // Helper: Generate popup HTML
  private generatePopupHTML(hotel: Hotel, whitelabelUrl: string): string {
    const ratingHtml = hotel.rating
      ? `<span style="font-size: 14px;">⭐ ${hotel.rating}</span><br/>`
      : '';

    return `
      <div style="padding: 8px;">
        <strong>${hotel.name}</strong><br/>
        <span style="font-size: 12px; color: #666;">${hotel.address}</span><br/>
        ${ratingHtml}
        <a href="${whitelabelUrl}" 
           target="_blank"
           style="
             font-size: 14px; 
             color: rgb(31, 102, 16);
             text-decoration: none;
             font-weight: 600;
             cursor: pointer;
             display: inline-block;
             margin: 8px 0;
             border: none;
             outline: none;
           "
           onmouseover="this.style.textDecoration='underline'"
           onmouseout="this.style.textDecoration='none'"
           onfocus="this.style.outline='none'">
          <span style="font-size: 14px; color:rgb(31, 102, 16);">
            ${hotel.priceInfo?.currency} ${hotel.priceInfo?.price}
          </span>
        </a><br />
        <button style="
          margin-top: 12px;
          padding: 8px 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          width: 100%;
        "> 
          Click to book → 
        </button>
      </div>
    `;
  }

  private addHotelMarker(hotel: Hotel): void {
    if (!hotel.latitude || !hotel.longitude || !this.map) {
      return;
    }

    const defaults = this.getDefaults();
    const whitelabelUrl = buildWhitelabelUrl({
      hotelId: hotel.id,
      checkin: this.checkin,
      checkout: this.checkout,
      adults: defaults.adults,
      children: defaults.children,
      currency: defaults.currency,
      whitelabelDomain: this.options.whitelabelUrl,
    });

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
    }).setHTML(this.generatePopupHTML(hotel, whitelabelUrl));

    const marker = new mapboxgl.Marker()
      .setLngLat([hotel.longitude, hotel.latitude])
      .setPopup(popup)
      .addTo(this.map);

    popup.on('open', () => {
      const popupElement = popup.getElement();
      const bookBtn = popupElement?.querySelector('button');
      if (bookBtn) {
        bookBtn.addEventListener('click', () => {
          window.open(whitelabelUrl, '_blank');
        });
      }
    });

    this.markers.push(marker);
  }

  private clearMarkers(): void {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
  }

  destroy(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.clearMarkers();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.locationParams = {};
  }
}

export default MapboxAdapter;
