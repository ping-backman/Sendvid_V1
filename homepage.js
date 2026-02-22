import { fetchVideos } from "/api.js";

/* --- 1. UNIFIED SEED --- */
function getSessionSeed() {
    let seed = sessionStorage.getItem('discover_seed');
    if (!seed) {
        seed = Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('discover_seed', seed);
    }
    return seed;
}
const CURRENT_SEED = getSessionSeed();

/* --- 2. STATE --- */
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
const searchDesktop = document.getElementById("q-desktop");
const searchMobile = document.getElementById("q-mobile");

/* --- 3. FETCH LOGIC --- */
async function fetchUniqueBatch() {
    // Logic: If searching, force relevance. Otherwise use activeSort.
    const effectiveSort = currentQuery ? "relevance" : activeSort;

    const params = {
        limit: PAGE_SIZE,
        offset: offset,
        sort: effectiveSort,
        length: activeLength,
        q: currentQuery
    };

    if (effectiveSort === "discover") {
        params.discoverSeed = CURRENT_SEED;
    }

    const data = await fetchVideos(params);
    offset = data.nextOffset; 
    return data.videos || [];
}

/* --- 4. RENDER --- */
function render(videos) {
    const fragment = document.createDocumentFragment();
    videos.forEach(v => {
        const el = document.createElement("div");
        el.className = "card fade-in";
        if (watched.has(v.id)) el.classList.add("watched");

        el.innerHTML = `
            <a href="bridge.html?id=${v.id}" class="card-link">
                <img class="thumb" src="${v.thumbnail}" alt="${v.title}" loading="lazy">
                <div class="card-body">
                    <div class="title">${v.title}</div>
                    <div class="meta">${v.duration} • ${v.views} views</div>
                </div>
            </a>
        `;
        fragment.appendChild(el);
    });
    gallery.appendChild(fragment);
}

/* --- 5. CORE FUNCTIONS --- */
async function load(reset = false) {
    if (loading) return;
    loading = true;

    if (reset) {
        gallery.innerHTML = "";
        offset = 0;
    }

    loader.style.display = "block";
    loadMoreBtn.style.display = "none";

    try {
        const batch = await fetchUniqueBatch();
        render(batch);
        if (batch.length === PAGE_SIZE) loadMoreBtn.style.display = "block";
    } catch (e) {
        console.error("Load failed", e);
    } finally {
        loader.style.display = "none";
        loading = false;
    }
}

// Search Handler
let searchTimer;
function handleSearch(val) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentQuery = val.trim();
        load(true);
    }, 300);
}

/* --- 6. EVENTS --- */
searchDesktop.addEventListener("input", e => handleSearch(e.target.value));
loadMoreBtn.addEventListener("click", () => load());

// Filter Buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.dataset.sort) activeSort = btn.dataset.sort;
        if (btn.dataset.length) activeLength = (activeLength === btn.dataset.length) ? null : btn.dataset.length;
        
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        load(true);
    });
});

// Init
load(true);
