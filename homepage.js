import { fetchVideos } from "/api.js";

const PAGE_SIZE = 20;
let offset = 0;
let activeSort = "relevance";
let activeLength = null;
let currentQuery = "";
let loading = false;

const CURRENT_SEED = (() => {
    let s = sessionStorage.getItem('discover_seed');
    if (!s) { s = Math.random().toString(36).substring(2, 8); sessionStorage.setItem('discover_seed', s); }
    return s;
})();

async function load(reset = false) {
    if (loading) return;
    loading = true;

    if (reset) {
        document.getElementById("gallery").innerHTML = "";
        offset = 0;
    }

    document.getElementById("loader").style.display = "block";
    document.getElementById("loadMore").style.display = "none";

    // Use currentQuery to force relevance as discussed
    const effectiveSort = currentQuery ? "relevance" : activeSort;

    try {
        const data = await fetchVideos({
            limit: PAGE_SIZE,
            offset: offset,
            sort: effectiveSort,
            length: activeLength,
            q: currentQuery,
            discoverSeed: CURRENT_SEED
        });

        const videos = data.videos || [];
        const gallery = document.getElementById("gallery");
        
        videos.forEach(v => {
            const el = document.createElement("div");
            el.className = "card fade-in";
            el.innerHTML = `
                <a href="/w/${v.id}" class="card-link">
                    <img class="thumb" src="${v.thumbnail}" loading="lazy">
                    <div class="card-body">
                        <div class="title">${v.title}</div>
                        <div class="meta">${v.duration} • ${v.views} views</div>
                    </div>
                </a>`;
            gallery.appendChild(el);
        });

        offset = data.nextOffset;
        if (offset && videos.length === PAGE_SIZE) {
            document.getElementById("loadMore").style.display = "block";
        }
        
        const hintText = `Showing ${gallery.children.length} videos`;
        document.getElementById("resultsHintDesktop").textContent = hintText;
        if(document.getElementById("resultsHintMobile")) {
            document.getElementById("resultsHintMobile").textContent = hintText;
        }

    } catch (e) { console.error(e); }
    finally {
        document.getElementById("loader").style.display = "none";
        loading = false;
    }
}

// Logic for Filters
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.dataset.sort) activeSort = btn.dataset.sort;
        if (btn.dataset.length) {
            activeLength = activeLength === btn.dataset.length ? null : btn.dataset.length;
        }
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        load(true);
    });
});

// Search Logic
const handleSearch = (val) => {
    currentQuery = val.trim();
    load(true);
};
document.getElementById("q-desktop").oninput = (e) => handleSearch(e.target.value);
document.getElementById("loadMore").onclick = () => load();

load(true);
