import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;

const params = new URLSearchParams(location.search);
const id = params.get("id");

let offset = 0;
let activeSort = "discover";
let currentQuery = "";
let loading = false;

/* ================= SEED ================= */

const discoverSeed =
  sessionStorage.getItem("discoverSeed") ||
  (() => {
    const s = Math.random().toString(36).slice(2);
    sessionStorage.setItem("discoverSeed", s);
    return s;
  })();

/* ================= WATCHED ================= */

const watched = new Set(
  JSON.parse(localStorage.getItem("watched") || "[]")
);

/* ================= DOM ================= */

const playerWrapper = document.getElementById("playerWrapper");
const videoTitle = document.getElementById("videoTitle");
const videoMeta = document.getElementById("videoMeta");

const grid = document.getElementById("discoverGrid");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");

const resultsHintDesktop = document.getElementById("resultsHintDesktop");

const searchDesktop = document.getElementById("q-desktop");
const clearDesktop = document.getElementById("clearSearchDesktop");

const backBtn = document.getElementById("backToTop");

/* ================= VIDEO LOAD ================= */

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

/* ================= DISCOVER ================= */

async function fetchBatch() {
  const data = await fetchVideos({
    limit: PAGE_SIZE,
    offset,
    sort: activeSort,
    q: currentQuery,
    discoverSeed
  });

  offset = data.nextOffset ?? null;
  return data.videos;
}

function updateResultsHint() {
  resultsHintDesktop.textContent =
    `Showing ${grid.children.length} videos`;
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

    fragment.appendChild(el);
  });

  grid.appendChild(fragment);
  updateResultsHint();
}

async function load(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    grid.innerHTML = "";
    offset = 0;
  }

  loader.style.display = "block";
  loadMoreBtn.sty
