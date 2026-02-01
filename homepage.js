import { fetchVideos } from "/api.js";

let offset = 0;
const limit = 20;

// active filter state
let activeSort = "relevance";
let activeLength = null;

const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const searchInput = document.getElementById("q");
const loadMoreBtn = document.getElementById("loadMore");

// main loader
async function load(reset = false) {
  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
  }

  loader.style.display = "block";

  const q = searchInput.value;

  const data = await fetchVideos({
    limit,
    offset,
    sort: activeSort,
    length: activeLength,
    q
  });

  data.videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <a href="bridge.html?id=${v.id}">
        <img class="thumb" src="${v.thumbnail}">
        <div style="padding:10px">
          <div class="title">${v.title}</div>
          <div class="meta">${v.duration} • ${v.views} views</div>
        </div>
      </a>
    `;
    gallery.appendChild(el);
  });

  offset = data.nextOffset;
  loader.style.display = "none";
}

// -------------------------
// FILTER BUTTONS
// -------------------------
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // visual active state
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // determine filter type
    if (btn.dataset.sort) {
      activeSort = btn.dataset.sort;
      activeLength = null;
    }

    if (btn.dataset.length) {
      activeLength = btn.dataset.length;
      activeSort = "relevance";
    }

    load(true);
  });
});

// -------------------------
// SEARCH (instant, no apply)
// -------------------------
let searchTimeout;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    load(true);
  }, 400);
});

// -------------------------
// LOAD MORE
// -------------------------
loadMoreBtn.addEventListener("click", () => load());

// initial load
load(true);
