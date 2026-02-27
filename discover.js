// discover.js

import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";

const PAGE_SIZE = 20;

let offset = 0;
let loading = false;
let currentSort = "relevance";
let currentLength = null;
let currentQuery = "";

// Stable discover seed per session
let CURRENT_SEED = sessionStorage.getItem("discoverSeed");
if (!CURRENT_SEED) {
    CURRENT_SEED = Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem("discoverSeed", CURRENT_SEED);
}

// DOM references
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");

/**
 * Reset Discover Feed
 */
export function resetDiscover(sort = "relevance", query = "", length = null) {
    gallery.innerHTML = "";
    offset = 0;
    currentSort = sort;
    currentQuery = query;
    currentLength = length;
    loading = false;

    if (emptyState) emptyState.style.display = "none";
    loadMoreBtn.style.display = "none";
}

/**
 * Load Next Page
 */
export async function loadMoreVideos() {
    if (loading) return;
    if (offset === null) return; // No more results

    loading = true;

    loader.style.display = "block";
    loadMoreBtn.style.display = "none";
    if (emptyState) emptyState.style.display = "none";

    try {
        const data = await fetchVideos({
            limit: PAGE_SIZE,
            offset: offset,
            sort: currentSort,
            length: currentLength,
            q: currentQuery,
            discoverSeed: currentSort === "discover" ? CURRENT_SEED : undefined
        });

        const videos = data.videos || [];

        // Append results
        videos.forEach(video => {
            const card = createVideoCard(video);
            gallery.appendChild(card);
        });

        // Backend-driven pagination (THE FIX)
        if (data.nextOffset === -1 || videos.length === 0) {
            offset = null; // End of results
        } else {
            offset = data.nextOffset;
        }

        // Empty state
        if (!gallery.children.length && emptyState) {
            emptyState.style.display = "block";
        }

        // Show load more if more pages exist
        if (offset !== null) {
            loadMoreBtn.style.display = "block";
        }

    } catch (err) {
        console.error("Discover load failed:", err);
    }

    loader.style.display = "none";
    loading = false;
}
