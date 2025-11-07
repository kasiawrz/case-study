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
      placeId: '...',
    });
  })();
</script>
```

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
    // guestNationality: 'US',
    // checkin: 'YYYY-MM-DD',
    // checkout: 'YYYY-MM-DD',
  });
</script>
```

## Initialization

Use `LiteAPI.Map.init` to create and render a map into a target DOM container. The map will be centered using the bounding box returned by the LiteAPI Places endpoint for the provided `placeId` (or by the alternative location you provide).

```ts
import LiteAPI from 'liteapi-map-sdk';

const map = await LiteAPI.Map.init({
  selector: '#map',
  apiUrl: 'https://your-backend.example.com',
  placeId: 'YOUR_PLACE_ID',
});
```

- `selector`: CSS selector for the container where the map should render.
- `apiUrl`: Base URL of your application’s backend that exposes the required endpoints.
- One of the location strategies is required (see API Reference below).

## Usage

After initialization, the SDK will:

- Fetch the place information and determine the viewport for centering.
- Load hotels and rates for the current location.
- Render markers and a booking link in a popup for each hotel.

**Default values:** If not specified, the SDK uses "today" as check-in date, "tomorrow" as check-out date, and searches for two adults. You can override these defaults by passing `checkin`, `checkout`, and `adults` in the configuration.

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
  checkin: '2025-12-01', // Change dates
  checkout: '2025-12-05',
  guestNationality: 'FR', // Change guest nationality
});
```

The `updateConfig()` method accepts a partial configuration object with the following optional fields:

- `currency` - Currency for price display
- `adults` - Number of adults for occupancy
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
  mapToken: string;
  // Optional
  currency?: string;
  adults?: number;
  guestNationality?: string;
  checkin?: string; // YYYY-MM-DD
  checkout?: string; // YYYY-MM-DD
}
```

| Option           | Type                                    | Required | Default  | Description                                        |
| ---------------- | --------------------------------------- | -------- | -------- | -------------------------------------------------- |
| selector         | string                                  | Yes      | —        | CSS selector of the target container.              |
| apiUrl           | string                                  | Yes      | —        | Base URL of your backend that the SDK calls.       |
| placeId          | string                                  | One of   | —        | Place identifier; centers using place viewport.    |
| city             | { name: string; countryCode: string }   | One of   | —        | City-based location.                               |
| coordinates      | { latitude: number; longitude: number } | One of   | —        | Coordinate-based location.                         |
| mapToken         | string                                  | No       | —        | Public token for displaying the map. |
| currency         | string                                  | No       | 'USD'    | Currency for price display.                        |
| adults           | number                                  | No       | 2        | Occupancy for rate queries.                        |
| guestNationality | string                                  | No       | 'US'     | Guest nationality for rate queries.                |
| checkin          | string (YYYY-MM-DD)                     | No       | today    | Check-in date.                                     |
| checkout         | string (YYYY-MM-DD)                     | No       | tomorrow | Check-out date.                                    |
| minRating        | number                                  | No       | —        | Minimum hotel rating (0-10) to filter results.     |

### Methods

#### `map.updateConfig(updates)`

Update map configuration at runtime and reload hotels.

**Parameters:**

- `updates` (object): Partial configuration object with any of:
  - `currency?: string` - Currency for price display
  - `adults?: number` - Number of adults for occupancy
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
