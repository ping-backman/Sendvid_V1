import { fetchVideos } from "/api.js";

const params = new URLSearchParams(location.search);
const encodedId = params.get("id");
const videoId = encodedId ? atob(encodedId) : null;

let suggestedOffset = 0;
const PAGE_SIZE = 12;

async function loadSuggested(reset = false) {
    if (reset) { suggestedOffset = 0; document.getElementById("discoverGrid").innerHTML = ""; }
    
    const data = await fetchVideos({
        limit: PAGE_SIZE,
        offset: suggestedOffset,
        sort: "discover",
        discoverSeed: sessionStorage.getItem('discover_seed')
    });

    const videos = data.videos || [];
    const grid = document.getElementById("discoverGrid");
    
    videos.forEach(v => {
        if (v.id === videoId) return;
        const el = document.createElement("div");
        el.className = "card fade-in";
        el.innerHTML = `
            <a href="bridge.html?id=${btoa(v.id)}" class="card-link">
                <img class="thumb" src="${v.thumbnail}">
                <div class="card-body">
                    <div class="title">${v.title}</div>
                    <div class="meta">${v.duration}</div>
                </div>
            </a>`;
        grid.appendChild(el);
    });

    suggestedOffset = data.nextOffset;
    document.getElementById("loadMore").style.display = (suggestedOffset) ? "block" : "none";
}

document.getElementById("loadMore").onclick = () => loadSuggested();
loadSuggested(true);
// ... (rest of player init)
