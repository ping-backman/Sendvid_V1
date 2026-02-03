import { fetchVideos } from "/api.js";

/* --------------------
   State
-------------------- */
const limit = 20;
let offset = 0;

let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";

const seenIds = new Set();
let buffer = [];

let searchTimer = null;

/* --------------------
   DOM
-------------------- */
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const searchInput = document.getElementById("q");
const loadMoreBtn = document.getElementById("loadMore");
const clearBtn = document.getElementById("clearSearch");
const emptyState = document.getElementById("emptyState");
const resultsHint = document.getElementById("resultsHint");

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
   Core Loader
-------------------- */
async function load(reset = false) {
  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
    buffer = [];
    seenIds.clear();
    resultsHint.textContent = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  emptyState.style.display = "none";
  loader.style.display = "block";
  loadMoreBtn.style.display = "none";

  const shouldRandomize =
    activeSort === "discover" || activeLength !== null;

  while (buffer.length < limit) {
    const data = await fetchVideos({
      limit: shouldRandomize ? 40 : limit,
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

  if (shouldRandomize) shuffle(buffer);

  const batch = buffer.splice(0, limit);
  render(batch);

  loader.style.display = "none";

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

    load(true);
  });
});

/* --------------------
   Search
-------------------- */
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  clearBtn.style.display = searchInput.value ? "block" : "none";

  searchTimer = setTimeout(() => {
    currentQuery = searchInput.value.trim();
    load(true);
  }, 400);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentQuery = "";
  clearBtn.style.display = "none";
  load(true);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") clearBtn.click();
  if (e.key === "Enter" && document.activeElement === searchInput) {
    load(true);
  }
});

/* --------------------
   Load More
-------------------- */
loadMoreBtn.addEventListener("click", () => load());

/* --------------------
   Init
-------------------- */
load(true);
