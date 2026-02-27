// homepage.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
import { initBackToTop } from "/ui-backtotop.js";

const PAGE_SIZE = 20;

let offset = 0;
let activeSort = "discover";
let activeLength = null;
let currentQuery = "";
let loading = false;

const watched = new Set(
  JSON.parse(localStorage.getItem("watched") || "[]")
);

// DOM
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");

const searchDesktop = document.getElementById("q-desktop");
const searchMobile = document.getElementById("q-mobile");
const clearDesktop = document.getElementById("clearSearchDesktop");
const clearMobile = document.getElementById("clearSearchMobile");

// ---------------- URL SYNC ----------------
function syncFromURL() {
  const p = new URLSearchParams(location.search);
  activeSort = p.get("sort") || "discover";
  activeLength = p.get("length");
  currentQuery = p.get("q") || "";

  if (searchDesktop) searchDesktop.value = currentQuery;
  if (searchMobile) searchMobile.value = currentQuery;

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
    btn.classList.toggle("active", btn.dataset.sort === activeSort);
  });
}

// ---------------- FETCH ----------------
async function fetchBatch(limit) {
  try {
    const data = await fetchVideos({
      limit,
      offset,
      sort: activeSort,
      length: activeLength,
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
    gallery.innerHTML = "";
    offset = 0;
  }

  loader.style.display = "block";
  loadMoreBtn.style.display = "none";
  if (emptyState) emptyState.style.display = "none";

  const batch = await fetchBatch(PAGE_SIZE);

  const fragment = document.createDocumentFragment();
  batch.forEach(v =>
    fragment.appendChild(createVideoCard(v, { watched }))
  );

  gallery.appendChild(fragment);

  loader.style.display = "none";
  loading = false;

  if (!gallery.children.length && emptyState) {
    emptyState.style.display = "block";
  }

  loadMoreBtn.style.display = offset !== null ? "block" : "none";
}

// ---------------- FILTERS ----------------
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.onclick = () => {
    if (btn.dataset.sort === activeSort) return;
    activeSort = btn.dataset.sort;
    syncToURL();
    updateActiveButtons();
    load(true);
  };
});

// ---------------- SEARCH ----------------
let searchTimer;

function handleSearch(val) {
  currentQuery = val.trim();
  syncToURL();
  load(true);
}

searchDesktop?.addEventListener("input", e => {
  if (clearDesktop) {
    clearDesktop.style.display = e.target.value ? "block" : "none";
  }
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => handleSearch(e.target.value), 400);
});

searchMobile?.addEventListener("input", e => {
  if (clearMobile) {
    clearMobile.style.display = e.target.value ? "block" : "none";
  }
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => handleSearch(e.target.value), 400);
});

clearDesktop?.addEventListener("click", () => {
  searchDesktop.value = "";
  clearDesktop.style.display = "none";
  handleSearch("");
});

clearMobile?.addEventListener("click", () => {
  searchMobile.value = "";
  clearMobile.style.display = "none";
  handleSearch("");
});

// ---------------- INIT ----------------
syncFromURL();
load(true);
loadMoreBtn.onclick = () => load();
initBackToTop("backToTop");
