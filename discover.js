// discover.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";

const PAGE_SIZE = 20;

let offset = 0;
let loading = false;
let currentSort = "relevance";
let currentLength = null;
let currentQuery = "";
let CURRENT_SEED = sessionStorage.getItem('discoverSeed') || (() => {
    const seed = Math.random().toString(36).substring(2,8);
    sessionStorage.setItem('discoverSeed', seed);
    return seed;
})();

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");

export function resetDiscover(sort = "relevance") {
    gallery.innerHTML = "";
    offset = 0;
    currentSort = sort;
    loadMoreBtn.style.display = "none";
    emptyState && (emptyState.style.display = "none");
}

export async function loadMoreVideos() {
    if (loading) return;
    loading = true;

    loader.style.display = "block";
    loadMoreBtn.style.display = "none";
    emptyState && (emptyState.style.display = "none");

    try {
        const data = await fetchVideos({
            limit: PAGE_SIZE,
            offset,
            sort: currentSort,
            length: currentLength,
            q: currentQuery,
            discoverSeed: currentSort === "discover" ? CURRENT_SEED : undefined
        });

        (data.videos || []).forEach(v => {
            const card = createVideoCard(v);
            gallery.appendChild(card);
        });

        if (!data.videos || data.videos.length < PAGE_SIZE || data.nextOffset === -1) {
            offset = null;
        } else {
            offset = data.nextOffset;
        }

        if (!gallery.children.length && emptyState) emptyState.style.display = "block";

        if (offset !== null) loadMoreBtn.style.display = "block";

    } catch(err) {
        console.error("Discover load failed", err);
    }

    loader.style.display = "none";
    loading = false;
}
