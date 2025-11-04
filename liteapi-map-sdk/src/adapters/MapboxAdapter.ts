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
    this.checkin = getToday();
    this.checkout = getTomorrow();
  }

  async initialize(): Promise<void> {
     // TO DO: Get from env
    mapboxgl.accessToken =
      'pk.eyJ1Ijoia2FzLXNlIiwiYSI6ImNtaGl1ZDdwajBoY2kybHF3ajQ1b2k3ZjkifQ.J7wxCujqrQ77uysYs4zfQw';

    // If using placeId, fetch place data to get city/country
    if (this.options.placeId) {
      const placeData = await this.apiClient.getPlace(this.options.placeId);

      if (!placeData || !placeData.data.viewport) {
        throw new Error(`Failed to fetch place data for placeId: ${this.options.placeId}`);
      }

      // Extract cityName and countryCode from addressComponents
      const addressComponents = placeData.data.addressComponents;

      const cityComponent = addressComponents?.find((c: any) => c.types.includes('locality'));
      const countryComponent = addressComponents?.find((c: any) => c.types.includes('country'));

      // Store for use in loadHotels
      this.locationParams = {
        cityName: cityComponent?.longText,
        countryCode: countryComponent?.shortText,
        placeId: this.options.placeId,
      };


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
          // TO DO
          padding: 50,
        },
      });

      this.map.on('load', async () => {
        console.log(' which city ? ', this.options.placeId);
        await this.loadHotels();
      });

      console.log('✅ Mapbox map created!');
    } else if (this.options.city) {
      this.locationParams = {
        cityName: this.options.city.name,
        countryCode: this.options.city.countryCode,
      };

      // Create map without bounds (will fit to hotels later)
      this.map = new mapboxgl.Map({
        container: this.container,
        style: 'mapbox://styles/mapbox/streets-v12',
        zoom: 12,
      });
    } else if (this.options.coordinates) {
      this.locationParams = {
        latitude: this.options.coordinates.latitude,
        longitude: this.options.coordinates.longitude,
      };
      this.map = new mapboxgl.Map({
        container: this.container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [this.options.coordinates.longitude, this.options.coordinates.latitude],
        zoom: 12,
      });
    }
    this.map.on('load', async () => {
      await this.loadHotels();
    });
  }

  private async loadHotels(): Promise<void> {
    try {
      // Based on provided location method
      // const hotelsParams: any = { limit: 20 };

      // if (this.options.placeId) {
      //   hotelsParams.placeId = this.options.placeId;
      // } else if (this.options.city) {
      //   hotelsParams.cityName = this.options.city.name;
      //   hotelsParams.countryCode = this.options.city.countryCode;
      // } else if (this.options.coordinates) {
      //   hotelsParams.latitude = this.options.coordinates.latitude;
      //   hotelsParams.longitude = this.options.coordinates.longitude;
      // }

      const hotelsData = await this.apiClient.getHotels({
        ...this.locationParams,
        limit: 20
      });
      // Fetch hotels (with coordinates)
      // const hotelsData = await this.apiClient.getHotels(hotelsParams);
      console.log({ hotelsData });

      // Based on provided location method
      // const ratesParams: any = {
      //   occupancies: [{ adults: 2 }], // TO DO!
      //   checkin: this.checkin,
      //   checkout: this.checkout,
      //   guestNationality: 'US', // TO DO!
      //   currency: 'USD', // TO DO!
      //   maxRatesPerHotel: 1,
      //   limit: 20,
      // };

      // if (this.options.placeId) {
      //   ratesParams.placeId = this.options.placeId;
      // } else if (this.options.city) {
      //   ratesParams.cityName = this.options.city.name;
      //   ratesParams.countryCode = this.options.city.countryCode;
      // } else if (this.options.coordinates) {
      //   ratesParams.latitude = this.options.coordinates.latitude;
      //   ratesParams.longitude = this.options.coordinates.longitude;
      // }

      // Fetch hotel rates (prices)
      const ratesData = await this.apiClient.getRates({
        ...this.locationParams,
        occupancies: [{ adults: 2 }],
        checkin: this.checkin,
        checkout: this.checkout,
        guestNationality: 'US',
        currency: 'USD',
        maxRatesPerHotel: 1,
        limit: 20
      });
      // const ratesData = await this.apiClient.getRates(ratesParams);
      console.log({ ratesData });

      if (!hotelsData?.data || !ratesData?.data) {
        console.warn('No hotel or rates data received');
        return;
      }

      const hotelsWithPrices = this.mergeHotelsWithRates(hotelsData.data, ratesData.data);

      this.clearMarkers();
      console.log('->>>> ', { hotelsWithPrices });
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
    rates: any, //RatesResponse['data'], TODO URGENT!!!
  ): Hotel[] {
    // Create a map: hotelId -> {price, currency}
    const priceMap = new Map<string, { price: number; currency: string }>();

    // Add price data to the map
    rates.forEach((rate) => {
      const sellingPrice = rate.roomTypes[0]?.suggestedSellingPrice.amount;
      const currency = rate.roomTypes[0]?.suggestedSellingPrice.currency;
      if (sellingPrice) {
        priceMap.set(rate.hotelId, {
          price: sellingPrice,
          currency,
        });
      }
    });

    // Merge hotels with their prices
    return hotels
      .map((hotel) => {
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
          priceInfo: {
            price: priceInfo?.price,
            currency: priceInfo?.currency,
          },
        };
      })
      .filter((hotel) => hotel.priceInfo?.price !== undefined); // Only show hotels with prices
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
        <button> Click to book → </button>
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
          const url = buildWhitelabelUrl({
            hotelId: hotel.id,
            checkin: this.checkin,
            checkout: this.checkout,
            adults: 2, // TODO: add Children, with age
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
