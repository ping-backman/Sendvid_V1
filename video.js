// video.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
import { loadPlayer } from "/player.js";
import { initBackToTop } from "/ui-backtotop.js";

// --- Force zoom back to 100% ---
document.body.style.zoom = 1 / window.devicePixelRatio;
document.body.style.transformOrigin = "top center";

const PAGE_SIZE = 20;
const UP_NEXT_COUNT = 4;

const params = new URLSearchParams(location.search);

// Handles both:
// /video/abc123
// /video/abc123/
const videoId =
  params.get("id") ||
  window.location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

/* ================= BRIDGE TOKEN PROTECTION ================= */

const token = params.get("t");

const sessionKey = `auth_${videoId}`;

const isAuthorized =
  sessionStorage.getItem(sessionKey);

// Safely convert token to number
const tokenNum = Number(token);

// Prevent:
// - empty token bypass
// - NaN bypass
// - negative timestamps
// - future timestamps
// - expired timestamps
const age = Date.now() - tokenNum;

const validToken =
  !!token &&
  !isNaN(tokenNum) &&
  age >= 0 &&
  age < 30000;

if (!isAuthorized) {

  // Invalid or expired token → back to bridge
  if (!validToken) {
    window.location.href = `/w/${videoId}`;
    return;
  }

  // Valid token → authorize this tab session
  sessionStorage.setItem(sessionKey, "true");
}

// Clean URL after successful validation
if (params.has("t")) {

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
}

/* =========================================================== */

let offset = 0;
let loading = false;
let activeSort = "discover";

const watched = new Set(
  JSON.parse(localStorage.getItem("watched") || "[]")
);

const grid =
  document.getElementById("discoverGrid");

const upNextGrid =
  document.getElementById("upNextGrid");

const loader =
  document.getElementById("loader");

const loadMoreBtn =
  document.getElementById("loadMore");

const resultsHintDesktop =
  document.getElementById("resultsHintDesktop");

async function loadVideo() {

  if (!videoId) return;

  const data = await fetchVideos({
    id: videoId
  });

  if (
    !data?.videos ||
    data.videos.length === 0
  ) {
    return;
  }

  const v = data.videos[0];

  document.getElementById("videoTitle")
    .textContent = v.title;

  document.getElementById("videoMeta")
    .textContent =
      `${v.duration} • ${v.views} views`;

  loadPlayer(
    v,
    document.getElementById("playerWrapper"),
    watched
  );
}

async function fetchBatch(limit) {

  const data = await fetchVideos({
    limit,
    offset,
    sort: activeSort
  });

  if (
    !data.videos ||
    data.videos.length < limit ||
    data.nextOffset === -1
  ) {

    offset = null;

  } else {

    offset = data.nextOffset;
  }

  return data.videos ?? [];
}

async function load(reset = false) {

  if (loading) return;

  loading = true;

  if (reset) {

    grid.innerHTML = "";
    upNextGrid.innerHTML = "";
    offset = 0;
  }

  loader.style.display = "block";
  loadMoreBtn.style.display = "none";

  const batch =
    await fetchBatch(PAGE_SIZE);

  if (reset) {

    batch
      .slice(0, UP_NEXT_COUNT)
      .forEach(v =>

        upNextGrid.appendChild(
          createVideoCard(v, {
            compact: true,
            watched
          })
        )
      );
  }

  const fragment =
    document.createDocumentFragment();

  batch.forEach(v =>

    fragment.appendChild(
      createVideoCard(v, {
        watched
      })
    )
  );

  grid.appendChild(fragment);

  if (resultsHintDesktop) {

    resultsHintDesktop.textContent =
      `Showing ${grid.children.length} suggested`;
  }

  loader.style.display = "none";

  loading = false;

  loadMoreBtn.style.display =
    offset !== null
      ? "block"
      : "none";
}

loadVideo();

load(true);

loadMoreBtn.onclick = () => load();

initBackToTop("backToTop");
