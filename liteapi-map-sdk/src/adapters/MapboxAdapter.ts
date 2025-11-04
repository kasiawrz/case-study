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
      this.initializeWithCity();
    } else if (this.options.coordinates) {
      this.initializeWithCoordinates();
    }

    this.map!.on('load', async () => {
      await this.loadHotels();
    });

    // Add navigation controls (zoom, rotation)
    this.map!.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }

  private async initializeWithPlaceId(): Promise<void> {
    const placeData = await this.apiClient.getPlace(this.options.placeId!);

    if (!placeData?.data?.viewport) {
      throw new Error(`Failed to fetch place data for placeId: ${this.options.placeId}`);
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
      touchZoomRotate: true // Enable touch zoom & rotation
    });
  }

  private initializeWithCity(): void {
    this.locationParams = {
      cityName: this.options.city!.name,
      countryCode: this.options.city!.countryCode,
    };

    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/streets-v12',
      // bounds: [
      //   [viewport.low.longitude, viewport.low.latitude],
      //   [viewport.high.longitude, viewport.high.latitude],
      // ],
      zoom: 12,
    });
  }

  private initializeWithCoordinates(): void {
    this.locationParams = {
      latitude: this.options.coordinates!.latitude,
      longitude: this.options.coordinates!.longitude,
    };

    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [this.options.coordinates!.longitude, this.options.coordinates!.latitude],
      zoom: 12, // TO DO
    });
  }

  private async loadHotels(): Promise<void> {
    try {
      // Fetch hotels (with coordinates)
      const hotelsData = await this.apiClient.getHotels({
        ...this.locationParams,
        limit: 20,
      });

      // Resolve runtime defaults
      const adults = this.options.adults || 2;
      const currency = this.options.currency || 'USD';
      const guestNationality = this.options.guestNationality || 'US';

      // Fetch hotel rates (prices)
      const ratesData = await this.apiClient.getRates({
        ...this.locationParams,
        occupancies: [{ adults }],
        checkin: this.checkin,
        checkout: this.checkout,
        guestNationality,
        currency,
        maxRatesPerHotel: 1,
        limit: 20,
      });

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

    const popupContent = `
      <div style="padding: 8px;">
        <strong>${hotel.name}</strong><br/>
        <span style="font-size: 12px; color: #666;">${hotel.address}</span><br/>
        <span style="font-size: 14px;">⭐ ${hotel.rating || 'N/A'}</span><br/>
        <span style="font-size: 14px; color:rgb(31, 102, 16);">
          ${hotel.priceInfo?.currency} ${hotel.priceInfo?.price}
        </span><br />
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

    console.log('🥰')
    console.log('🥰 hotel', hotel)

    const marker = new mapboxgl.Marker()
      .setLngLat([hotel.longitude, hotel.latitude])
      .setPopup(popup)
      .addTo(this.map);

    popup.on('open', () => {
      const popupElement = popup.getElement();
      const bookBtn = popupElement?.querySelector('button');

      if (bookBtn) {
        bookBtn.addEventListener('click', () => {
          const currency = this.options.currency || 'USD';
          const url = buildWhitelabelUrl({
            hotelId: hotel.id,
            placeId: this.options.placeId || '',
            checkin: this.checkin,
            checkout: this.checkout,
            adults: this.options.adults || 2,
            currency,
          });

          window.open(url, '_blank');
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
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export default MapboxAdapter;
