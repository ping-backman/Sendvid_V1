// player.js

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

export function loadPlayer(video, wrapper) {
  if (!wrapper || !video) return;

  // Determine correct proxy source (same logic as old script)
  const workerBase = "https://sendvid-proxy-tester.uilliam-maya.workers.dev/?url=";
  const videoSrc =
    video.proxiedEmbed ||
    (video.embed
      ? workerBase + encodeURIComponent(video.embed)
      : "");

  console.log("Initializing Player with Source:", videoSrc);

  if (!videoSrc) {
    console.error("No source found");
    return;
  }

  // Inject identical structure to old working version
  wrapper.innerHTML = `
    <div class="video-container" style="position: relative; width: 100%; height: 100%;">
      <img
        src="${video.thumbnail}"
        class="video-thumb"
        alt="${video.title}"
        style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; cursor: pointer; z-index: 2;"
      >
      <button
        class="play-btn"
        style="position: absolute; inset: 0; margin: auto; z-index: 3;"
      >▶</button>
      <iframe
        class="video-frame"
        src="about:blank"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        style="display: none; position: absolute; inset: 0; width: 100%; height: 100%; border: none; z-index: 1;"
      ></iframe>
    </div>
  `;

  const thumb = wrapper.querySelector(".video-thumb");
  const frame = wrapper.querySelector(".video-frame");
  const playBtn = wrapper.querySelector(".play-btn");

  const playVideo = () => {
    frame.src = videoSrc;
    frame.style.display = "block";
    thumb.style.display = "none";
    playBtn.style.display = "none";

    if (video.id && !watched.has(video.id)) {
      watched.add(video.id);
      localStorage.setItem("watched", JSON.stringify(Array.from(watched)));
    }
  };

  thumb.addEventListener("click", playVideo);
  playBtn.addEventListener("click", playVideo);
}
