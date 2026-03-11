// homepage.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
import { initBackToTop } from "/ui-backtotop.js";

const PAGE_SIZE = 20;

let offset = 0;
let activeSort = "relevance";
//let activeLength = null;
let currentQuery = "";
let loading = false;

// Track watched videos for the card components
const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

// DOM Elements
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const resultsHintDesktop = document.getElementById("resultsHintDesktop");
const resultsHintMobile = document.getElementById("resultsHintMobile");

/**
 * Fetches a batch of videos and manages the offset state
 */
async function fetchBatch(limit) {
  try {
    const data = await fetchVideos({
      limit,
      offset,
      sort: activeSort,
      q: currentQuery
    });

    // Update offset logic: if no more videos or nextOffset is -1, we stop
    if (!data.videos || data.videos.length < limit || data.nextOffset === -1) {
      offset = null;
    } else {
      offset = data.nextOffset;
    }

    return data.videos ?? [];
  } catch (err) {
    console.error("Fetch batch failed:", err);
    return [];
  }
}

/**
 * Loads videos into the gallery
 * @param {boolean} reset - If true, clears the gallery and resets offset
 */
async function load(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
    if (emptyState) emptyState.style.display = "none";
  }

  if (loader) loader.style.display = "block";
  if (loadMoreBtn) loadMoreBtn.style.display = "none";

  const batch = await fetchBatch(PAGE_SIZE);

  // Handle Empty State
  if (reset && batch.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (resultsHintDesktop) resultsHintDesktop.textContent = "No videos found";
    if (resultsHintMobile) resultsHintMobile.textContent = "0 videos";
  } else {
    if (emptyState) emptyState.style.display = "none";
    
    // Use fragment for better performance on 30k+ potential items
    const fragment = document.createDocumentFragment();
    batch.forEach(v => {
      fragment.appendChild(createVideoCard(v, { watched }));
    });
    gallery.appendChild(fragment);

    // Update result counters
    const count = gallery.children.length;
    if (resultsHintDesktop) resultsHintDesktop.textContent = `Showing ${count} videos`;
    if (resultsHintMobile) resultsHintMobile.textContent = `Showing ${count}`;
  }

  if (loader) loader.style.display = "none";
  loading = false;

  // Show Load More only if we have a valid next offset
  if (loadMoreBtn) {
    loadMoreBtn.style.display = (offset !== null && batch.length > 0) ? "block" : "none";
  }
}

/**
 * Event Listeners & Initialization
 */

// 1. Sort Buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.onclick = () => {
    // UI Polish: Remove active class from others
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    activeSort = btn.dataset.sort;
    
    // Clear search when switching sorts to avoid confusion, 
    // unless you want to sort search results (handled by GAS)
    currentQuery = ""; 
    if (searchInput) searchInput.value = "";
    
    load(true);
  };
});

// 2. Search Input with Debounce (500ms)
if (searchInput) {
  let debounceTimer;
  searchInput.oninput = (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentQuery = e.target.value.trim();
      load(true);
    }, 500);
  };
}

// 3. Load More
if (loadMoreBtn) {
  loadMoreBtn.onclick = () => load();
}

// 4. Back to Top Component
initBackToTop("backToTop");

// Initial Load
load(true);
