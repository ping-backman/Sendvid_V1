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

const videoId =
  params.get("id") ||
  window.location.pathname.split("/").filter(Boolean).pop();

/* =========================================================
   🧠 STAGE 1: AUTH GATE (NO RUNTIME CRASH EVER)
========================================================= */

function runAuthGate() {

  const token = params.get("t");
  const tokenNum = Number(token);
  const age = Date.now() - tokenNum;

  const validToken =
    !!token &&
    Number.isFinite(tokenNum) &&
    age >= 0 &&
    age < 30000;

  const sessionKey = `auth_${videoId}`;
  const isAuthorized = sessionStorage.getItem(sessionKey);

  const needsRedirect =
    !isAuthorized && !validToken;

  if (needsRedirect) {
    window.location.replace(`/w/${videoId}`);
    return false;
  }

  sessionStorage.setItem(sessionKey, "true");
  return true;
}

/* =========================================================
   🧠 STAGE 2: PLAYER PIPELINE (ISOLATED SAFE ZONE)
========================================================= */

async function bootPlayer() {
  try {

    if (!videoId) return;

    const data = await fetchVideos({ id: videoId });

    if (!data?.videos?.length) {
      console.warn("No video found");
      return;
    }

    const v = data.videos[0];

    const titleEl = document.getElementById("videoTitle");
    const metaEl = document.getElementById("videoMeta");
    const wrapper = document.getElementById("playerWrapper");

    if (titleEl) titleEl.textContent = v.title;
    if (metaEl) metaEl.textContent = `${v.duration} • ${v.views} views`;

    if (wrapper) {
      loadPlayer(v, wrapper);
    }

  } catch (err) {
    console.error("Player error:", err);
  }
}

/* =========================================================
   🧠 STAGE 3: DISCOVERY GRID (NON-CRITICAL UI)
========================================================= */

function bootDiscovery() {

  let offset = 0;
  let loading = false;
  let activeSort = "discover";

  const watched = new Set(
    JSON.parse(localStorage.getItem("watched") || "[]")
  );

  const grid = document.getElementById("discoverGrid");
  const upNextGrid = document.getElementById("upNextGrid");
  const loader = document.getElementById("loader");
  const loadMoreBtn = document.getElementById("loadMore");
  const resultsHintDesktop = document.getElementById("resultsHintDesktop");

  async function fetchBatch(limit) {
    const data = await fetchVideos({
      limit,
      offset,
      sort: activeSort
    });

    if (!data?.videos || data.videos.length < limit || data.nextOffset === -1) {
      offset = null;
    } else {
      offset = data.nextOffset;
    }

    return data.videos ?? [];
  }

  async function load(reset = false) {

    if (loading) return;
    loading = true;

    try {

      if (reset) {
        grid.innerHTML = "";
        upNextGrid.innerHTML = "";
        offset = 0;
      }

      if (loader) loader.style.display = "block";
      if (loadMoreBtn) loadMoreBtn.style.display = "none";

      const batch = await fetchBatch(PAGE_SIZE);

      if (reset && upNextGrid) {
        batch.slice(0, UP_NEXT_COUNT).forEach(v =>
          upNextGrid.appendChild(
            createVideoCard(v, { compact: true, watched })
          )
        );
      }

      const fragment = document.createDocumentFragment();

      batch.forEach(v =>
        fragment.appendChild(
          createVideoCard(v, { watched })
        )
      );

      if (grid) grid.appendChild(fragment);

      if (resultsHintDesktop) {
        resultsHintDesktop.textContent =
          `Showing ${grid?.children?.length || 0} suggested`;
      }

    } catch (err) {
      console.error("Discovery error:", err);
    }

    if (loader) loader.style.display = "none";
    loading = false;

    if (loadMoreBtn) {
      loadMoreBtn.style.display =
        offset !== null ? "block" : "none";
    }
  }

  load(true);

  if (loadMoreBtn) {
    loadMoreBtn.onclick = () => load();
  }

  initBackToTop("backToTop");
}

/* =========================================================
   🧠 BOOT SEQUENCE (SAFE ORDER)
========================================================= */

(async function bootstrap() {

  // STAGE 1 → AUTH
  const ok = runAuthGate();
  if (!ok) return;

  // STAGE 2 → PLAYER
  await bootPlayer();

  // STAGE 3 → DISCOVERY
  bootDiscovery();

})();
