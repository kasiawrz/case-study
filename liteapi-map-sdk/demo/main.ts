import LiteAPI from '../src/index';

window.addEventListener('DOMContentLoaded', () => {
  console.log('Demo starting...');
  
  try {
    const mapInstance = LiteAPI.Map.init({
      selector: '#map',
      placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ', // Paris
      apiUrl: 'http://localhost:3001'
    });
    
    console.log('✅ Map instance created:', mapInstance);
  } catch (error) {
    console.error('❌ Error creating map:', error);
  }
});