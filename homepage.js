import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;

/** * Persistent Seed Logic */
const CURRENT_SEED = (() => {
    let seed = sessionStorage.getItem('discover_seed');
    if (!seed) {
        seed = Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('discover_seed', seed);
    }
    return seed;
})();

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
const resultsHintDesktop = document.getElementById("resultsHintDesktop");
const resultsHintMobile = document.getElementById("resultsHintMobile");
const searchDesktop = document.getElementById("q-desktop");
const searchMobile = document.getElementById("q-mobile");
const clearDesktop = document.getElementById("clearSearchDesktop");
const clearMobile = document.getElementById("clearSearchMobile");

/* ---------- URL SYNC (Preserved from original) ---------- */
function syncFromURL() {
    const p = new URLSearchParams(location.search);
    activeSort = p.get("sort") || "relevance";
    activeLength = p.get("length");
    currentQuery = p.get("q") || "";
    
    if(searchDesktop) searchDesktop.value = currentQuery;
    if(searchMobile) searchMobile.value = currentQuery;
    if(clearDesktop) clearDesktop.style.display = currentQuery ? "block" : "none";
    if(clearMobile) clearMobile.style.display = currentQuery ? "block" : "none";
    
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
        if (btn.dataset.sort)
            btn.classList.toggle("active", btn.dataset.sort === activeSort);
        if (btn.dataset.length)
            btn.classList.toggle("active", btn.dataset.length === activeLength);
    });
}

/* ---------- FETCH & RENDER ---------- */
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

    try {
        const data = await fetchVideos({
            limit: PAGE_SIZE,
            offset,
            sort: activeSort,
            length: activeLength,
            q: currentQuery,
            discoverSeed: CURRENT_SEED
        });

        offset = data.nextOffset ?? null;
        render(data.videos || []);
    } catch (err) {
        console.error("Fetch error:", err);
    }

    loader.style.display = "none";
    loading = false;
    
    if (!gallery.children.length && emptyState) emptyState.style.display = "block";
    if (offset !== null) loadMoreBtn.style.display = "block";
}

function render(videos) {
    const fragment = document.createDocumentFragment();
    videos.forEach(v => {
        const el = document.createElement("div");
        el.className = "card fade-in";
        el.dataset.id = v.id;
        if (watched.has(v.id)) el.classList.add("watched");

        // Updated to use the clean /w/ path for the bridge
        el.innerHTML = `
            <a href="/w/${v.id}" class="card-link">
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
    
    const hint = `Showing ${gallery.children.length} videos`;
    if (resultsHintDesktop) resultsHintDesktop.textContent = hint;
    if (resultsHintMobile) resultsHintMobile.textContent = hint;
}

/* ---------- TOUCH & CLICK LOGIC (Restored Drag Fix) ---------- */
let touchStartX = 0, touchStartY = 0, isDragging = false;

gallery.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isDragging = false;
}, { passive: true });

gallery.addEventListener("touchmove", e => {
    const touch = e.touches[0];
    if (Math.abs(touch.clientX - touchStartX) > 10 || Math.abs(touch.clientY - touchStartY) > 10) 
        isDragging = true;
}, { passive: true });

gallery.addEventListener("click", e => {
    const link = e.target.closest(".card-link");
    if (!link || isDragging) return;

    const id = link.closest(".card").dataset.id;
    watched.add(id);
    localStorage.setItem("watched", JSON.stringify([...watched]));
    link.closest(".card").classList.add("watched");
});

/* ---------- FILTERS & SEARCH ---------- */
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.dataset.sort) {
            if (btn.dataset.sort === activeSort) return;
            activeSort = btn.dataset.sort;
        } else if (btn.dataset.length) {
            activeLength = activeLength === btn.dataset.length ? null : btn.dataset.length;
        }
        syncToURL();
        updateActiveButtons();
        load(true);
    });
});

let searchTimer;
const handleSearch = (val) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentQuery = val.trim();
        syncToURL();
        load(true);
    }, 400);
};

[searchDesktop, searchMobile].forEach(input => {
    input?.addEventListener("input", e => {
        const val = e.target.value;
        if (searchDesktop) searchDesktop.value = val;
        if (searchMobile) searchMobile.value = val;
        if (clearDesktop) clearDesktop.style.display = val ? "block" : "none";
        if (clearMobile) clearMobile.style.display = val ? "block" : "none";
        handleSearch(val);
    });
});

clearDesktop?.addEventListener("click", () => {
    searchDesktop.value = "";
    searchMobile.value = "";
    clearDesktop.style.display = "none";
    clearMobile.style.display = "none";
    currentQuery = "";
    syncToURL();
    load(true);
});
clearMobile?.addEventListener("click", () => clearDesktop.click());

/* ---------- INIT ---------- */
loadMoreBtn.onclick = () => load();
window.addEventListener("scroll", () => {
    backToTop?.classList.toggle("visible", window.scrollY > 500);
});
backToTop?.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

syncFromURL();
load(true);
