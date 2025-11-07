import LiteAPI from '../src/index';

window.addEventListener('DOMContentLoaded', () => {
  const mapToken =
    'pk.eyJ1Ijoia2FzLXNlIiwiYSI6ImNtaGl1ZDdwajBoY2kybHF3ajQ1b2k3ZjkifQ.J7wxCujqrQ77uysYs4zfQw';
  console.log('Demo starting...');

  // Map 1: Paris
  try {
    const parisMap = LiteAPI.Map.init({
      selector: '#map-paris',
      placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ', // Paris
      apiUrl: 'http://localhost:3001',
      mapToken,
      // Optional overrides (provider-agnostic):
      // currency: 'USD',
      // adults: 2,
      // guestNationality: 'US',
    });
  } catch (error) {
    console.error('❌ Paris map failed:', error);
  }

  // Map 2: AMS
  try {
    const amsMap = LiteAPI.Map.init({
      selector: '#map-ams',
      placeId: 'ChIJVXealLU_xkcRja_At0z9AGY', // AMS
      // city: {
      //     name: "Amsterdam",
      //     countryCode: "NL",
      // },
      mapToken,
      apiUrl: 'http://localhost:3001',
    });
  } catch (error) {
    console.error('❌ AMS map failed:', error);
  }
});
