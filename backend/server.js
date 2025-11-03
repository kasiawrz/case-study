require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS for local development
app.use(cors());
app.use(express.json());

const LITEAPI_BASE_URL = 'https://api.liteapi.travel/v3.0';

// Proxy endpoint for places
app.get('/api/places/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const response = await axios.get(
      `${LITEAPI_BASE_URL}/data/places/${placeId}`,
      {
        headers: {
          'X-API-Key': process.env.LITEAPI_KEY
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Places API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch place data',
      details: error.response?.data
    });
  }
});

// Proxy endpoint for hotel rates
app.get('/api/hotels/rates', async (req, res) => {
  try {
    const response = await axios.get(
      `${LITEAPI_BASE_URL}/hotels/rates`,
      {
        headers: {
          'X-API-Key': process.env.LITEAPI_KEY
        },
        params: req.query // Forward all query params
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Rates API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch rates',
      details: error.response?.data
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 LiteAPI Proxy running on http://localhost:${PORT}`);
});
