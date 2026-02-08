import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;

let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";
let loading = false;

const seenIds = new Set();
const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

/* ---------- Discover seed (session stable) ---------- */
let discoverSeed =
  sessionStorage.getItem("discoverSeed") ||
  Math.random().toString(36).slice(2);

sessionStorage.setItem("discoverSeed", discoverSeed);

/* ---------- DOM ---------- */
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

/* ---------- URL sync ---------- */
function syncFromURL() {
  const p = new URLSearchParams(location.search);
  activeSort = p.get("sort") || "relevance";
  activeLength = p.get("length");
  currentQuery = p.get("q") || "";

  searchDesktop.value = currentQuery;
  searchMobile.value = currentQuery;

  updateActiveButtons();
}

function syncToURL() {
  const p = new URLSearchParams();
  p.set("sort", activeSort);
  if (activeLength) p.set("length", activeLength);
  if (currentQuery) p.set("q", currentQuery);
  history.replaceState({}, "", `?${p.toString()}`);
}

/* ---------- Active buttons ---------- */
function updateActiveButtons() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    if (btn.dataset.sort)
      btn.classList.toggle("active", btn.dataset.sort === activeSort);
    if (btn.dataset.length)
      btn.classList.toggle("active", btn.dataset.length === activeLength);
  });
}

/* ---------- Fetch ---------- */
async function fetchUniqueBatch() {
  const collected = [];

  while (collected.length < PAGE_SIZE) {
    const data = await fetchVideos({
      limit: PAGE_SIZE,
      offset,
      sort: activeSort,
      length: activeLength,
      q: currentQuery,
      discoverSeed,
      watched: [...watched].slice(-50).join(",")
    });

    offset = data.nextOffset;
    if (!data.videos.length) break;

    for (const v of data.videos) {
      if (!seenIds.has(v.id)) {
        seenIds.add(v.id);
        collected.push(v);
        if (collected.length === PAGE_SIZE) break;
      }
    }

    if (!data.nextOffset) break;
  }

  return collected;
}

/* ---------- Render ---------- */
function updateResultsHint() {
  const t = `Showing ${gallery.children.length} videos`;
  resultsHintDesktop.textContent = t;
  resultsHintMobile.textContent = t;
}

function render(videos) {
  videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "card fade-in";
    if (watched.has(v.id)) el.classList.add("watched");

    el.innerHTML = `
      <a href="bridge.html?id=${v.id}">
        <img class="thumb" src="${v.thumbnail}">
        <div class="card-body">
          <div class="title">${v.title}</div>
          <div class="meta">${v.duration} • ${v.views} views</div>
        </div>
      </a>
    `;

    const link = el.querySelector("a");

    link.addEventListener("click", () => {
      watched.add(v.id);
      localStorage.setItem("watched", JSON.stringify([...watched]));
      el.classList.add("watched");
    });

    gallery.appendChild(el);
  });

  updateResultsHint();
}

/* ---------- Load ---------- */
async function load(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
    seenIds.clear();
    window.scrollTo({ top: 0 });
  }

  loader.style.display = "block";
  loadMoreBtn.style.display = "none";

  const batch = await fetchUniqueBatch();
  render(batch);

  loader.style.display = "none";
  loading = false;

  if (!gallery.children.length) emptyState.style.display = "block";
  if (batch.length === PAGE_SIZE) loadMoreBtn.style.display = "block";
}

/* ---------- Filters ---------- */
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
      activeLength =
        activeLength === btn.dataset.length ? null : btn.dataset.length;
      syncToURL();
      updateActiveButtons();
      load(true);
    }
  });
});

/* ---------- Init ---------- */
syncFromURL();
load(true);
