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
   ID RESOLUTION
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
      statusTextEl.textContent = "Invalid video.";
      return;
    }

    const data = await fetchVideos({ id: videoId });

    if (!data?.videos || data.videos.length === 0) {
      statusTextEl.textContent = "Video unavailable.";
      return;
    }

    const v = data.videos[0];

    // Preview
    prevThumb.src = v.thumbnail;
    prevTitle.textContent = v.title;
    prevMeta.textContent = `${v.views} views`;

    previewCard.style.display = "block";

    // Preload thumbnail
    const img = new Image();
    img.src = v.thumbnail;

    // Preconnect + DNS prefetch
    try {
      const origin = new URL(v.embed).origin;

      const preconnect = document.createElement("link");
      preconnect.rel = "preconnect";
      preconnect.href = origin;

      const dns = document.createElement("link");
      dns.rel = "dns-prefetch";
      dns.href = origin;

      document.head.appendChild(preconnect);
      document.head.appendChild(dns);
    } catch (e) {}

    startCountdown(videoId);

  } catch (err) {
    console.error(err);
    statusTextEl.textContent = "Error loading video.";
  }
}

function startCountdown(id) {

  let remaining = 5;
  countdownEl.textContent = remaining;

  const timer = setInterval(() => {

    remaining--;
    countdownEl.textContent = remaining;

    // Pre-activation glow
    if (remaining === 2) {
      watchBtn.classList.add("pre-active");
    }

    if (remaining <= 0) {
      clearInterval(timer);

      watchBtn.classList.add("active");
      watchBtn.textContent = "▶ Watch Now";

      // Enable click ONLY (no auto redirect)
      watchBtn.onclick = () => redirect(id);

      if (statusTextEl) {
        statusTextEl.textContent = "Your video is ready";
      }
    }

  }, 1000);
}

function redirect(id) {
  const token = Date.now();
  window.location.href = `/v/${id}?t=${token}`;
}

init();
