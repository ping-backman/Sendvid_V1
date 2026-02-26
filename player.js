//player.js
const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

export function loadPlayer(video, wrapper) {
    if (!wrapper) return;

    const workerBase = "https://sendvid-proxy-tester.uilliam-maya.workers.dev/?url=";

    const videoSrc =
        video.proxiedEmbed ||
        (video.id
            ? workerBase + encodeURIComponent(`https://sendvid.com/embed/${video.id}`)
            : "");

    wrapper.innerHTML = `
        <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}">
        <button class="play-btn">▶</button>
        <iframe class="video-frame" src="about:blank" allow="autoplay; fullscreen" allowfullscreen></iframe>
    `;

    const thumb = wrapper.querySelector(".video-thumb");
    const frame = wrapper.querySelector(".video-frame");
    const playBtn = wrapper.querySelector(".play-btn");

    const playVideo = () => {
        if (!videoSrc) return;

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
