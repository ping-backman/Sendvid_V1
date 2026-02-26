// player.js

// Assuming cards.js exposes this function:
// import { markAsWatched } from './cards.js';

export function loadPlayer(video, wrapper) {
  if (!wrapper || !video) return;

  // Preload thumbnail for faster display on slow connections
  const imgPreload = new Image();
  imgPreload.src = video.thumbnail;

  // Determine correct proxy source
  const workerBase = "https://sendvid-proxy-tester.uilliam-maya.workers.dev/?url=";
  const videoSrc =
    video.proxiedEmbed ||
    (video.embed ? workerBase + encodeURIComponent(video.embed) : "");

  console.log("Initializing Player with Source:", videoSrc);

  if (!videoSrc) {
    console.error("No source found");
    return;
  }

  // Inject HTML structure
  wrapper.innerHTML = `
    <div class="video-container" style="position: relative; width: 100%; height: 100%;">
      <img
        src="${video.thumbnail}"
        class="video-thumb"
        alt="${video.title}"
        style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; cursor: pointer; z-index: 2;"
      >
      <button class="play-btn">▶</button>
      <iframe
        class="video-frame"
        src="about:blank"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        style="display: none; position: absolute; inset: 0; width: 100%; height: 100%; border: none; z-index: 1; pointer-events: none;"
      ></iframe>
    </div>
  `;

  const thumb = wrapper.querySelector(".video-thumb");
  const frame = wrapper.querySelector(".video-frame");
  const playBtn = wrapper.querySelector(".play-btn");

  const playVideo = () => {
    frame.src = videoSrc;
    frame.style.display = "block";
    frame.style.pointerEvents = "auto"; // enable clicks after play
    thumb.style.display = "none";
    playBtn.style.display = "none";

    // Notify cards.js that this video has started playing
    if (video.id && typeof cards !== "undefined" && cards.markAsWatched) {
      cards.markAsWatched(video.id);
    }
  };

  thumb.addEventListener("click", playVideo);
  playBtn.addEventListener("click", playVideo);
}
