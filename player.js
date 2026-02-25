// player.js
const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

export function loadPlayer(video, wrapperId = "playerWrapper") {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const workerBase = "https://sendvid-proxy-tester.uilliam-maya.workers.dev/?url=";
    const videoSrc = video.proxiedEmbed || (video.id ? workerBase + encodeURIComponent(`https://sendvid.com/embed/${video.id}`) : "");

    wrapper.innerHTML = `
        <div class="video-container" style="position: relative; width: 100%; height: 100%;">
            <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; cursor: pointer; z-index: 2;">
            <button class="play-btn" style="z-index: 3;">▶</button>
            <iframe class="video-frame" src="about:blank" allow="autoplay; fullscreen" style="display: none; position: absolute; inset: 0; width: 100%; height: 100%; border: none; z-index: 1;" allowfullscreen></iframe>
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

        if (!watched.has(video.id)) {
            watched.add(video.id);
            localStorage.setItem("watched", JSON.stringify([...watched]));
        }
    };

    thumb.onclick = playBtn.onclick = playVideo;
}
