import { fetchVideos } from "/api.js";

/* ---------- SESSION SEED ---------- */
function getSessionSeed() {
    let seed = sessionStorage.getItem('discover_seed');
    if (!seed) {
        seed = Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('discover_seed', seed);
    }
    return seed;
}
const CURRENT_SEED = getSessionSeed();

/* ---------- STATE ---------- */
const PAGE_SIZE = 20;
let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";
let loading = false;

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

/* ---------- DOM ELEMENTS ---------- */
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
const desktopControls = document.querySelector(".controls-desktop");

/* ---------- URL SYNC & FILTERS ---------- */
function syncFromURL() {
    const p = new URLSearchParams(location.search);
    activeSort = p.get("sort") || "relevance";
    activeLength = p.get("length");
    currentQuery = p.get("q") || "";
    if (searchDesktop) searchDesktop.value = currentQuery;
    if (searchMobile) searchMobile.value = currentQuery;
    if (clearDesktop) clearDesktop.style.display = currentQuery ? "block" : "none";
    if (clearMobile) clearMobile.style.display = currentQuery ? "block" : "none";
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

function updateResultsHint() {
    const text = `Showing ${gallery.children.length} videos`;
    if (resultsHintDesktop) resultsHintDesktop.textContent = text;
    if (resultsHintMobile) resultsHintMobile.textContent = text;
}

/* ---------- FETCH & RENDER ---------- */
async function fetchUniqueBatch() {
    const effectiveSort = currentQuery ? "relevance" : activeSort;
    const params = {
        limit: PAGE_SIZE,
        offset: offset,
        sort: effectiveSort,
        length: activeLength,
        q: currentQuery
    };
    if (effectiveSort === "discover") params.discoverSeed = CURRENT_SEED;

    const data = await fetchVideos(params);
    offset = data.nextOffset != null ? data.nextOffset : null;
    return data.videos || [];
}

function render(videos) {
    const fragment = document.createDocumentFragment();
    videos.forEach(v => {
        const el = document.createElement("div");
        el.className = "card fade-in";
        el.dataset.id = v.id;
        if (watched.has(v.id)) el.classList.add("watched");

        el.innerHTML = `
            <a href="bridge.html?id=${v.id}" class="card-link">
                <img class="thumb" src="${v.thumbnail}" alt="${v.title}" loading="lazy" decoding="async">
                <div class="card-body">
                    <div class="title">${v.title}</div>
                    <div class="meta">${v.duration} • ${v.views} views</div>
                </div>
            </a>
        `;
        fragment.appendChild(el);
    });
    gallery.appendChild(fragment);
    updateResultsHint();
}

/* ---------- MOBILE DRAG FIX & WATCHED STATE ---------- */
let touchStartX = 0, touchStartY = 0, isDragging = false;
gallery.addEventListener("touchstart", e => {
    if (!e.target.closest(".card")) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
}, { passive: true });

gallery.addEventListener("touchmove", e => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 10 || dy > 10) isDragging = true;
}, { passive: true });

gallery.addEventListener("click", e => {
    const link = e.target.closest(".card-link");
    if (!link) return;
    if (isDragging) { e.preventDefault(); return; }
    
    const card = link.closest(".card");
    watched.add(card.dataset.id);
    localStorage.setItem("watched", JSON.stringify([...watched]));
    card.classList.add("watched");
});

/* ---------- CORE LOAD ---------- */
async function load(reset = false) {
    if (loading) return;
    loading = true;

    if (reset) {
        gallery.innerHTML = "";
        offset = 0;
        window.scrollTo({ top: 0 });
    }

    loader.style.display = "block";
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    if (emptyState) emptyState.style.display = "none";

    try {
        const batch = await fetchUniqueBatch();
        render(batch);
        if (!gallery.children.length && emptyState) emptyState.style.display = "block";
        if (batch.length === PAGE_SIZE && loadMoreBtn) loadMoreBtn.style.display = "block";
    } catch (e) {
        console.error(e);
    } finally {
        loader.style.display = "none";
        loading = false;
    }
}

/* ---------- EVENT LISTENERS ---------- */
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.dataset.sort && btn.dataset.sort !== activeSort) {
            activeSort = btn.dataset.sort;
            syncToURL();
            updateActiveButtons();
            load(true);
            return;
        }
        if (btn.dataset.length) {
            activeLength = activeLength === btn.dataset.length ? null : btn.dataset.length;
            syncToURL();
            updateActiveButtons();
            load(true);
        }
    });
});

let searchTimer;
function handleSearch(val) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentQuery = val.trim();
        syncToURL();
        load(true);
    }, 400);
}

if (searchDesktop) {
    searchDesktop.addEventListener("input", e => {
        if (clearDesktop) clearDesktop.style.display = e.target.value ? "block" : "none";
        if (searchMobile) searchMobile.value = e.target.value;
        handleSearch(e.target.value);
    });
}
if (searchMobile) {
    searchMobile.addEventListener("input", e => {
        if (clearMobile) clearMobile.style.display = e.target.value ? "block" : "none";
        if (searchDesktop) searchDesktop.value = e.target.value;
        handleSearch(e.target.value);
    });
}

if (clearDesktop) clearDesktop.addEventListener("click", () => {
    searchDesktop.value = "";
    if (searchMobile) searchMobile.value = "";
    clearDesktop.style.display = "none";
    if (clearMobile) clearMobile.style.display = "none";
    currentQuery = "";
    syncToURL();
    load(true);
});
if (clearMobile) clearMobile.addEventListener("click", () => clearDesktop.click());

if (loadMoreBtn) loadMoreBtn.addEventListener("click", () => load());

window.addEventListener("scroll", () => {
    if (backToTop) backToTop.classList.toggle("visible", window.scrollY > 500);
    if (desktopControls) desktopControls.classList.toggle("compact", window.scrollY > 40);
});

if (backToTop) backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

syncFromURL();
load(true);
