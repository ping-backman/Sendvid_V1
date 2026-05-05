// player.js

export function loadPlayer(video, wrapper) {
  if (!wrapper || !video) return;

  const imgPreload = new Image();
  imgPreload.src = video.thumbnail;

  const videoSrc = video.proxiedEmbed;
  if (!videoSrc || typeof videoSrc !== "string") return;

  wrapper.innerHTML = `
    <div class="video-container" style="position: relative; width: 100%; height: 100%; overflow: hidden; background: #000;">
      <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}" 
        style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; cursor: pointer; z-index: 2;">
      <button class="play-btn" style="z-index: 3;">▶</button>

      <iframe
        class="video-frame"
        src="about:blank"
        /* Added allow-forms and removed extra spaces in sandbox */
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        allow="autoplay; fullscreen; picture-in-picture"
        style="display: none; position: absolute; inset: 0; width: 100%; height: 100%; border: none; z-index: 1;"
      ></iframe>
    </div>
  `;

  const thumb = wrapper.querySelector(".video-thumb");
  const frame = wrapper.querySelector(".video-frame");
  const playBtn = wrapper.querySelector(".play-btn");

  const playVideo = () => {
    // Adding autoplay parameters to the URL helps the native player 
    // catch the user gesture from the thumbnail click.
    const autoPlayUrl = videoSrc. cards !== "undefined" && cards.markAsWatched) {
      cards.markAsWatched(video.id);
    }
  };

  thumb.addEventListener("click", playVideo);
  playBtn.addEventListener("click", playVideo);
}
