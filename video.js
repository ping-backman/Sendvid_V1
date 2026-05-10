// video.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
import { loadPlayer } from "/player.js";
import { initBackToTop } from "/ui-backtotop.js";

// --- Force zoom back to 100% on desktop only ---
const isDesktop =
  window.matchMedia("(min-width: 901px)").matches;

if (isDesktop) {

  document.body.style.zoom =
    1 / window.devicePixelRatio;

  document.body.style.transformOrigin =
    "top center";
}

const PAGE_SIZE = 20;
const UP_NEXT_COUNT = 4;

const params =
  new URLSearchParams(location.search);

const videoId =
  params.get("id") ||
  window.location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

/* =========================================================
   🧠 STAGE 1: AUTH GATE
========================================================= */

function runAuthGate() {

  /* ================= BRIDGE TOKEN ================= */

  const token =
    params.get("t");

  const tokenNum =
    Number(token);

  const age =
    Date.now() - tokenNum;

  const validToken =
    !!token &&
    Number.isFinite(tokenNum) &&
    age >= 0 &&
    age < 30000;

  /* ================= SHARED ACCESS ================= */

  const ref =
    params.get("ref");

  const shareAccess =
    ref === "share";

  /* ================= SESSION KEYS ================= */

  const sessionKey =
    `auth_${videoId}`;

  const sharedKey =
    `shared_${videoId}`;

  const isAuthorized =
    sessionStorage.getItem(sessionKey);

  const hasSharedAccess =
    sessionStorage.getItem(sharedKey);

  /* ================= ACCESS DECISION ================= */

  const needsRedirect =
    !isAuthorized &&
    !validToken &&
    !shareAccess &&
    !hasSharedAccess;

  if (needsRedirect) {

    window.location.replace(
      `/w/${videoId}`
    );

    return false;
  }

  /* ================= PERSIST ACCESS ================= */

  if (validToken) {

    sessionStorage.setItem(
      sessionKey,
      "true"
    );
  }

  if (shareAccess) {

    sessionStorage.setItem(
      sharedKey,
      "true"
    );
  }

  return true;
}

/* =========================================================
   🧠 STAGE 2: PLAYER PIPELINE
========================================================= */

async function bootPlayer() {

  try {

    if (!videoId) return;

    const data =
      await fetchVideos({
        id: videoId
      });

    if (!data?.videos?.length) {

      console.warn(
        "No video found"
      );

      return;
    }

    const v =
      data.videos[0];

    const titleEl =
      document.getElementById(
        "videoTitle"
      );

    const metaEl =
      document.getElementById(
        "videoMeta"
      );

    const wrapper =
      document.getElementById(
        "playerWrapper"
      );

    if (titleEl) {

      titleEl.textContent =
        v.title;
    }

    if (metaEl) {

      metaEl.textContent =
        `${v.duration} • ${v.views} views`;
    }

    if (wrapper) {

      loadPlayer(v, wrapper);
    }

    // Dynamic page title
    document.title =
      `${v.title} - Sendvid`;

  } catch (err) {

    console.error(
      "Player error:",
      err
    );
  }
}

/* =========================================================
   🧠 STAGE 2.5: SHARE SYSTEM
========================================================= */

function initShareButton() {

  const shareBtn =
    document.getElementById(
      "shareBtn"
    );

  const shareStatus =
    document.getElementById(
      "shareStatus"
    );

  if (!shareBtn || !videoId) {
    return;
  }

  shareBtn.onclick =
    async () => {

      const shareUrl =
        `${location.origin}/v/${videoId}?ref=share`;

      try {

        /* ================= MOBILE SHARE ================= */

        if (navigator.share) {

          await navigator.share({
            title: document.title,
            url: shareUrl
          });

          return;
        }

        /* ================= DESKTOP FALLBACK ================= */

        await navigator.clipboard.writeText(
          shareUrl
        );

        if (shareStatus) {

          shareStatus.textContent =
            "Link copied";
        }

        setTimeout(() => {

          if (shareStatus) {

            shareStatus.textContent = "";
          }

        }, 2000);

      } catch (err) {

        console.error(
          "Share failed:",
          err
        );

        if (shareStatus) {

          shareStatus.textContent =
            "Share failed";
        }

        setTimeout(() => {

          if (shareStatus) {

            shareStatus.textContent = "";
          }

        }, 2000);
      }
    };
}

/* =========================================================
   🧠 STAGE 3: DISCOVERY GRID
========================================================= */

function bootDiscovery() {

  let offset = 0;

  let loading = false;

  let activeSort =
    "discover";

  let currentQuery =
    "";

  /* ================= DOM ================= */

  const grid =
    document.getElementById(
      "discoverGrid"
    );

  const upNextGrid =
    document.getElementById(
      "upNextGrid"
    );

  const loader =
    document.getElementById(
      "loader"
    );

  const loadMoreBtn =
    document.getElementById(
      "loadMore"
    );

  const resultsHintDesktop =
    document.getElementById(
      "resultsHintDesktop"
    );

  const searchInputDesktop =
    document.getElementById(
      "q-desktop"
    );

  const clearSearchDesktop =
    document.getElementById(
      "clearSearchDesktop"
    );

  /* ================= SORT BUTTONS ================= */

  document
    .querySelectorAll("[data-sort]")
    .forEach(btn => {

      btn.onclick = () => {

        document
          .querySelectorAll("[data-sort]")
          .forEach(b =>
            b.classList.remove("active")
          );

        btn.classList.add("active");

        activeSort =
          btn.dataset.sort;

        currentQuery = "";

        if (searchInputDesktop) {

          searchInputDesktop.value =
            "";
        }

        if (clearSearchDesktop) {

          clearSearchDesktop.style.display =
            "none";
        }

        load(true);
      };
    });

  /* ================= FETCH ================= */

  async function fetchBatch(limit) {

    const data =
      await fetchVideos({

        limit,
        offset,
        sort: activeSort,
        q: currentQuery
      });

    if (
      !data?.videos ||
      data.videos.length < limit ||
      data.nextOffset === -1
    ) {

      offset = null;

    } else {

      offset =
        data.nextOffset;
    }

    return data.videos ?? [];
  }

  /* ================= LOAD ================= */

  async function load(reset = false) {

    if (loading) return;

    loading = true;

    try {

      if (reset) {

        if (grid) {

          grid.innerHTML = "";
        }

        if (upNextGrid) {

          upNextGrid.innerHTML = "";
        }

        offset = 0;
      }

      if (loader) {

        loader.style.display =
          "block";
      }

      if (loadMoreBtn) {

        loadMoreBtn.style.display =
          "none";
      }

      const batch =
        await fetchBatch(PAGE_SIZE);

      /* ================= UP NEXT ================= */

      if (reset && upNextGrid) {

        batch
          .slice(0, UP_NEXT_COUNT)
          .forEach(v =>

            upNextGrid.appendChild(

              createVideoCard(v, {
                compact: true
              })
            )
          );
      }

      /* ================= MAIN GRID ================= */

      const fragment =
        document.createDocumentFragment();

      batch.forEach(v =>

        fragment.appendChild(

          createVideoCard(v)
        )
      );

      if (grid) {

        grid.appendChild(fragment);
      }

      /* ================= RESULTS LABEL ================= */

      if (resultsHintDesktop) {

        const count =
          grid?.children?.length || 0;

        resultsHintDesktop.textContent =
          `Showing ${count} suggested`;
      }

    } catch (err) {

      console.error(
        "Discovery error:",
        err
      );
    }

    /* ================= CLEANUP ================= */

    if (loader) {

      loader.style.display =
        "none";
    }

    loading = false;

    if (loadMoreBtn) {

      loadMoreBtn.style.display =
        offset !== null
          ? "block"
          : "none";
    }
  }

  /* ================= SEARCH ================= */

  function bindSearch() {

    if (!searchInputDesktop) {
      return;
    }

    let debounceTimer;

    // Initial visibility
    if (clearSearchDesktop) {

      clearSearchDesktop.style.display =
        searchInputDesktop.value.trim()
          ? "block"
          : "none";
    }

    searchInputDesktop.oninput =
      (e) => {

        clearTimeout(
          debounceTimer
        );

        const value =
          e.target.value.trim();

        // Toggle clear button
        if (clearSearchDesktop) {

          clearSearchDesktop.style.display =
            value
              ? "block"
              : "none";
        }

        debounceTimer =
          setTimeout(() => {

            currentQuery =
              value;

            load(true);

          }, 500);
      };

    // Clear button
    if (clearSearchDesktop) {

      clearSearchDesktop.onclick =
        () => {

          currentQuery =
            "";

          searchInputDesktop.value =
            "";

          clearSearchDesktop.style.display =
            "none";

          load(true);
        };
    }
  }

  bindSearch();

  /* ================= INITIAL LOAD ================= */

  load(true);

  /* ================= LOAD MORE ================= */

  if (loadMoreBtn) {

    loadMoreBtn.onclick =
      () => load();
  }

  /* ================= BACK TO TOP ================= */

  initBackToTop(
    "backToTop"
  );
}

/* =========================================================
   🧠 BOOT SEQUENCE
========================================================= */

(async function bootstrap() {

  /* ================= AUTH ================= */

  const ok =
    runAuthGate();

  if (!ok) return;

  /* ================= CLEAN URL ================= */

  if (
    params.has("t") ||
    params.has("ref")
  ) {

    window.history.replaceState(

      {},
      document.title,
      window.location.pathname
    );
  }

  /* ================= PLAYER ================= */

  await bootPlayer();

  /* ================= SHARE ================= */

  initShareButton();

  /* ================= DISCOVERY ================= */

  bootDiscovery();

})();
