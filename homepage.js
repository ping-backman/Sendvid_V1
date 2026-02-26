// homepage.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
import { initBackToTop } from "/ui-backtotop.js";

const PAGE_SIZE = 20;

let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";
let loading = false;

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

// DOM Elements
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");
const backToTop = document.getElementById("backToTop");
const searchDesktop = document.getElementById("q-desktop");
const searchMobile = document.getElementById("q-mobile");
const clearDesktop = document.getElementById("clearSearchDesktop");
const clearMobile = document.getElementById("clearSearchMobile");

// ---------------- URL SYNC ----------------
function syncFromURL() {
    const p = new URLSearchParams(location.search);
    activeSort = p.get("sort") || "relevance";
    activeLength = p.get("length");
    currentQuery = p.get("q") || "";

    if (searchDesktop) searchDesktop.value = currentQuery;
    if (searchMobile) searchMobile.value = currentQuery;

    updateActiveButtons();
}

function syncToURL() {
    const p = new URLSearchParams();
    p.set("sort", activeSort);
    if (activeLength) p.set("length", activeLength);
    if (currentQuery) p.set("q", currentQuery);
    history.replaceState({}, "", `?${p.toString()}`);
}

function updateActiveButtons() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        if (btn.dataset.sort) btn.classList.toggle("active", btn.dataset.sort === activeSort);
        if (btn.dataset.length) btn.classList.toggle("active", btn.dataset.length === activeLength);
    });
}

// ---------------- RENDER ----------------
function render(videos) {
    const fragment = document.createDocumentFragment();
    videos.forEach(v => fragment.appendChild(createVideoCard(v, { watched })));
    gallery.appendChild(fragment);
}

// ---------------- FETCH & LOAD ----------------
async function fetchBatch(limit) {
    try {
        const data = await fetchVideos({
            limit,
            offset,
            sort: activeSort,
            length: activeLength,
            q: currentQuery
        });

        if (!data.videos || data.videos.length < limit || data.nextOffset === -1) offset = null;
        else offset = data.nextOffset;

        return data.videos ?? [];
    } catch (err) {
        console.error("Fetch failed:", err);
        return [];
    }
}

async function load(reset = false) {
    if (loading) return;
    loading = true;

    if (reset) {
        gallery.innerHTML = "";
        offset = 0;
    }

    loader.style.display = "block";
    loadMoreBtn.style.display = "none";
    if (emptyState) emptyState.style.display = "none";

    const batch = await fetchBatch(PAGE_SIZE);
    render(batch);
    const resultsHintDesktop = document.getElementById("resultsHintDesktop");
    const resultsHintMobile = document.getElementById("resultsHintMobile");

    if (resultsHintDesktop) {
    resultsHintDesktop.textContent = `Showing ${gallery.children.length} videos`;
    }
    if (resultsHintMobile) {
    resultsHintMobile.textContent = `Showing ${gallery.children.length}`;
    }

    loader.style.display = "none";
    loading = false;

    if (!gallery.children.length && emptyState) emptyState.style.display = "block";
    loadMoreBtn.style.display = (offset !== null) ? "block" : "none";
}

// ---------------- FILTERS ----------------
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
        if (btn.dataset.sort) activeSort = btn.dataset.sort;
        if (btn.dataset.length) activeLength = activeLength === btn.dataset.length ? null : btn.dataset.length;
        syncToURL();
        updateActiveButtons();
        load(true);
    };
});

// ---------------- SEARCH ----------------
let searchTimer;
const handleSearch = val => {
    currentQuery = val.trim();
    syncToURL();
    load(true);
};

searchDesktop?.addEventListener("input", e => {
    if (clearDesktop) clearDesktop.style.display = e.target.value ? "block" : "none";
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(e.target.value), 400);
});

searchMobile?.addEventListener("input", e => {
    if (clearMobile) clearMobile.style.display = e.target.value ? "block" : "none";
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(e.target.value), 400);
});

clearDesktop?.addEventListener("click", () => {
    searchDesktop.value = "";
    clearDesktop.style.display = "none";
    currentQuery = "";
    load(true);
});

clearMobile?.addEventListener("click", () => {
    searchMobile.value = "";
    clearMobile.style.display = "none";
    currentQuery = "";
    load(true);
});

// ---------------- INIT ----------------
syncFromURL();
load(true);
loadMoreBtn.onclick = () => load();
initBackToTop("backToTop");
