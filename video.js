// video.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
import { loadPlayer } from "/player.js";
import { initBackToTop } from "/ui-backtotop.js";

const PAGE_SIZE = 20;
const UP_NEXT_COUNT = 4;

const params = new URLSearchParams(location.search);
const videoId =
  params.get("id") ||
  window.location.pathname.split("/").filter(Boolean).pop();

let offset = 0;
let activeSort = "discover";
let currentQuery = "";
let loading = false;

const watched = new Set(
  JSON.parse(localStorage.getItem("watched") || "[]")
);

// DOM
const playerWrapper = document.getElementById("playerWrapper");
const videoTitle = document.getElementById("videoTitle");
const videoMeta = document.getElementById("videoMeta");
const upNextGrid = document.getElementById("upNextGrid");
const grid = document.getElementById("discoverGrid");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const searchDesktop = document.getElementById("q-desktop");
const clearDesktop = document.getElementById("clearSearchDesktop");

// ---------------- LOAD VIDEO ----------------
async function loadVideo() {
  if (!videoId) {
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

    loadPlayer(v, playerWrapper, watched);
  } catch (err) {
    console.error(err);
    videoTitle.textContent = "Error loading video";
  }
}

// ---------------- FETCH ----------------
async function fetchBatch(limit) {
  try {
    const data = await fetchVideos({
      limit,
      offset,
      sort: activeSort,
      q: currentQuery
    });

    if (!data.videos || data.videos.length < limit || data.nextOffset === -1) {
      offset = null;
    } else {
      offset = data.nextOffset;
    }

    return data.videos ?? [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ---------------- LOAD ----------------
async function load(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    grid.innerHTML = "";
    if (upNextGrid) upNextGrid.innerHTML = "";
    offset = 0;
  }

  loader.style.display = "block";
  loadMoreBtn.style.display = "none";

  const batch = await fetchBatch(PAGE_SIZE);

  if (reset && upNextGrid) {
    batch
      .slice(0, UP_NEXT_COUNT)
      .forEach(v =>
        upNextGrid.appendChild(
          createVideoCard(v, { compact: true, watched })
        )
      );
  }

  const fragment = document.createDocumentFragment();
  batch.forEach(v =>
    fragment.appendChild(createVideoCard(v, { watched }))
  );

  grid.appendChild(fragment);

  loader.style.display = "none";
  loading = false;

  loadMoreBtn.style.display = offset !== null ? "block" : "none";
}

// ---------------- SEARCH ----------------
let searchTimer;

searchDesktop?.addEventListener("input", e => {
  if (clearDesktop) {
    clearDesktop.style.display = e.target.value ? "block" : "none";
  }

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

// ---------------- INIT ----------------
loadVideo();
load(true);
loadMoreBtn.onclick = () => load();
initBackToTop("backToTop");
