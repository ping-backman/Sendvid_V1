// player.js

// 1. Added sandbox="allow-scripts allow-same-origin allow-presentation" to the iframe. 
//    This is the cleanest way to stop those DOMException errors while still letting the video play.

// 2. Updated allowfullscreen to the modern allow="... fullscreen ..." format to keep the console tidy.

Player: Updated allowfullscreen to the modern allow="... fullscreen ..." format to keep the console tidy.
export function loadPlayer(video, wrapper) {
  if (!wrapper || !video) return;

  // Preload thumbnail
  const imgPreload = new Image();
  imgPreload.src = video.thumbnail;

  /* ================= SOURCE ================= */

  const videoSrc = video.proxiedEmbed;

  if (!videoSrc || typeof videoSrc !== "string") {
    console.error("❌ Invalid proxiedEmbed", video);
    return;
  }

  console.log("✅ Final Video Source:", videoSrc);

  /* ================= PLAYER UI ================= */

  wrapper.innerHTML = `
    <div class="video-container" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
      
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

      <button class="play-btn">▶</button>

      <iframe
        class="video-frame"
        src="about:blank"
        /* Modern allow syntax for better compatibility */
        allow="autoplay; fullscreen; picture-in-picture"
        /* Sandbox prevents the proxy from accessing your top-level domain's storage */
        sandbox="allow-scripts allow-same-origin allow-presentation"
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

  const thumb = wrapper.querySelector(".video-thumb");
  const frame = wrapper.querySelector(".video-frame");
  const playBtn = wrapper.querySelector(".play-btn");

  const playVideo = () => {
    frame.src = videoSrc;
    frame.style.display = "block";
    frame.style.pointerEvents = "auto";

    thumb.style.display = "none";
    playBtn.style.display = "none";

    // Mark as watched if available
    if (video.id && typeof cards !== "undefined" && cards.markAsWatched) {
      cards.markAsWatched(video.id);
    }
  };

  thumb.addEventListener("click", playVideo);
  playBtn.addEventListener("click", playVideo);
}
