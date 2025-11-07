# LiteAPI Map SDK

This document explains how to install, initialize, and use the SDK in a browser application.

## Installation

### Via npm (recommended)

```bash
npm i liteapi-map-sdk
```

#### Import (ES Modules)

```ts
import LiteAPI from 'liteapi-map-sdk';
```

#### Import (CommonJS)

```js
const LiteAPI = require('liteapi-map-sdk').default;
```

### Via script tag (UMD build)

Include the UMD bundle (e.g., from your hosting or a CDN) and access the global `LiteAPI`:

```html
<script src="/path/to/liteapi-map-sdk.umd.js"></script>
<script>
  // window.LiteAPI is available
  (async () => {
    const map = await LiteAPI.Map.init({
      selector: '#map',
      apiUrl: 'https://your-backend.example.com',
      placeId: 'YOUR_PLACE_ID', // GoogleMaps PlaceId
      // Optional:
      // mapToken: 'public_map_token',
      // currency: 'USD',
      // adults: 2,
      // children: [],
      // guestNationality: 'US',
      // checkin: 'YYYY-MM-DD',
      // checkout: 'YYYY-MM-DD',
    });
  })();
</script>
```

## Backend proxy (required)

You need a backend proxy because:
1. LiteAPI's API key must stay on the server (never in the browser)
2. LiteAPI blocks direct browser requests (CORS)

This repo includes a sample proxy in `../backend/server.js` that handles this for you.

The sample proxy exposes:

- `GET /api/places/:placeId`
- `GET /api/hotels`
- `POST /api/hotels/rates`

To run it locally:

```bash
cd ../backend
npm install
npm run dev # or npm start
```

1. Add `LITEAPI_KEY` to your `.env` file
2. Start the backend server
3. Point `apiUrl` in your map config to the server (e.g. `http://localhost:3001`)

## Quickstart (copy/paste)

```html
<div id="map" style="width: 100%; height: 400px;"></div>
<script type="module">
  import LiteAPI from 'liteapi-map-sdk';

  const map = await LiteAPI.Map.init({
    selector: '#map',
    apiUrl: 'https://your-backend.example.com',
    placeId: 'YOUR_PLACE_ID', // GoogleMaps PlaceId
    // Optional:
    // mapToken: 'public_map_token',
    // currency: 'USD',
    // adults: 2,
    // children: [],
    // guestNationality: 'US',
    // checkin: 'YYYY-MM-DD',
    // checkout: 'YYYY-MM-DD',
  });
</script>
```

## Initialization

Create a map by providing a location. You can use one of three ways:

**Option 1: Place ID**
```ts
const map = await LiteAPI.Map.init({
  selector: '#map',
  apiUrl: 'https://your-backend.example.com',
  placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ', // Paris
});
```

**Option 2: City name**
```ts
const map = await LiteAPI.Map.init({
  selector: '#map',
  apiUrl: 'https://your-backend.example.com',
  mapToken: 'your-map-token',
  city: { name: 'Paris', countryCode: 'FR' },
});
```

**Option 3: Coordinates**
```ts
const map = await LiteAPI.Map.init({
  selector: '#map',
  apiUrl: 'https://your-backend.example.com',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
});
```

## Usage

After initialization, the SDK will:

- Fetch the place information and determine the viewport for centering.
- Load hotels and rates for the current location.
- Render markers and a booking link in a popup for each hotel.

**Defaults:**
- Check-in: today
- Check-out: tomorrow
- Adults: 2
- Children: none
- Currency: USD

You can change these by passing options when initializing the map.

You typically initialize once per container. To remove the map, call the instance's `destroy()` method if the consuming code exposes it in your integration.

### Runtime Customization

You can update the map configuration at runtime using `updateConfig()`. This will reload hotels with the new settings:

```ts
const map = await LiteAPI.Map.init({
  selector: '#map',
  apiUrl: 'https://your-backend.example.com',
  placeId: 'YOUR_PLACE_ID',
  minRating: 8,
  currency: 'USD',
});

// Later, update the configuration
await map.updateConfig({
  minRating: 9, // Filter to only 9+ rated hotels
  currency: 'EUR', // Change currency
  adults: 4, // Update occupancy
  children: [3, 5], // Two children aged 3 and 5
  checkin: '2025-12-01', // Change dates
  checkout: '2025-12-05',
  guestNationality: 'FR', // Change guest nationality
});
```

The `updateConfig()` method accepts a partial configuration object with the following optional fields:

- `currency` - Currency for price display
- `adults` - Number of adults for occupancy
- `children` - Ages of children travelling (e.g. `[3, 5]`)
- `guestNationality` - Guest nationality (ISO country code)
- `checkin` - Check-in date (YYYY-MM-DD)
- `checkout` - Check-out date (YYYY-MM-DD)
- `minRating` - Minimum hotel rating (0-10)

After updating, the map will automatically reload hotels with the new configuration.

## API Reference

### MapConfig

```ts
interface MapConfig {
  selector: string;
  apiUrl: string;
  // Location (provide ONE of the following)
  placeId?: string;
  city?: { name: string; countryCode: string };
  coordinates?: { latitude: number; longitude: number };
  // Optional:
  currency?: string;
  adults?: number;
  children?: number[];
  guestNationality?: string;
  checkin?: string; // YYYY-MM-DD
  checkout?: string; // YYYY-MM-DD
  minRating?: number; // 0-10
}
```

| Option           | Type                                    | Required | Default  | Description                                     |
| ---------------- | --------------------------------------- | -------- | -------- | ----------------------------------------------- |
| selector         | string                                  | Yes      | —        | CSS selector for the map container              |
| apiUrl           | string                                  | Yes      | —        | Your backend URL                                |
| mapToken         | string                                  | Yes      | —        | Map provider token                              |
| placeId          | string                                  | One of   | —        | Google Maps Place ID                            |
| city             | { name: string; countryCode: string }   | One of   | —        | City name and country code (e.g., 'FR', 'US')  |
| coordinates      | { latitude: number; longitude: number } | One of   | —        | Latitude and longitude                           |
| currency         | string                                  | No       | 'USD'    | Currency code                                   |
| adults           | number                                  | No       | 2        | Number of adults                                |
| children         | number[]                                | No       | []       | Ages of children traveling (e.g., [3, 5])                |
| guestNationality | string                                  | No       | 'US'     | Guest country code                              |
| checkin          | string (YYYY-MM-DD)                     | No       | today    | Check-in date                                   |
| checkout         | string (YYYY-MM-DD)                     | No       | tomorrow | Check-out date                                  |
| minRating        | number                                  | No       | —        | Minimum hotel rating (0-10)                     |

### Methods

#### `map.updateConfig(updates)`

Update map configuration at runtime and reload hotels.

**Parameters:**

- `updates` (object): Partial configuration object with any of:
  - `currency?: string` - Currency for price display
  - `adults?: number` - Number of adults for occupancy
  - `children?: number[]` - Ages of children travelling (e.g. `[3, 5]`)
  - `guestNationality?: string` - Guest nationality (ISO country code)
  - `checkin?: string` - Check-in date (YYYY-MM-DD)
  - `checkout?: string` - Check-out date (YYYY-MM-DD)
  - `minRating?: number` - Minimum hotel rating (0-10)

**Returns:** `Promise<void>`

**Example:**

```ts
await map.updateConfig({ minRating: 9, currency: 'EUR' });
```

That's it — you're ready to install, initialize, and use the SDK in your web app.
