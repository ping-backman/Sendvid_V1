// cards.js

// Maintain watched set using localStorage (single source of truth in memory)

let watched;

try {
  watched = new Set(
    JSON.parse(localStorage.getItem("watched") || "[]")
  );
} catch (e) {
  console.warn("Watched state corrupted, resetting...");
  watched = new Set();
  localStorage.setItem("watched", "[]");
}

/**
 * Cross-tab sync
 * Keeps watched state consistent across multiple tabs
 */
window.addEventListener("storage", (event) => {
  if (event.key !== "watched") return;

  try {
    const updated = JSON.parse(event.newValue || "[]");

    watched.clear();
    updated.forEach(id => watched.add(id));

    // Update UI for already-rendered cards
    updated.forEach(id => {
      document
        .querySelectorAll(`.card[data-id="${id}"]:not(.watched)`)
        .forEach(card => card.classList.add("watched"));
    });

  } catch (e) {
    console.warn("Failed to sync watched state:", e);
  }
});

/**
 * Mark a video as watched
 * Called from player.js when playback begins
 */
export function markAsWatched(videoId) {
  if (!videoId || watched.has(videoId)) return;

  watched.add(videoId);

  localStorage.setItem(
    "watched",
    JSON.stringify([...watched])
  );

  // Update UI instantly (same-tab response)
  document
    .querySelectorAll(`.card[data-id="${videoId}"]`)
    .forEach(card => {
      card.classList.add("watched");
    });
}

/**
 * Create a video card element
 */
export function createVideoCard(video, options = {}) {
  const el = document.createElement("div");

  el.className = `card ${options.compact ? "side-card" : "fade-in"}`;
  el.dataset.id = video.id;

  // O(1) memory lookup (fast, no storage access)
  if (watched.has(video.id)) {
    el.classList.add("watched");
  }

  el.innerHTML = `
    <a href="/w/${video.id}" class="card-link ${options.compact ? "side-card-link" : ""}">
      <img class="thumb" src="${video.thumbnail}" alt="${video.title}" loading="lazy">

      <div class="card-body">
        <div class="title">${video.title}</div>
        <div class="meta">${video.duration} • ${video.views} views</div>
      </div>
    </a>
  `;

  return el;
}

/**
 * Mark multiple videos as watched (batch utility)
 */
export function markMultipleWatched(videoIds = []) {
  videoIds.forEach(markAsWatched);
}
