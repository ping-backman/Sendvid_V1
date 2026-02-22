/** * Gets or creates a persistent seed for the current session.
 * This ensures "Discover" randomization stays consistent across pagination and pages.
 */
function getSessionSeed() {
    let seed = sessionStorage.getItem('discover_seed');
    if (!seed) {
        // Generate a random 6-character string
        seed = Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('discover_seed', seed);
    }
    return seed;
}

// Global variable to use in your fetch calls
const CURRENT_SEED = getSessionSeed();

const params = new URLSearchParams(location.search);
const id = params.get("id");

setTimeout(() => {
  location.href = `video.html?id=${id}`;
}, 2500);
