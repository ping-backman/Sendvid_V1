import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;

let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";
let loading = false;

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

/* ---------- SESSION SEED FOR DISCOVER ---------- */
const discoverSeed = sessionStorage.getItem("discoverSeed") ||
  (() => {
    const s = Math.random().toString(36).slice(2);
    sessionStorage.setItem("discoverSeed", s);
    return s;
  })();

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
    if (btn.dataset.sort)
      btn.classList.toggle("active", btn.dataset.sort === activeSort);
    if (btn.dataset.length)
      btn.classList.toggle("active", btn.dataset.length === activeLength);
  });
}

/* ---------- Fetch ---------- */
async function fetchUniqueBatch() {
  const data = await fetchVideos({
    limit: PAGE_SIZE,
    offset,
    sort: activeSort,
    length: activeLength,
    q: currentQuery,
    discoverSeed: activeSort === "discover" ? discoverSeed : undefined
  });

  offset = data.nextOffset != null ? data.nextOffset : null;
  return data.videos;
}

/* ---------- Render ---------- */
function updateResultsHint() {
  const text = `Showing ${gallery.children.length} videos`;
  resultsHintDesktop.textContent = text;
  resultsHintMobile.textContent = text;
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

  gallery.appendChild(fragment);
  updateResultsHint();
}

/* ---------- Event Delegation (Mobile Drag Fix + Watched) ---------- */

let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;

gallery.addEventListener("touchstart", e => {
  const card = e.target.closest(".card");
  if (!card) return;

  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  isDragging = false;
}, { passive: true });

gallery.addEventListener("touchmove", e => {
  const touch = e.touches[0];
  const dx = Math.abs(touch.clientX - touchStartX);
  const dy = Math.abs(touch.clientY - touchStartY);
  if (dx > 10 || dy > 10) isDragging = true;
}, { passive: true });

gallery.addEventListener("click", e => {
  const link = e.target.closest(".card-link");
  if (!link) return;

  const card = link.closest(".card");
  if (!card) return;

  if (isDragging) {
    e.preventDefault();
    return;
  }

  const id = card.dataset.id;
  watched.add(id);
  localStorage.setItem("watched", JSON.stringify([...watched]));
  card.classList.add("watched");
});

/* ---------- Load ---------- */
async function load(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
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

loadMoreBtn.addEventListener("click", () => load());

window.addEventListener("scroll", () => {
  backToTop.classList.toggle("visible", window.scrollY > 500);
  if (desktopControls)
    desktopControls.classList.toggle("compact", window.scrollY > 40);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

syncFromURL();
load(true);
