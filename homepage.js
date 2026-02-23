import { fetchVideos } from "./api.js";

const PAGE_SIZE = 20;

// Reverting to your original stable seed logic
const discoverSeed = sessionStorage.getItem("discoverSeed") ||
  (() => {
    const s = Math.random().toString(36).slice(2);
    sessionStorage.setItem("discoverSeed", s);
    return s;
  })();

let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";
let loading = false;

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

// Elements (Ensuring these match your HTML exactly)
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");
const backToTop = document.getElementById("backToTop");
const searchDesktop = document.getElementById("q-desktop");
const searchMobile = document.getElementById("q-mobile");
const clearDesktop = document.getElementById("clearSearchDesktop");
const clearMobile = document.getElementById("clearSearchMobile");

/* ---------- URL Sync (Original Working Logic) ---------- */
function syncFromURL() {
  const p = new URLSearchParams(location.search);
  activeSort = p.get("sort") || "relevance";
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
    if (btn.dataset.sort)
      btn.classList.toggle("active", btn.dataset.sort === activeSort);
    if (btn.dataset.length)
      btn.classList.toggle("active", btn.dataset.length === activeLength);
  });
}

/* ---------- Render (Original Working Logic) ---------- */
function render(videos) {
  const fragment = document.createDocumentFragment();
  videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "card fade-in";
    el.dataset.id = v.id;
    if (watched.has(v.id)) el.classList.add("watched");

    el.innerHTML = `
      <a href="/w/${v.id}" class="card-link">
        <img class="thumb" src="${v.thumbnail}" alt="${v.title}" loading="lazy">
        <div class="card-body">
          <div class="title">${v.title}</div>
          <div class="meta">${v.duration} • ${v.views} views</div>
        </div>
      </a>
    `;
    fragment.appendChild(el);
  });
  gallery.appendChild(fragment);
}

/* ---------- Load (Updated to handle GAS -1 signal) ---------- */
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

  try {
    const data = await fetchVideos({
      limit: PAGE_SIZE,
      offset,
      sort: activeSort,
      length: activeLength,
      q: currentQuery,
      discoverSeed: activeSort === "discover" ? discoverSeed : undefined
    });

    render(data.videos || []);

    // Reconciled Logic:
    // If nextOffset is -1, or we get an empty/short batch, stop pagination.
    if (data.nextOffset === -1 || !data.videos || data.videos.length < PAGE_SIZE) {
      offset = null; 
    } else {
      offset = data.nextOffset; 
    }
  } catch (err) {
    console.error("Fetch failed", err);
  }

  loader.style.display = "none";
  loading = false;
  if (!gallery.children.length && emptyState) emptyState.style.display = "block";
  
  // Only show button if there is a valid next page
  if (offset !== null) loadMoreBtn.style.display = "block";
}

/* ---------- Events (Original Working Logic) ---------- */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.sort) activeSort = btn.dataset.sort;
    if (btn.dataset.length) activeLength = activeLength === btn.dataset.length ? null : btn.dataset.length;
    syncToURL();
    updateActiveButtons();
    load(true);
  });
});

const handleSearch = (val) => {
  currentQuery = val.trim();
  syncToURL();
  load(true);
};

searchDesktop?.addEventListener("input", (e) => handleSearch(e.target.value));
searchMobile?.addEventListener("input", (e) => handleSearch(e.target.value));

loadMoreBtn.onclick = () => load();

/* ---------- Back to Top Logic (Restored) ---------- */
if (backToTop) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      backToTop.classList.add("visible");
      backToTop.style.display = "block";
    } else {
      backToTop.classList.remove("visible");
      backToTop.style.display = "none";
    }
  });

  backToTop.onclick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

syncFromURL();
load(true);
