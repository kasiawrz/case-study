# LiteAPI Case Study

In this repository you’ll find:

- `liteapi-map-sdk/` – the browser SDK (TypeScript source, unit tests, demos, documentation)
- `backend/` – a minimal Express proxy that signs LiteAPI requests with your `LITEAPI_KEY` so the token never leaves the server

## Backend proxy

LiteAPI’s public endpoints require an `X-API-Key` header and block direct browser requests because of CORS. Run the proxy in `backend/server.js` to forward requests securely.

It exposes:

- `GET /api/places/:placeId`
- `GET /api/hotels`
- `POST /api/hotels/rates`

Before starting the proxy, set `LITEAPI_KEY` in a `.env` file (or your hosting environment). Then run:

```bash
cd backend
npm install
npm run dev # or npm start
```

Point the SDK’s `apiUrl` at the proxy (e.g. `http://localhost:3001`) to keep the LiteAPI key on the server.

## Development Notes

Given the time constraints, I prioritized delivering a working solution first, then refining it. Some observations about my approach:

- **Iterative development**: I focused on getting features working end-to-end before polishing, rather than strict TDD. This allowed me to discover integration issues early.
- **Commit history**: Some commits bundle multiple changes (e.g. adding tests or small changes and fixes alongside features). In a team setting, I'd make more meaninflut commits separating the logic.
- **Code style**: I'm flexible with conventions and will happily adapt to team standards for naming, formatting and structure.

The goal was to demonstrate problem-solving ability and deliver a functional SDK within the deadline.

## "Creative freedom"

Although the brief specified initialisation via `placeId`, I also added options to:

- Initialise the map using a city name (via Mapbox Geocoding API)
- Or coordinates (latitude & longitude)