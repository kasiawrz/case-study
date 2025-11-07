import LiteAPI from '../src/index';
import { getToday, getTomorrow } from '../src/utils/dates';

let mapInstance: any = null;
let updateTimeout: NodeJS.Timeout | null = null;

window.addEventListener('DOMContentLoaded', async () => {
  const mapToken =
    'pk.eyJ1Ijoia2FzLXNlIiwiYSI6ImNtaGl1ZDdwajBoY2kybHF3ajQ1b2k3ZjkifQ.J7wxCujqrQ77uysYs4zfQw';

  console.log('Runtime customization demo starting...');

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Set default dates
  const today = getToday();
  const tomorrow = getTomorrow();

  // Initialize map
  try {
    mapInstance = await LiteAPI.Map.init({
      selector: '#map',
      placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ', // Paris
      apiUrl: 'http://localhost:3001',
      mapToken,
      minRating: 8, // Initial minimum rating
      checkin: today,
      checkout: tomorrow,
    });
  } catch (error) {
    console.error('❌ Map initialization failed:', error);
    return;
  }

  // Setup UI elements
  const slider = document.getElementById('minRating') as HTMLInputElement;
  const ratingValue = document.getElementById('ratingValue') as HTMLElement;
  const ratingText = document.getElementById('ratingText') as HTMLElement;
  const checkinInput = document.getElementById('checkin') as HTMLInputElement;
  const checkoutInput = document.getElementById('checkout') as HTMLInputElement;
  const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
  const loading = document.getElementById('loading') as HTMLElement;

  if (
    !slider ||
    !ratingValue ||
    !ratingText ||
    !checkinInput ||
    !checkoutInput ||
    !searchButton ||
    !loading
  ) {
    console.error('Required DOM elements not found');
    return;
  }

  // Set initial date values
  checkinInput.value = today;
  checkinInput.min = today; // Prevent selecting past dates
  checkoutInput.value = tomorrow;
  // Set checkout min to be at least one day after checkin
  const checkinDate = new Date(today);
  checkinDate.setDate(checkinDate.getDate() + 1);
  checkoutInput.min = formatDateForInput(checkinDate);

  // Update display when slider moves
  slider.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    ratingValue.textContent = value.toFixed(1);
    ratingText.textContent = value.toFixed(1);
  });

  // Update checkout min date when checkin changes (but don't trigger search)
  checkinInput.addEventListener('change', () => {
    const newCheckin = checkinInput.value;
    if (newCheckin) {
      // Update checkout min date to be at least one day after checkin
      const checkinDate = new Date(newCheckin);
      checkinDate.setDate(checkinDate.getDate() + 1);
      const minCheckout = formatDateForInput(checkinDate);
      checkoutInput.min = minCheckout;

      // If checkout is before new checkin, update it
      if (checkoutInput.value < newCheckin) {
        checkoutInput.value = minCheckout;
      }
    }
  });

  // Update when search button is clicked
  searchButton.addEventListener('click', async () => {
    await updateMapConfig();
  });

  // Debounced update when slider is released
  slider.addEventListener('change', async () => {
    await updateMapConfig();
  });

  async function updateMapConfig() {
    // Clear any pending updates
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Show loading indicator
    loading.classList.add('active');

    try {
      const updates: any = {};

      // Add minRating if slider has a value
      if (slider.value) {
        updates.minRating = parseFloat(slider.value);
      }

      // Add dates if they're set
      if (checkinInput.value) {
        updates.checkin = checkinInput.value;
      }
      if (checkoutInput.value) {
        updates.checkout = checkoutInput.value;
      }

      // Update map configuration
      await mapInstance.updateConfig(updates);
      console.log('✅ Updated map configuration:', updates);
    } catch (error) {
      console.error('❌ Failed to update configuration:', error);
    } finally {
      // Hide loading indicator after a short delay
      updateTimeout = setTimeout(() => {
        loading.classList.remove('active');
      }, 500);
    }
  }
});
