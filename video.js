import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;
const UP_NEXT_COUNT = 3;

const params = new URLSearchParams(location.search);
const id = params.get("id");

let offset = 0;
let activeSort = "discover";
let currentQuery = "";
let loading = false;

const discoverSeed = sessionStorage.getItem("discoverSeed") ||
(() => {
  const s = Math.random().toString(36).slice(2);
  sessionStorage.setItem("discoverSeed", s);
  return s;
})();

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

const playerWrapper = document.getElementById("playerWrapper");
const videoTitle = document.getElementById("videoTitle");
const videoMeta = document.getElementById("videoMeta");

const upNextGrid = document.getElementById("upNextGrid");
const grid = document.getElementById("discoverGrid");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");

const resultsHintDesktop = document.getElementById("resultsHintDesktop");
const searchDesktop = document.getElementById("q-desktop");
const clearDesktop = document.getElementById("clearSearchDesktop");

/* ================= VIDEO PLAYER (THUMBNAIL SWAP) ================= */
async function loadVideo() {
  try {
    const data = await fetchVideos({ id });
    if (!data?.video) {
      videoTitle.textContent = "Video not found";
      return;
    }

    const v = data.video;
    videoTitle.textContent = v.title;
    videoMeta.textContent = `${v.duration} • ${v.views} views`;

    renderThumbnailPlayer(v);
  } catch (err) {
    console.error(err);
    videoTitle.textContent = "Error loading video";
  }
}

function renderThumbnailPlayer(video) {
  // 1. Logic: Determine the correct Proxy Source
  // We use the proxiedEmbed from API, but build it manually if Google is slow to update
  const workerBase = "https://sendvid-proxy-tester.uilliam-maya.workers.dev/?url=";
  const videoSrc = video.proxiedEmbed || (video.embed ? workerBase + encodeURIComponent(video.embed) : "");

  console.log("Initializing Player with Source:", videoSrc);

  // 2. Inject HTML
  playerWrapper.innerHTML = `
    <div class="video-container" style="position: relative; width: 100%; padding-top: 56.25%; background: #000; overflow: hidden; border-radius: 8px;">
      <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; cursor: pointer;">
      <button class="play-btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 15px 30px; background: rgba(0,0,0,0.7); color: white; border: 2px solid white; border-radius: 50px; font-size: 24px; cursor: pointer; z-index: 2;">▶</button>
      <iframe
        class="video-frame"
        src="about:blank"
        allow="autoplay; fullscreen; picture-in-picture"
        style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
        allowfullscreen>
      </iframe>
    </div>
  `;

  const thumb = playerWrapper.querySelector(".video-thumb");
  const frame = playerWrapper.querySelector(".video-frame");
  const playBtn = playerWrapper.querySelector(".play-btn");

  const playVideo = () => {
    if (!videoSrc) return console.error("No source found");
    
    frame.src = videoSrc;
    frame.style.display = "block";
    thumb.style.display = "none";
    playBtn.style.display = "none";

    // Track viewed status
    if (!watched.has(video.id)) {
      watched.add(video.id);
      localStorage.setItem("watched", JSON.stringify(Array.from(watched)));
    }
  };

  thumb.addEventListener("click", playVideo);
  playBtn.addEventListener("click", playVideo);
}

/* ================= FETCH & RENDER ================= */
async function fetchBatch(limit) {
  try {
    const data = await fetchVideos({
      limit,
      offset,
      sort: activeSort,
      q: currentQuery,
      discoverSeed
    });
    offset = data.nextOffset ?? null;
    return data.videos ?? [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

function createCard(v, side = false) {
  const el = document.createElement("div");
  el.className = `card ${side ? "side-card" : "fade-in"}`;
  el.dataset.id = v.id;
  if (watched.has(v.id) && !side) el.classList.add("watched");

  el.innerHTML = `
    <a href="bridge.html?id=${v.id}" class="card-link ${side ? 'side-card-link' : ''}">
      <img class="thumb" src="${v.thumbnail}" alt="${v.title}" loading="lazy">
      <div class="card-body">
        <div class="title">${v.title}</div>
        <div class="meta">${v.duration} • ${v.views} views</div>
      </div>
    </a>
  `;
  return el;
}

function renderUpNext(videos) {
  upNextGrid.innerHTML = "";
  videos.slice(0, UP_NEXT_COUNT).forEach(v => upNextGrid.appendChild(createCard(v, true)));
}

function renderGrid(videos) {
  const fragment = document.createDocumentFragment();
  videos.forEach(v => fragment.appendChild(createCard(v, false)));
  grid.appendChild(fragment);
  if (resultsHintDesktop) resultsHintDesktop.textContent = `Showing ${grid.children.length} videos`;
}

async function load(reset = false) {
  if (loading) return;
  loading = true;
  if (reset) { grid.innerHTML = ""; offset = 0; }
  loader.style.display = "block";
  loadMoreBtn.style.display = "none";

  const batch = await fetchBatch(PAGE_SIZE);
  if (reset) renderUpNext(batch);
  renderGrid(batch);

  loader.style.display = "none";
  loading = false;
  loadMoreBtn.style.display = (batch.length === PAGE_SIZE) ? "block" : "none";
}

/* ================= FILTERS & SEARCH ================= */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.sort === activeSort) return;
    activeSort = btn.dataset.sort;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    load(true);
  });
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
  if (searchDesktop) searchDesktop.value = "";
  clearDesktop.style.display = "none";
  currentQuery = "";
  load(true);
});

/* ================= INIT ================= */
loadVideo();
load(true);
loadMoreBtn.addEventListener("click", () => load());

const backToTop = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
  backToTop?.classList.toggle("visible", window.scrollY > 400);
});
backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
