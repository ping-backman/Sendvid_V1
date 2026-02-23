import { fetchVideos } from "/api.js";

const params = new URLSearchParams(location.search);
const videoId = params.get("id");
let suggestedOffset = 0;

async function initPlayer() {
    const data = await fetchVideos({ id: videoId });
    if (data?.video) {
        const v = data.video;
        document.getElementById("videoTitle").textContent = v.title;
        document.getElementById("videoMeta").textContent = `${v.duration} • ${v.views} views`;
        
        const wrapper = document.getElementById("playerWrapper");
        wrapper.innerHTML = `
            <img src="${v.thumbnail}" class="video-thumb" id="poster">
            <button class="play-btn" id="play">▶</button>
            <iframe id="frame" src="about:blank" allow="autoplay; fullscreen" style="display:none; width:100%; height:100%; border:none;"></iframe>
        `;

        document.getElementById("play").onclick = () => {
            const frame = document.getElementById("frame");
            frame.src = v.proxiedEmbed;
            frame.style.display = "block";
            document.getElementById("poster").style.display = "none";
            document.getElementById("play").style.display = "none";
        };
    }
}

async function loadSuggested(reset = false) {
    if (reset) { suggestedOffset = 0; document.getElementById("discoverGrid").innerHTML = ""; }
    
    const data = await fetchVideos({
        limit: 20,
        offset: suggestedOffset,
        sort: "discover",
        discoverSeed: sessionStorage.getItem('discover_seed')
    });

    const videos = (data.videos || []).filter(v => v.id !== videoId);
    const grid = document.getElementById("discoverGrid");

    videos.forEach(v => {
        const el = document.createElement("div");
        el.className = "card fade-in";
        el.innerHTML = `
            <a href="/w/${v.id}" class="card-link">
                <img class="thumb" src="${v.thumbnail}">
                <div class="card-body">
                    <div class="title">${v.title}</div>
                    <div class="meta">${v.duration}</div>
                </div>
            </a>`;
        grid.appendChild(el);
    });

    suggestedOffset = data.nextOffset;
    document.getElementById("loadMore").style.display = suggestedOffset ? "block" : "none";
}

document.getElementById("loadMore").onclick = () => loadSuggested();
initPlayer();
loadSuggested(true);
