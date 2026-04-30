// bridge.js
import { fetchVideos } from "/api.js";

const statusTextEl = document.getElementById("statusText");
const countdownEl = document.getElementById("timer");

const previewCard = document.getElementById("previewCard");
const prevThumb = document.getElementById("prevThumb");
const prevTitle = document.getElementById("prevTitle");
const prevMeta = document.getElementById("prevMeta");

const watchBtn = document.getElementById("watchBtn");

/* ============================
   ✅ BULLETPROOF ID RESOLUTION
============================ */
const params = new URLSearchParams(window.location.search);
let videoId = params.get("id");

if (!videoId) {
  const parts = window.location.pathname.split("/").filter(Boolean);
  videoId = parts[parts.length - 1];
}

/* ============================ */

async function init() {
  try {

    if (!videoId) {
      if (statusTextEl) statusTextEl.textContent = "Invalid video.";
      return;
    }

    const data = await fetchVideos({ id: videoId });

    if (!data?.videos || data.videos.length === 0) {
      if (statusTextEl) statusTextEl.textContent = "Video unavailable.";
      return;
    }

    const v = data.videos[0];

    // Preview
    if (prevThumb) prevThumb.src = v.thumbnail;
    if (prevTitle) prevTitle.textContent = v.title;
    if (prevMeta) prevMeta.textContent = `${v.views} views`;

    if (previewCard) previewCard.style.display = "block";

    // Preload thumbnail
    const img = new Image();
    img.src = v.thumbnail;

    // Preconnect to video host
    try {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = new URL(v.embed).origin;
      document.head.appendChild(link);
    } catch (e) {}

    startCountdown(videoId);

  } catch (err) {
    console.error(err);
    if (statusTextEl) statusTextEl.textContent = "Error loading video.";
  }
}

function startCountdown(id) {

  let remaining = 5;

  if (countdownEl) countdownEl.textContent = remaining;

  const timer = setInterval(() => {

    remaining--;

    if (countdownEl) countdownEl.textContent = remaining;

    if (remaining <= 0) {

      clearInterval(timer);

      if (watchBtn) {
        watchBtn.classList.add("active");
        watchBtn.textContent = "Watch Now";
        watchBtn.onclick = () => redirect(id);
      }

      redirect(id);
    }

  }, 1000);
}

function redirect(id) {
  const token = Date.now();
  window.location.href = `/v/${id}?t=${token}`;
}

init();
