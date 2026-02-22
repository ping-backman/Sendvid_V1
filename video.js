import { fetchVideos } from "/api.js";

function getSessionSeed() {
    let seed = sessionStorage.getItem('discover_seed');
    if (!seed) {
        seed = Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('discover_seed', seed);
    }
    return seed;
}
const CURRENT_SEED = getSessionSeed();

const params = new URLSearchParams(location.search);
const videoId = params.get("id");

const playerWrapper = document.getElementById("playerWrapper");
const upNextGrid = document.getElementById("upNextGrid");
const discoverGrid = document.getElementById("discoverGrid");

/* --- PLAYER --- */
async function initPlayer() {
    const data = await fetchVideos({ id: videoId });
    if (data?.video) {
        const v = data.video;
        document.getElementById("videoTitle").textContent = v.title;
        
        playerWrapper.innerHTML = `
            <div class="video-container">
                <img src="${v.thumbnail}" class="video-thumb" id="poster">
                <button class="play-btn" id="play">▶</button>
                <iframe id="frame" src="about:blank" allow="autoplay; fullscreen" style="display:none; width:100%; height:100%; border:none;"></iframe>
            </div>
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

/* --- SUGGESTED FEEDS --- */
async function loadSuggested() {
    const data = await fetchVideos({
        limit: 24,
        sort: "discover",
        discoverSeed: CURRENT_SEED
    });

    const videos = (data.videos || []).filter(v => v.id !== videoId);

    // Sidebar (Up Next)
    videos.slice(0, 4).forEach(v => {
        upNextGrid.appendChild(createCard(v, true));
    });

    // Bottom Grid (Discover More)
    videos.slice(4).forEach(v => {
        discoverGrid.appendChild(createCard(v, false));
    });
}

function createCard(v, isSide) {
    const div = document.createElement("div");
    div.className = isSide ? "side-card" : "card";
    div.innerHTML = `
        <a href="bridge.html?id=${v.id}" class="card-link">
            <img class="thumb" src="${v.thumbnail}" alt="${v.title}">
            <div class="card-body">
                <div class="title">${v.title}</div>
                <div class="meta">${v.duration} • ${v.views}</div>
            </div>
        </a>
    `;
    return div;
}

// Init
initPlayer();
loadSuggested();
