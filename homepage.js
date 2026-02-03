import { fetchVideos } from "/api.js";

/* --------------------
   State
-------------------- */
const limit = 20;
let offset = 0;

let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";

// Used ONLY for randomized modes
const seenIds = new Set();
let buffer = [];

// debounce
let searchTimer = null;

/* --------------------
   DOM
-------------------- */
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const searchInput = document.getElementById("q");
const loadMoreBtn = document.getElementById("loadMore");
const clearBtn = document.getElementById("clearSearch");

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
  }

  loader.classList.add("visible");
  loadMoreBtn.style.display = "none";

  const isRandomMode =
    activeSort === "discover" || activeLength !== null;

  // ------------------
  // NON-RANDOM MODES
  // ------------------
  if (!isRandomMode) {
    const data = await fetchVideos({
      limit,
      offset,
      sort: activeSort,
      q: currentQuery
    });

    render(data.videos);
    offset = data.nextOffset;

    loader.classList.remove("visible");

    if (offset < data.total) {
      loadMoreBtn.style.display = "block";
    }
    return;
  }

  // ------------------
  // RANDOMIZED MODES
  // ------------------
  while (buffer.length < limit) {
    const data = await fetchVideos({
      limit: 40,
      offset,
      sort: "discover",
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

  shuffle(buffer);
  render(buffer.splice(0, limit));

  loader.classList.remove("visible");
  loadMoreBtn.style.display = "block";
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
   Search (debounced)
-------------------- */
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  clearBtn.style.display = searchInput.value ? "block" : "none";

  searchTimer = setTimeout(() => {
    currentQuery = searchInput.value.trim();
    load(true);
  }, 400);
});

/* Clear search */
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentQuery = "";
  clearBtn.style.display = "none";
  load(true);
});

/* --------------------
   Load more
-------------------- */
loadMoreBtn.addEventListener("click", () => load());

/* --------------------
   Init
-------------------- */
load(true);
import { fetchVideos } from "/api.js";

/* --------------------
   State
-------------------- */
const limit = 20;
let offset = 0;

let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";

// Used ONLY for randomized modes
const seenIds = new Set();
let buffer = [];

// debounce
let searchTimer = null;

/* --------------------
   DOM
-------------------- */
const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const searchInput = document.getElementById("q");
const loadMoreBtn = document.getElementById("loadMore");
const clearBtn = document.getElementById("clearSearch");

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
  }

  loader.classList.add("visible");
  loadMoreBtn.style.display = "none";

  const isRandomMode =
    activeSort === "discover" || activeLength !== null;

  // ------------------
  // NON-RANDOM MODES
  // ------------------
  if (!isRandomMode) {
    const data = await fetchVideos({
      limit,
      offset,
      sort: activeSort,
      q: currentQuery
    });

    render(data.videos);
    offset = data.nextOffset;

    loader.classList.remove("visible");

    if (offset < data.total) {
      loadMoreBtn.style.display = "block";
    }
    return;
  }

  // ------------------
  // RANDOMIZED MODES
  // ------------------
  while (buffer.length < limit) {
    const data = await fetchVideos({
      limit: 40,
      offset,
      sort: "discover",
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

  shuffle(buffer);
  render(buffer.splice(0, limit));

  loader.classList.remove("visible");
  loadMoreBtn.style.display = "block";
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
   Search (debounced)
-------------------- */
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  clearBtn.style.display = searchInput.value ? "block" : "none";

  searchTimer = setTimeout(() => {
    currentQuery = searchInput.value.trim();
    load(true);
  }, 400);
});

/* Clear search */
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentQuery = "";
  clearBtn.style.display = "none";
  load(true);
});

/* --------------------
   Load more
-------------------- */
loadMoreBtn.addEventListener("click", () => load());

/* --------------------
   Init
-------------------- */
load(true);
