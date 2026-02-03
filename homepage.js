import { fetchVideos } from "/api.js";

/* --------------------
   Config
-------------------- */
const PAGE_SIZE = 20;
const RANDOM_BATCH = 60;

/* --------------------
   State
-------------------- */
let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";

const seenIds = new Set();
let buffer = [];
let loading = false;

/* --------------------
   DOM
-------------------- */
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");
const resultsHint = document.getElementById("resultsHint");
const searchInput = document.getElementById("q");
const clearBtn = document.getElementById("clearSearch");
const backToTop = document.getElementById("backToTop");

/* --------------------
   URL State
-------------------- */
function syncFromURL() {
  const params = new URLSearchParams(location.search);
  activeSort = params.get("sort") || "relevance";
  activeLength = params.get("length");
  currentQuery = params.get("q") || "";

  searchInput.value = currentQuery;
  clearBtn.style.display = currentQuery ? "block" : "none";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle(
      "active",
      (btn.dataset.sort && btn.dataset.sort === activeSort) ||
      (btn.dataset.length && btn.dataset.length === activeLength)
    );
  });
}

function syncToURL() {
  const params = new URLSearchParams();
  if (activeSort) params.set("sort", activeSort);
  if (activeLength) params.set("length", activeLength);
  if (currentQuery) params.set("q", currentQuery);
  history.replaceState({}, "", `?${params.toString()}`);
}

/* --------------------
   Helpers
-------------------- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function render(videos) {
  videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "card fade-in";
    el.innerHTML = `
      <a href="bridge.html?id=${v.id}">
        <img class="thumb" src="${v.thumbnail}" alt="${v.title}">
        <div class="card-body">
          <div class="title">${v.title}</div>
          <div class="meta">${v.duration} • ${v.views} views</div>
        </div>
      </a>
    `;
    gallery.appendChild(el);
  });
}

/* --------------------
   Loader
-------------------- */
async function load(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
    buffer = [];
    seenIds.clear();
    resultsHint.textContent = "";
    window.scrollTo({ top: 0 });
  }

  emptyState.style.display = "none";
  loader.style.display = "block";
  loadMoreBtn.style.display = "none";

  const randomMode =
    activeSort === "discover" || activeLength !== null;

  while (buffer.length < PAGE_SIZE) {
    const data = await fetchVideos({
      limit: randomMode ? RANDOM_BATCH : PAGE_SIZE,
      offset,
      sort: activeSort,
      length: activeLength,
      q: currentQuery
    });

    offset = data.nextOffset;

    data.videos.forEach(v => {
      if (!seenIds.has(v.id)) {
        seenIds.add(v.id);
        buffer.push(v);
      }
    });

    if (!data.videos.length) break;
  }

  if (randomMode) shuffle(buffer);

  const batch = buffer.splice(0, PAGE_SIZE);
  render(batch);

  loader.style.display = "none";
  loading = false;

  if (!gallery.children.length) {
    emptyState.style.display = "block";
  } else {
    resultsHint.textContent = `Showing ${gallery.children.length} videos`;
  }

  if (buffer.length || offset) {
    loadMoreBtn.style.display = "block";
  }
}

/* --------------------
   Filters
-------------------- */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (btn.dataset.sort) {
      activeSort = btn.dataset.sort;
      activeLength = null;
    }

    if (btn.dataset.length) {
      activeLength = btn.dataset.length;
      activeSort = "discover";
    }

    syncToURL();
    load(true);
  });
});

/* --------------------
   Search (debounced)
-------------------- */
let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  clearBtn.style.display = searchInput.value ? "block" : "none";

  searchTimer = setTimeout(() => {
    currentQuery = searchInput.value.trim();
    syncToURL();
    load(true);
  }, 400);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentQuery = "";
  clearBtn.style.display = "none";
  syncToURL();
  load(true);
});

/* --------------------
   Load More
-------------------- */
loadMoreBtn.addEventListener("click", () => load());

/* --------------------
   Back to Top
-------------------- */
window.addEventListener("scroll", () => {
  backToTop.classList.toggle("visible", window.scrollY > 500);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* --------------------
   Init
-------------------- */
syncFromURL();
load(true);
