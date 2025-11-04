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

  constructor(container: HTMLElement, options: MapConfig) {
    this.container = container;
    this.apiClient = new ApiClient(options.apiUrl);
    this.options = options;
    this.checkin = getToday();
    this.checkout = getTomorrow();
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
      // Fetch hotels (with coordinates)
      // TO DO: Passt countryCode and cityName
      // Paris hardcoded
      const hotelsData = await this.apiClient.getHotels({
        countryCode: 'FR',
        cityName: 'Paris',
        limit: 20,
        minRating: 8, // TO DO: idea - Only good hotels (?)
      });

      // Fetch hotel rates (prices)
      const ratesData = await this.apiClient.getRates({
        occupancies: [{ adults: 2 }],
        checkin: '2025-11-04',
        checkout: '2025-11-05',
        guestNationality: 'US',
        currency: 'USD',
        countryCode: 'FR',
        cityName: 'Paris',
        maxRatesPerHotel: 1,
        limit: 20
      });

      if (!hotelsData?.data || !ratesData?.data) {
        console.warn('No hotel or rates data received');
        return;
      }

      const hotelsWithPrices = this.mergeHotelsWithRates(hotelsData.data, ratesData.data);

      this.clearMarkers();

      // Add markers for each hotel
      hotelsWithPrices.forEach(hotel => {
        this.addHotelMarker(hotel);
      });

      console.log(`✅ Loaded ${hotelsData.data.length} hotels`);
    } catch (error) {
      console.error('Failed to load hotels:', error);
    }
  }

  private mergeHotelsWithRates(
    hotels: HotelsResponse['data'],
    rates: RatesResponse['data']
  ): Hotel[] {
    console.log({hotels})
    console.log({rates})
    // Create a map: hotelId -> {price, currency}
    const priceMap = new Map<string, { price: number; currency: string }>();

    // Add price data to the map
    rates.forEach(rate => {
      const sellingPrice = rate.roomTypes[0]?.suggestedSellingPrice.amount
      const currency = rate.roomTypes[0]?.suggestedSellingPrice.currency
      if (sellingPrice) {
        priceMap.set(rate.hotelId, {
          price: sellingPrice,
          currency,
        })
      }
    })

    // Merge hotels with their prices
    return hotels
      .map(hotel => {
        const priceInfo = priceMap.get(hotel.id);
        return {
          id: hotel.id,
          name: hotel.name,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          address: hotel.address,
          rating: hotel.rating,
          photo: hotel.main_photo,
          stars: hotel.stars,
          price: priceInfo?.price,
          currency: priceInfo?.currency
        };
      })
      .filter(hotel => hotel.price !== undefined); // Only show hotels with prices
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
        <span style="font-size: 14px;">⭐ ${hotel.rating || 'N/A'}</span><br/>
        <span style="font-size: 14px; color:rgb(31, 102, 16);">
          ${hotel.currency} ${hotel.price}
        </span><br />
        <button> Click to book → </button>
      </div>
    `;

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true
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
          const url = buildWhitelabelUrl({
            hotelId: hotel.id,
            placeId: this.options.placeId,
            checkin: this.checkin,
            checkout: this.checkout,
            adults: 2
          });
          
          window.open(url, '_blank');
        });
      }
    });

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
