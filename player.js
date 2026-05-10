// player.js

import { markAsWatched } from "/cards.js";

export function loadPlayer(video, wrapper) {

  if (!wrapper || !video) return;

  // Preload thumbnail
  const imgPreload = new Image();
  imgPreload.src = video.thumbnail;

  /* ================= SOURCE ================= */

  const videoSrc = video.proxiedEmbed;

  if (!videoSrc || typeof videoSrc !== "string") {

    console.error(
      "❌ Invalid proxiedEmbed",
      video
    );

    return;
  }

  console.log(
    "✅ Final Video Source:",
    videoSrc
  );

  /* ================= PLAYER UI ================= */

  wrapper.innerHTML = `
    <div
      class="video-container"
      style="
        position: relative;
        width: 100%;
        height: 100%;
      "
    >

      <img
        src="${video.thumbnail}"
        class="video-thumb"
        alt="${video.title}"
        style="
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          cursor: pointer;
          z-index: 2;
        "
      >

      <button class="play-btn">
        ▶
      </button>

      <iframe
        class="video-frame"
        src="about:blank"
        allow="autoplay; fullscreen; picture-in-picture"
        style="
          display: none;
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          z-index: 1;
          pointer-events: none;
        "
      ></iframe>

    </div>
  `;

  const thumb =
    wrapper.querySelector(".video-thumb");

  const frame =
    wrapper.querySelector(".video-frame");

  const playBtn =
    wrapper.querySelector(".play-btn");

  let retryCount = 0;

  let loadTimeout = null;

  let started = false;

  /* ================= RETRY (CACHE-BUST) ================= */

  const reloadFrame = () => {

    if (retryCount >= 2) return;

    retryCount++;

    console.warn(
      "⚠️ Reloading video (expired link)"
    );

    const bustedSrc =
      videoSrc +
      (videoSrc.includes("?") ? "&" : "?") +
      "r=" +
      Date.now();

    frame.src = "about:blank";

    setTimeout(() => {

      frame.src = bustedSrc;

    }, 300);
  };

  /* ================= PLAY ================= */

  const playVideo = () => {

    // Prevent duplicate starts
    if (started) return;

    started = true;

    frame.src = videoSrc;

    frame.style.display =
      "block";

    frame.style.pointerEvents =
      "auto";

    thumb.style.display =
      "none";

    playBtn.style.display =
      "none";

    /* ================= WATCHED ================= */

    if (video.id) {

      markAsWatched(video.id);
    }

    /* ================= FAILURE DETECTION ================= */

    if (loadTimeout) {

      clearTimeout(loadTimeout);
    }

    // If iframe doesn't properly load in time,
    // assume expired link

    loadTimeout = setTimeout(() => {

      reloadFrame();

    }, 3000);
  };

  thumb.addEventListener(
    "click",
    playVideo
  );

  playBtn.addEventListener(
    "click",
    playVideo
  );
}
