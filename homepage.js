import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;

let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";
let loading = false;

const seenIds = new Set();
const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

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

  clearDesktop.style.display = currentQuery ? "block" : "none";
  clearMobile.style.display = currentQuery ? "block" : "none";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.sort === activeSort ||
      btn.dataset.length === activeLength
    );
  });
}

function syncToURL() {
  const p = new URLSearchParams();
  p.set("sort", activeSort);
  if (activeLength) p.set("length", activeLength);
  if (currentQuery) p.set("q", currentQuery);
  history.replaceState({}, "", `?${p.toString()}`);
}

/* ---------- Shuffle ---------- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ---------- Fetch unique ---------- */
async function fetchUniqueBatch() {
  const collected = [];

  while (collected.length < PAGE_SIZE) {
    const data = await fetchVideos({
      limit: PAGE_SIZE,
      offset,
      sort: activeSort,
      length: activeLength,
      q: currentQuery
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

  if (activeSort === "discover") shuffle(collected);
  return collected;
}

/* ---------- Render ---------- */
function updateResultsHint() {
  const text = `Showing ${gallery.children.length} videos`;
  resultsHintDesktop.textContent = text;
  resultsHintMobile.textContent = text;
}

function render(videos) {
  videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "card fade-in";
    if (watched.has(v.id)) el.classList.add("watched");

    el.innerHTML = `
      <a href="bridge.html?id=${v.id}">
        <img class="thumb" src="${v.thumbnail}" alt="${v.title}">
        <div class="card-body">
          <div class="title">${v.title}</div>
          <div class="meta">${v.duration} • ${v.views} views</div>
        </div>
      </a>
    `;

    const link = el.querySelector("a");

    // ----- Touch / scroll protection -----
    el._isDragging = false;

    el.addEventListener("touchstart", e => {
      el._startX = e.touches[0].clientX;
      el._startY = e.touches[0].clientY;
      el._isDragging = false;
    }, { passive: true });

    el.addEventListener("touchmove", e => {
      const dx = Math.abs(e.touches[0].clientX - el._startX);
      const dy = Math.abs(e.touches[0].clientY - el._startY);
      if (dx > 10 || dy > 10) el._isDragging = true;
    }, { passive: true });

    link.addEventListener("click", e => {
      if (el._isDragging) {
        e.preventDefault();
        return;
      }
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
  emptyState.style.display = "none";

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
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (btn.dataset.sort) {
      activeSort = btn.dataset.sort;
    }

    if (btn.dataset.length) {
      activeLength = btn.dataset.length;
    }

    syncToURL();
    load(true);
  });
});

/* ---------- Search ---------- */
let searchTimer;
function handleSearch(val) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentQuery = val.trim();
    syncToURL();
    load(true);
  }, 400);
}

searchDesktop.addEventListener("input", e => {
  clearDesktop.style.display = e.target.value ? "block" : "none";
  searchMobile.value = e.target.value;
  handleSearch(e.target.value);
});

searchMobile.addEventListener("input", e => {
  clearMobile.style.display = e.target.value ? "block" : "none";
  searchDesktop.value = e.target.value;
  handleSearch(e.target.value);
});

clearDesktop.addEventListener("click", () => {
  searchDesktop.value = "";
  searchMobile.value = "";
  clearDesktop.style.display = "none";
  clearMobile.style.display = "none";
  currentQuery = "";
  syncToURL();
  load(true);
});

clearMobile.addEventListener("click", () => clearDesktop.click());

/* ---------- Load more ---------- */
loadMoreBtn.addEventListener("click", () => load());

/* ---------- Back to top ---------- */
window.addEventListener("scroll", () => {
  backToTop.classList.toggle("visible", window.scrollY > 500);
  if (desktopControls) desktopControls.classList.toggle("compact", window.scrollY > 40);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- Init ---------- */
syncFromURL();
load(true);
