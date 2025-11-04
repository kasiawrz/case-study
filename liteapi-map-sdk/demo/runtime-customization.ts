import LiteAPI from '../src/index';

let mapInstance: any = null;
let updateTimeout: NodeJS.Timeout | null = null;

window.addEventListener('DOMContentLoaded', () => {
  const mapToken =
    'pk.eyJ1Ijoia2FzLXNlIiwiYSI6ImNtaGl1ZDdwajBoY2kybHF3ajQ1b2k3ZjkifQ.J7wxCujqrQ77uysYs4zfQw';

  console.log('Runtime customization demo starting...');

  // Initialize map
  try {
    mapInstance = LiteAPI.Map.init({
      selector: '#map',
      placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ', // Paris
      apiUrl: 'http://localhost:3001',
      mapToken,
      minRating: 8, // Initial minimum rating
    });
  } catch (error) {
    console.error('❌ Map initialization failed:', error);
    return;
  }

  // Setup slider
  const slider = document.getElementById('minRating') as HTMLInputElement;
  const ratingValue = document.getElementById('ratingValue') as HTMLElement;
  const ratingText = document.getElementById('ratingText') as HTMLElement;
  const loading = document.getElementById('loading') as HTMLElement;

  if (!slider || !ratingValue || !ratingText || !loading) {
    console.error('Required DOM elements not found');
    return;
  }

  // Update display when slider moves
  slider.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    ratingValue.textContent = value.toFixed(1);
    ratingText.textContent = value.toFixed(1);
  });

  // Debounced update when slider is released
  slider.addEventListener('change', async (e) => {
    const minRating = parseFloat((e.target as HTMLInputElement).value);

    // Clear any pending updates
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Show loading indicator
    loading.classList.add('active');

    try {
      // Update map configuration
      await mapInstance.updateConfig({
        minRating,
      });
      console.log(`✅ Updated minimum rating to ${minRating}`);
    } catch (error) {
      console.error('❌ Failed to update configuration:', error);
    } finally {
      // Hide loading indicator after a short delay
      updateTimeout = setTimeout(() => {
        loading.classList.remove('active');
      }, 500);
    }
  });
});
