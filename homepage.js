// homepage.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
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

let offset = 0;
let activeSort = "trending";
let activeDuration = "";
let currentQuery = "";
let loading = false;


// DOM Elements
const gallery =
  document.getElementById("gallery");

const loader =
  document.getElementById("loader");

const loadMoreBtn =
  document.getElementById("loadMore");

const emptyState =
  document.getElementById("emptyState");

// Search inputs
const searchInputDesktop =
  document.getElementById("q-desktop");

const searchInputMobile =
  document.getElementById("q-mobile");

// Clear buttons
const clearSearchDesktop =
  document.getElementById("clearSearchDesktop");

const clearSearchMobile =
  document.getElementById("clearSearchMobile");

// Results hints
const resultsHintDesktop =
  document.getElementById("resultsHintDesktop");

const resultsHintMobile =
  document.getElementById("resultsHintMobile");

/**
 * Map UI duration → GAS shorthand
 */
function mapDuration(value) {

  switch (value) {

    case "short":
      return "<10m";

    case "long":
      return "10-40m";

    case "longest":
      return "40m+";

    default:
      return "";
  }

}

/**
 * Fetches a batch of videos
 */
async function fetchBatch(limit) {

  try {

    const data = await fetchVideos({
      limit,
      offset,
      sort: activeSort,
      q: currentQuery,
      minDuration: activeDuration
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

  } catch (err) {

    console.error(
      "Fetch batch failed:",
      err
    );

    return [];

  }

}

/**
 * Loads videos into the gallery
 */
async function load(reset = false) {

  if (loading) return;

  loading = true;

  if (reset) {

    gallery.innerHTML = "";
    offset = 0;

    if (emptyState) {
      emptyState.style.display = "none";
    }

  }

  if (loader) {
    loader.style.display = "block";
  }

  if (loadMoreBtn) {
    loadMoreBtn.style.display = "none";
  }

  const batch =
    await fetchBatch(PAGE_SIZE);

  if (reset && batch.length === 0) {

    if (emptyState) {
      emptyState.style.display = "block";
    }

    if (resultsHintDesktop) {
      resultsHintDesktop.textContent =
        "No videos found";
    }

    if (resultsHintMobile) {
      resultsHintMobile.textContent =
        "0 videos";
    }

  } else {

    if (emptyState) {
      emptyState.style.display = "none";
    }

    const fragment =
      document.createDocumentFragment();

    batch.forEach(v => {

      fragment.appendChild(
        createVideoCard(v)
      );

    });

    gallery.appendChild(fragment);

    const count =
      gallery.children.length;

    if (resultsHintDesktop) {
      resultsHintDesktop.textContent =
        `Showing ${count} videos`;
    }

    if (resultsHintMobile) {
      resultsHintMobile.textContent =
        `Showing ${count}`;
    }

  }

  if (loader) {
    loader.style.display = "none";
  }

  loading = false;

  if (loadMoreBtn) {

    loadMoreBtn.style.display =
      (
        offset !== null &&
        batch.length > 0
      )
        ? "block"
        : "none";

  }

}

/**
 * ================= EVENT LISTENERS =================
 */

// SORT buttons
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

      // Reset search
      currentQuery = "";

      if (searchInputDesktop) {
        searchInputDesktop.value = "";
      }

      if (searchInputMobile) {
        searchInputMobile.value = "";
      }

      // Hide clear buttons
      if (clearSearchDesktop) {
        clearSearchDesktop.style.display = "none";
      }

      if (clearSearchMobile) {
        clearSearchMobile.style.display = "none";
      }

      load(true);

    };

  });

/**
 * DURATION FILTER
 */
document
  .querySelectorAll("[data-length]")
  .forEach(btn => {

    btn.onclick = () => {

      // Toggle behavior
      if (
        btn.classList.contains("active")
      ) {

        btn.classList.remove("active");
        activeDuration = "";

      } else {

        document
          .querySelectorAll("[data-length]")
          .forEach(b =>
            b.classList.remove("active")
          );

        btn.classList.add("active");

        activeDuration =
          mapDuration(btn.dataset.length);

      }

      load(true);

    };

  });

/**
 * SEARCH
 */
function bindSearch(input, clearBtn) {

  if (!input) return;

  let debounceTimer;

  // Initial visibility
  if (clearBtn) {

    clearBtn.style.display =
      input.value.trim()
        ? "block"
        : "none";

  }

  input.oninput = (e) => {

    clearTimeout(debounceTimer);

    const value =
      e.target.value.trim();

    // Toggle clear button
    if (clearBtn) {

      clearBtn.style.display =
        value
          ? "block"
          : "none";

    }

    debounceTimer = setTimeout(() => {

      currentQuery = value;

      // Sync BOTH inputs
      if (searchInputDesktop) {
        searchInputDesktop.value =
          currentQuery;
      }

      if (searchInputMobile) {
        searchInputMobile.value =
          currentQuery;
      }

      // Sync BOTH clear buttons
      const show =
        currentQuery
          ? "block"
          : "none";

      if (clearSearchDesktop) {
        clearSearchDesktop.style.display =
          show;
      }

      if (clearSearchMobile) {
        clearSearchMobile.style.display =
          show;
      }

      load(true);

    }, 500);

  };

  // CLEAR BUTTON
  if (clearBtn) {

    clearBtn.onclick = () => {

      currentQuery = "";

      if (searchInputDesktop) {
        searchInputDesktop.value = "";
      }

      if (searchInputMobile) {
        searchInputMobile.value = "";
      }

      if (clearSearchDesktop) {
        clearSearchDesktop.style.display =
          "none";
      }

      if (clearSearchMobile) {
        clearSearchMobile.style.display =
          "none";
      }

      load(true);

    };

  }

}

// Bind desktop
bindSearch(
  searchInputDesktop,
  clearSearchDesktop
);

// Bind mobile
bindSearch(
  searchInputMobile,
  clearSearchMobile
);

// LOAD MORE
if (loadMoreBtn) {

  loadMoreBtn.onclick = () => load();

}

// Back to top
initBackToTop("backToTop");

/* ================= WATCHED CROSS-TAB SYNC ================= */
window.addEventListener("storage", (event) => {
  if (event.key !== "watched") return;

  const updated = JSON.parse(event.newValue || "[]");

  document.querySelectorAll(".card").forEach(card => {
    const id = card.dataset.id;
    if (updated.includes(id)) {
      card.classList.add("watched");
    }
  });
});

// Initial load
load(true);
