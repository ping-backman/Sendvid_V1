import { fetchVideos } from "/api.js";

function getSessionSeed() {
    let seed = sessionStorage.getItem('discover_seed');
    if (!seed) {
        seed = Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('discover_seed', seed);
    }
    return seed;
}
const CURRENT_SEED = getSessionSeed();

const params = new URLSearchParams(location.search);
const videoId = params.get("id");

let currentQuery = "";
const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

const playerWrapper = document.getElementById("playerWrapper");
const upNextGrid = document.getElementById("upNextGrid");
const discoverGrid = document.getElementById("discoverGrid");
const resultsHintDesktop = document.getElementById("resultsHintDesktop");

/* ---------- PLAYER & 404 FIX ---------- */
async function initPlayer() {
    try {
        const data = await fetchVideos({ id: videoId });
        if (!data?.video) {
            document.getElementById("videoTitle").textContent = "Video not found";
            return;
        }

        const v = data.video;
        document.getElementById("videoTitle").textContent = v.title;
        document.getElementById("videoMeta").textContent = `${v.duration} • ${v.views} views`;

        // BULLETPROOF PROXY URL: If API drops proxiedEmbed, we build it manually.
        const workerBase = "https://sendvid-proxy-tester.uilliam-maya.workers.dev/?url=";
        const rawEmbed = v.embed || `https://sendvid.com/embed/${v.id}`;
        const videoSrc = v.proxiedEmbed || (workerBase + encodeURIComponent(rawEmbed));

        // Note: No extra div wrappers here so theme.css 'absolute' positioning works!
        playerWrapper.innerHTML = `
            <img src="${v.thumbnail}" class="video-thumb" id="poster" alt="${v.title}">
            <button class="play-btn" id="play">▶</button>
            <iframe id="frame" src="about:blank" allow="autoplay; fullscreen; picture-in-picture" style="display:none;" allowfullscreen></iframe>
        `;

        const playBtn = document.getElementById("play");
        const poster = document.getElementById("poster");
        const frame = document.getElementById("frame");

        const playVideo = () => {
            frame.src = videoSrc;
            frame.style.display = "block";
            poster.style.display = "none";
            playBtn.style.display = "none";

            if (!watched.has(v.id)) {
                watched.add(v.id);
                localStorage.setItem("watched", JSON.stringify([...watched]));
            }
        };

        playBtn.addEventListener("click", playVideo);
        poster.addEventListener("click", playVideo);

    } catch (err) {
        console.error(err);
        document.getElementById("videoTitle").textContent = "Error loading video";
    }
}

/* ---------- SUGGESTED FEEDS ---------- */
async function loadSuggested() {
    try {
        const data = await fetchVideos({
            limit: 24,
            sort: "discover",
            q: currentQuery,
            discoverSeed: CURRENT_SEED
        });

        const videos = (data.videos || []).filter(v => v.id !== videoId);

        upNextGrid.innerHTML = "";
        discoverGrid.innerHTML = "";

        // Side column
        videos.slice(0, 4).forEach(v => {
            upNextGrid.appendChild(createCard(v, true));
        });

        // Bottom grid
        videos.slice(4).forEach(v => {
            discoverGrid.appendChild(createCard(v, false));
        });

        if (resultsHintDesktop) {
            resultsHintDesktop.textContent = `Showing ${discoverGrid.children.length} videos`;
        }
    } catch (err) {
        console.error(err);
    }
}

function createCard(v, isSide) {
    const div = document.createElement("div");
    div.className = `card ${isSide ? "side-card" : "fade-in"}`;
    if (!isSide && watched.has(v.id)) div.classList.add("watched");

    div.innerHTML = `
        <a href="bridge.html?id=${v.id}" class="card-link ${isSide ? 'side-card-link' : ''}">
            <img class="thumb" src="${v.thumbnail}" alt="${v.title}" loading="lazy">
            <div class="card-body">
                <div class="title">${v.title}</div>
                <div class="meta">${v.duration} • ${v.views} views</div>
            </div>
        </a>
    `;
    return div;
}

/* ---------- SEARCH & UI EVENTS ---------- */
const searchDesktop = document.getElementById("q-desktop");
const clearDesktop = document.getElementById("clearSearchDesktop");

let searchTimer;
if (searchDesktop) {
    searchDesktop.addEventListener("input", e => {
        if (clearDesktop) clearDesktop.style.display = e.target.value ? "block" : "none";
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentQuery = e.target.value.trim();
            loadSuggested();
        }, 300);
    });
}

if (clearDesktop) {
    clearDesktop.addEventListener("click", () => {
        searchDesktop.value = "";
        clearDesktop.style.display = "none";
        currentQuery = "";
        loadSuggested();
    });
}

const backToTop = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
    if (backToTop) backToTop.classList.toggle("visible", window.scrollY > 400);
});
if (backToTop) backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- INIT ---------- */
initPlayer();
loadSuggested();
