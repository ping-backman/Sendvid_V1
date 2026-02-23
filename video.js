import { fetchVideos } from "/api.js";

/** * Persistent Seed Logic
 * Ensures "Discover" randomization stays consistent during the session.
 */
const CURRENT_SEED = (() => {
    let seed = sessionStorage.getItem('discoverSeed');
    if (!seed) {
        seed = Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('discoverSeed', seed);
    }
    return seed;
})();

const PAGE_SIZE = 20;
const UP_NEXT_COUNT = 4;

/** * Hybrid ID Detection
 * Picks up the ID from ?id= OR from the clean URL path /v/ID
 */
const params = new URLSearchParams(location.search);
const videoId = params.get("id") || window.location.pathname.split('/').filter(Boolean).pop();

let offset = 0;
let activeSort = "discover";
let currentQuery = "";
let loading = false;

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

// DOM Elements
const playerWrapper = document.getElementById("playerWrapper");
const videoTitle = document.getElementById("videoTitle");
const videoMeta = document.getElementById("videoMeta");
const upNextGrid = document.getElementById("upNextGrid");
const grid = document.getElementById("discoverGrid");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const searchDesktop = document.getElementById("q-desktop");
const clearDesktop = document.getElementById("clearSearchDesktop");
const resultsHintDesktop = document.getElementById("resultsHintDesktop");

/* ================= VIDEO PLAYER ================= */
async function loadVideo() {
    if (!videoId || videoId === 'v') {
        videoTitle.textContent = "No Video ID provided";
        return;
    }
    try {
        const data = await fetchVideos({ id: videoId });
        if (!data?.video) {
            videoTitle.textContent = "Video not found";
            return;
        }
        const v = data.video;
        videoTitle.textContent = v.title;
        videoMeta.textContent = `${v.duration} • ${v.views} views`;
        renderThumbnailPlayer(v);
    } catch (err) {
        console.error("Load Error:", err);
        videoTitle.textContent = "Error loading video";
    }
}

function renderThumbnailPlayer(video) {
    const workerBase = "https://sendvid-proxy-tester.uilliam-maya.workers.dev/?url=";
    const videoSrc = video.proxiedEmbed || (video.id ? workerBase + encodeURIComponent(`https://sendvid.com/embed/${video.id}`) : "");

    playerWrapper.innerHTML = `
        <div class="video-container" style="position: relative; width: 100%; height: 100%;">
            <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; cursor: pointer; z-index: 2;">
            <button class="play-btn" style="z-index: 3;">▶</button>
            <iframe class="video-frame" src="about:blank" allow="autoplay; fullscreen" style="display: none; position: absolute; inset: 0; width: 100%; height: 100%; border: none; z-index: 1;" allowfullscreen></iframe>
        </div>
    `;

    const thumb = playerWrapper.querySelector(".video-thumb");
    const frame = playerWrapper.querySelector(".video-frame");
    const playBtn = playerWrapper.querySelector(".play-btn");

    const playVideo = () => {
        frame.src = videoSrc;
        frame.style.display = "block";
        thumb.style.display = "none";
        playBtn.style.display = "none";
        
        // Add to watched on play
        if (!watched.has(video.id)) {
            watched.add(video.id);
            localStorage.setItem("watched", JSON.stringify([...watched]));
        }
    };

    thumb.onclick = playVideo;
    playBtn.onclick = playVideo;
}

/* ================= FETCH & RENDER ================= */
async function fetchBatch(limit) {
    try {
        const data = await fetchVideos({
            limit,
            offset,
            sort: activeSort,
            q: currentQuery,
            discoverSeed: CURRENT_SEED // Standardized name
        });

        // RECONCILED LOGIC: Handle the -1 signal
        if (data.nextOffset === -1 || !data.videos || data.videos.length < limit) {
            offset = null; 
        } else {
            offset = data.nextOffset;
        }

        return data.videos ?? [];
    } catch (err) {
        console.error("Batch fetch failed", err);
        return [];
    }
}

function createCard(v, side = false) {
    const el = document.createElement("div");
    el.className = `card ${side ? "side-card" : "fade-in"}`;
    el.dataset.id = v.id;
    if (watched.has(v.id)) el.classList.add("watched");

    el.innerHTML = `
        <a href="/w/${v.id}" class="card-link ${side ? 'side-card-link' : ''}">
            <img class="thumb" src="${v.thumbnail}" alt="${v.title}" loading="lazy">
            <div class="card-body">
                <div class="title">${v.title}</div>
                <div class="meta">${v.duration} • ${v.views} views</div>
            </div>
        </a>
    `;
    return el;
}

/* ================= TOUCH DRAG FIX & WATCHED SYNC ================= */
let touchStartX = 0, touchStartY = 0, isDragging = false;
[upNextGrid, grid].forEach(container => {
    if(!container) return;
    container.addEventListener("touchstart", e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = false;
    }, { passive: true });

    container.addEventListener("touchmove", e => {
        if (Math.abs(e.touches[0].clientX - touchStartX) > 10 || Math.abs(e.touches[0].clientY - touchStartY) > 10) 
            isDragging = true;
    }, { passive: true });

    container.addEventListener("click", e => {
        const link = e.target.closest(".card-link");
        if (!link || isDragging) return;
        const card = link.closest(".card");
        const id = card.dataset.id;
        watched.add(id);
        localStorage.setItem("watched", JSON.stringify([...watched]));
        card.classList.add("watched");
    });
});

async function load(reset = false) {
    if (loading) return;
    loading = true;
    if (reset) { grid.innerHTML = ""; offset = 0; }
    loader.style.display = "block";
    loadMoreBtn.style.display = "none";

    const batch = await fetchBatch(PAGE_SIZE);
    if (reset) {
        upNextGrid.innerHTML = "";
        batch.slice(0, UP_NEXT_COUNT).forEach(v => upNextGrid.appendChild(createCard(v, true)));
    }
    
    const fragment = document.createDocumentFragment();
    batch.forEach(v => fragment.appendChild(createCard(v, false)));
    grid.appendChild(fragment);

    if (resultsHintDesktop) resultsHintDesktop.textContent = `Showing ${grid.children.length} suggested`;
    loader.style.display = "none";
    loading = false;
    loadMoreBtn.style.display = (offset !== null) ? "block" : "none";
}

/* ================= FILTERS & SEARCH ================= */
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
        if (btn.dataset.sort === activeSort) return;
        activeSort = btn.dataset.sort;
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        load(true);
    };
});

let searchTimer;
searchDesktop?.addEventListener("input", e => {
    if (clearDesktop) clearDesktop.style.display = e.target.value ? "block" : "none";
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentQuery = e.target.value.trim();
        load(true);
    }, 400);
});

clearDesktop?.addEventListener("click", () => {
    searchDesktop.value = "";
    clearDesktop.style.display = "none";
    currentQuery = "";
    load(true);
});

/* ================= INIT ================= */
loadVideo();
load(true);
loadMoreBtn.onclick = () => load();

const backToTop = document.getElementById("backToTop");
window.onscroll = () => backToTop?.classList.toggle("visible", window.scrollY > 400);
backToTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
