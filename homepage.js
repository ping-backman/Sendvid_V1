import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;

let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";
let loading = false;

const seenIds = new Set();

const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");
const resultsHint = document.getElementById("resultsHint");
const searchInput = document.getElementById("q");
const clearBtn = document.getElementById("clearSearch");
const backToTop = document.getElementById("backToTop");

/* ---------- URL sync ---------- */
function syncFromURL() {
  const p = new URLSearchParams(location.search);
  activeSort = p.get("sort") || "relevance";
  activeLength = p.get("length");
  currentQuery = p.get("q") || "";

  searchInput.value = currentQuery;
  clearBtn.style.display = currentQuery ? "block" : "none";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.sort === activeSort || btn.dataset.length === activeLength
    );
  });
}

function syncToURL() {
  const p = new URLSearchParams();
  if (activeSort) p.set("sort", activeSort);
  if (activeLength) p.set("length", activeLength);
  if (currentQuery) p.set("q", currentQuery);
  history.replaceState({}, "", `?${p}`);
}

/* ---------- Helpers ---------- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ---------- Fetch unique videos ---------- */
async function fetchUniqueBatch(reset = false) {
  let collected = [];

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
      }
    }

    if (!data.nextOffset) break;
  }

  if (activeSort === "discover" || activeLength) {
    shuffle(collected);
  }

  return collected;
}

/* ---------- Render ---------- */
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

/* ---------- Load ---------- */
async function load(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
    seenIds.clear();
    resultsHint.textContent = "";
    window.scrollTo({ top: 0 });
  }

  loader.style.display = "block";
  loadMoreBtn.style.display = "none";
  emptyState.style.display = "none";

  const batch = await fetchUniqueBatch(reset);

  render(batch);

  loader.style.display = "none";
  loading = false;

  if (!gallery.children.length) {
    emptyState.style.display = "block";
  } else {
    resultsHint.textContent = `Showing ${gallery.children.length} videos`;
  }

  if (batch.length === PAGE_SIZE) {
    loadMoreBtn.style.display = "block";
  }
}

/* ---------- Filters ---------- */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
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

/* ---------- Search ---------- */
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

/* ---------- Load more ---------- */
loadMoreBtn.addEventListener("click", () => load());

/* ---------- Back to top ---------- */
window.addEventListener("scroll", () => {
  backToTop.classList.toggle("visible", window.scrollY > 500);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- Init ---------- */
syncFromURL();
load(true);
