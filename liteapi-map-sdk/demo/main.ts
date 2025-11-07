import LiteAPI from '../src/index';
import { getToday, getTomorrow } from '../src/utils/dates';

window.addEventListener('DOMContentLoaded', async () => {
  // Update date information
  const checkinDate = getToday();
  const checkoutDate = getTomorrow();
  const checkinElement = document.getElementById('checkin-date');
  const checkoutElement = document.getElementById('checkout-date');

  if (checkinElement) {
    checkinElement.textContent = checkinDate;
  }
  if (checkoutElement) {
    checkoutElement.textContent = checkoutDate;
  }

  // Map 1: Paris
  try {
    const parisMap = await LiteAPI.Map.init({
      selector: '#map-paris',
      placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ', // Paris
      apiUrl: 'http://localhost:3001',
      // Optional overrides:
      // currency: 'USD',
      // adults: 2,
      // children: [3, 5],
      // guestNationality: 'US',
    });
  } catch (error) {
    console.error('❌ Paris map failed:', error);
  }

  // Map 2: AMS
  try {
    const amsMap = await LiteAPI.Map.init({
      selector: '#map-ams',
      // placeId: 'ChIJVXealLU_xkcRja_At0z9AGY', // AMS
      city: {
        name: 'Amsterdam',
        countryCode: 'NL',
      },
      // coordinates: {
      //   latitude: 52.3779,
      //   longitude: 4.897,
      // },
      apiUrl: 'http://localhost:3001',
    });
  } catch (error) {
    console.error('❌ AMS map failed:', error);
  }
});
