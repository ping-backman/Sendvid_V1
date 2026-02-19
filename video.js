import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;
const UP_NEXT_COUNT = 4;

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

/* ================= VIDEO ================= */

async function loadVideo() {
  const data = await fetchVideos({ id });

  if (!data.video) {
    videoTitle.textContent = "Video not found";
    return;
  }

  const v = data.video;

  videoTitle.textContent = v.title;
  videoMeta.textContent = `${v.duration} • ${v.views} views`;

  renderThumbnailPlayer(v);
}

function renderThumbnailPlayer(video) {
  playerWrapper.innerHTML = `
    <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}">
    <button class="play-btn">▶</button>
    <iframe
      class="video-frame"
      allow="autoplay; fullscreen"
      sandbox="allow-scripts allow-same-origin"
      frameborder="0">
    </iframe>
  `;

  const thumb = playerWrapper.querySelector(".video-thumb");
  const frame = playerWrapper.querySelector(".video-frame");
  const playBtn = playerWrapper.querySelector(".play-btn");

  function playVideo() {
    frame.src = `${video.embed}${video.embed.includes("?") ? "&" : "?"}autoplay=1`;
    frame.style.display = "block";
    thumb.style.display = "none";
    playBtn.style.display = "none";
  }

  thumb.addEventListener("click", playVideo);
  playBtn.addEventListener("click", playVideo);
}

/* ================= FETCH ================= */

async function fetchBatch(limit) {
  const data = await fetchVideos({
    limit,
    offset,
    sort: activeSort,
    q: currentQuery,
    discoverSeed
  });

  offset = data.nextOffset != null ? data.nextOffset : null;
  return data.videos;
}

/* ================= RENDER ================= */

function createCard(v, side = false) {
  const el = document.createElement("div");
  el.className = `card ${side ? "side-card" : "fade-in"}`;
  el.dataset.id = v.id;

  if (watched.has(v.id) && !side) {
    el.classList.add("watched");
  }

  el.innerHTML = `
    <a href="bridge.html?id=${v.id}" class="card-link">
      <img class="thumb"
           src="${v.thumbnail}"
           alt="${v.title}"
           loading="lazy"
           decoding="async">
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

  videos.slice(0, UP_NEXT_COUNT).forEach(v => {
    upNextGrid.appendChild(createCard(v, true));
  });
}

function renderGrid(videos) {
  const fragment = document.createDocumentFragment();

  videos.forEach(v => {
    fragment.appendChild(createCard(v, false));
  });

  grid.appendChild(fragment);
  resultsHintDesktop.textContent = `Showing ${grid.children.length} videos`;
}

/* ================= LOAD ================= */

async function load(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    grid.innerHTML = "";
    offset = 0;
  }

  loader.style.display = "block";
  loadMoreBtn.style.display = "none";

  const batch = await fetchBatch(PAGE_SIZE);

  if (reset) renderUpNext(batch);

  renderGrid(batch);

  loader.style.display = "none";
  loading = false;

  if (batch.length === PAGE_SIZE) {
    loadMoreBtn.style.display = "block";
  }
}

/* ================= FILTERS ================= */

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.sort === activeSort) return;
    activeSort = btn.dataset.sort;

    document.querySelectorAll(".filter-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    load(true);
  });
});

/* ================= SEARCH ================= */

let searchTimer;

searchDesktop.addEventListener("input", e => {
  clearDesktop.style.display = e.target.value ? "block" : "none";

  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentQuery = e.target.value.trim();
    load(true);
  }, 400);
});

clearDesktop.addEventListener("click", () => {
  searchDesktop.value = "";
  clearDesktop.style.display = "none";
  currentQuery = "";
  load(true);
});

/* ================= INIT ================= */

loadVideo();
load(true);
loadMoreBtn.addEventListener("click", () => load());
