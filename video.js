import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;

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

const grid = document.getElementById("discoverGrid");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");

const resultsHintDesktop = document.getElementById("resultsHintDesktop");

const searchDesktop = document.getElementById("q-desktop");
const clearDesktop = document.getElementById("clearSearchDesktop");

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
    <div class="player-wrapper-inner">
      <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}">
      <button class="play-btn">▶</button>
      <iframe
        class="video-frame"
        src=""
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin"
        frameborder="0">
      </iframe>
    </div>
  `;

  const thumb = playerWrapper.querySelector(".video-thumb");
  const frame = playerWrapper.querySelector(".video-frame");
  const playBtn = playerWrapper.querySelector(".play-btn");

  frame.style.display = "none";

  function playVideo() {

    // future monetization trigger goes here

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

  offset = data.nextOffset != null ? data.nextOffset : null;
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
  loadMoreBtn.style.display = "none";

  const batch = await fetchBatch();
  render(batch);

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

/* ================= WATCHED TRACKING ================= */

grid.addEventListener("click", e => {
  const link = e.target.closest(".card-link");
  if (!link) return;

  const card = link.closest(".card");
  if (!card) return;

  const vid = card.dataset.id;

  watched.add(vid);
  localStorage.setItem("watched", JSON.stringify([...watched]));

  card.classList.add("watched");
});

/*=== Adde back to top button listener script==== */
<script>
const btn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 400) {
    btn.classList.add("visible");
  } else {
    btn.classList.remove("visible");
  }
});

btn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
</script>

/* ================= INIT ================= */

loadVideo();
load(true);

loadMoreBtn.addEventListener("click", () => load());
