import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapConfig, Hotel, RatesResponse, HotelsResponse } from '../types';
import ApiClient from '../api/client';
import { getToday, getTomorrow } from '../utils/dates';
import { buildWhitelabelUrl } from '../utils/whitelabel';

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

  constructor(container: HTMLElement, options: MapConfig) {
    this.container = container;
    this.apiClient = new ApiClient(options.apiUrl);
    this.options = options;
    this.checkin = options.checkin || getToday();
    this.checkout = options.checkout || getTomorrow();
  }

  async initialize(): Promise<void> {
    // Provider token (public). If not provided, Map SDK may rely on a global token.
    mapboxgl.accessToken = this.options.mapToken || '';

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

    // Add navigation controls
    this.map!.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }

  private async initializeWithPlaceId(): Promise<void> {
    // Create AbortController for initialization
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const placeData = await this.apiClient.getPlace(this.options.placeId!, signal);

    // Check if request was aborted
    if (signal.aborted) {
      return;
    }

    if (!placeData?.data?.viewport) {
      throw new Error(
        `Invalid place data received for placeId "${this.options.placeId}": viewport information is missing. Please verify the placeId is correct.`,
      );
    }

    // Extract cityName and countryCode from addressComponents
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

    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/streets-v12',
      bounds: [
        [viewport.low.longitude, viewport.low.latitude],
        [viewport.high.longitude, viewport.high.latitude],
      ],
      fitBoundsOptions: {
        padding: 50,
      },
      scrollZoom: false, // Disable scroll zoom
      boxZoom: true, // Enable box zoom
      dragRotate: true, // Enable drag rotation
      keyboard: true, // Enable keyboard controls
      touchZoomRotate: true, // Enable touch zoom & rotation
    });
  }

  private async initializeWithCity(): Promise<void> {
    // Create AbortController for initialization
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.locationParams = {
      cityName: this.options.city!.name,
      countryCode: this.options.city!.countryCode,
    };

    // Use Mapbox Geocoding API to get bounding box for the city
    const geocodeData = await this.geocodeCity(
      this.options.city!.name,
      this.options.city!.countryCode,
      signal,
    );

    // Check if request was aborted
    if (signal.aborted) {
      return;
    }

    if (!geocodeData?.features?.[0]?.properties?.bbox) {
      throw new Error(
        `Failed to geocode city "${this.options.city!.name}, ${this.options.city!.countryCode}". Please verify the city name and country code are correct.`,
      );
    }

    // Extract bbox: [minLng, minLat, maxLng, maxLat]
    const bbox = geocodeData.features[0].properties.bbox;

    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/streets-v12',
      bounds: [
        [bbox[0], bbox[1]], // [minLng, minLat]
        [bbox[2], bbox[3]], // [maxLng, maxLat]
      ],
      fitBoundsOptions: {
        padding: 50,
      },
      scrollZoom: false,
      boxZoom: true,
      dragRotate: true,
      keyboard: true,
      touchZoomRotate: true,
    });
  }

  private async geocodeCity(
    cityName: string,
    countryCode: string,
    signal?: AbortSignal,
  ): Promise<any> {
    try {
      const queryCity = encodeURIComponent(cityName);
      const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${queryCity}&country=${countryCode}&access_token=${this.options.mapToken}`;
      console.log('url', url);
      console.log(
        '🙈   ',
        'https://api.mapbox.com/search/geocode/v6/forward?q=Amsterdam&country=NL&access_token=pk.eyJ1Ijoia2FzLXNlIiwiYSI6ImNtaGl1ZDdwajBoY2kybHF3ajQ1b2k3ZjkifQ.J7wxCujqrQ77uysYs4zfQw' ===
          url,
      );
      const response = await fetch(url, { signal });
      console.log('🙄 ', response);
      if (!response.ok) {
        let errorMessage = `Failed to geocode city "${cityName}, ${countryCode}"`;
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
      throw new Error(`Network error while geocoding city "${cityName}, ${countryCode}": ${error}`);
    }
  }

  private async initializeWithCoordinates(): Promise<void> {
    this.locationParams = {
      latitude: this.options.coordinates!.latitude,
      longitude: this.options.coordinates!.longitude,
    };

    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [this.options.coordinates!.longitude, this.options.coordinates!.latitude],
      zoom: 9,
    });
  }

  async loadHotels(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      // Fetch hotels (with coordinates)
      const hotelsData = await this.apiClient.getHotels(
        {
          ...this.locationParams,
          limit: 20,
          minRating: this.options.minRating,
        },
        signal,
      );

      if (signal.aborted) {
        return;
      }

      // Resolve runtime defaults
      const adults = this.options.adults || 2;
      const children = this.options.children || [];
      const currency = this.options.currency || 'USD';
      const guestNationality = this.options.guestNationality || 'US';

      // Fetch hotel rates (prices)
      const ratesData = await this.apiClient.getRates(
        {
          ...this.locationParams,
          occupancies: [
            {
              adults,
              ...(children.length > 0 ? { children } : {}),
            },
          ],
          checkin: this.checkin,
          checkout: this.checkout,
          guestNationality,
          currency,
          maxRatesPerHotel: 1,
          limit: 20,
        },
        signal,
      );

      if (signal.aborted) {
        return;
      }

      if (!hotelsData?.data || !ratesData?.data) {
        console.warn('No hotel or rates data received');
        return;
      }

      const hotelsWithPrices = this.mergeHotelsWithRates(hotelsData.data, ratesData.data);

      this.clearMarkers();

      // Add markers for each hotel
      hotelsWithPrices.forEach((hotel) => {
        this.addHotelMarker(hotel);
      });

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
    // Create a map: hotelId -> {price, currency}
    const priceMap = new Map<string, { price: number; currency: string }>();

    // Add price data to the map
    rates.forEach((rate) => {
      const sellingPrice = rate.roomTypes[0]?.suggestedSellingPrice.amount;
      const currency = rate.roomTypes[0]?.suggestedSellingPrice.currency;

      if (sellingPrice && currency) {
        priceMap.set(rate.hotelId, {
          price: sellingPrice,
          currency,
        });
      }
    });

    // Merge hotels with their prices
    const hotelsWithPrices: Hotel[] = [];

    hotels.forEach((hotel) => {
      const priceInfo = priceMap.get(hotel.id);

      if (priceInfo) {
        hotelsWithPrices.push({
          id: hotel.id,
          name: hotel.name,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          address: hotel.address,
          rating: hotel.rating,
          photo: hotel.main_photo,
          stars: hotel.stars,
          priceInfo: {
            price: priceInfo.price,
            currency: priceInfo.currency,
          },
        });
      }
    });

    return hotelsWithPrices;
  }

  private addHotelMarker(hotel: Hotel): void {
    if (!hotel.latitude || !hotel.longitude || !this.map) {
      return;
    }

    const currency = this.options.currency || 'USD';
    const whitelabelUrl = buildWhitelabelUrl({
      hotelId: hotel.id,
      checkin: this.checkin,
      checkout: this.checkout,
      adults: this.options.adults || 2,
      children: this.options.children || [],
      currency,
    });

    const ratingHtml = hotel.rating
      ? `<span style="font-size: 14px;">⭐ ${hotel.rating}</span><br/>`
      : '';

    const popupContent = `
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

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
    }).setHTML(popupContent);

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
