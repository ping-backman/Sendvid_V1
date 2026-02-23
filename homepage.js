import { fetchVideos } from "/api.js";

// Utility to make URLs look "pro" and harder to edit
const encodeID = (id) => btoa(id);

/* ---------- STATE ---------- */
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

const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");

async function load(reset = false) {
    if (loading) return;
    loading = true;
    if (reset) { gallery.innerHTML = ""; offset = 0; }
    
    loader.style.display = "block";
    loadMoreBtn.style.display = "none";

    const params = {
        limit: PAGE_SIZE,
        offset: offset,
        sort: currentQuery ? "relevance" : activeSort,
        length: activeLength,
        q: currentQuery,
        discoverSeed: CURRENT_SEED
    };

    try {
        const data = await fetchVideos(params);
        const videos = data.videos || [];
        
        const fragment = document.createDocumentFragment();
        videos.forEach(v => {
            const el = document.createElement("div");
            el.className = "card fade-in";
            // Use encodeID to hide the raw Sendvid ID
            el.innerHTML = `
                <a href="/w/${encodeID(v.id)}" class="card-link">
                    <img class="thumb" src="${v.thumbnail}" loading="lazy">
                    <div class="card-body">
                        <div class="title">${v.title}</div>
                        <div class="meta">${v.duration} • ${v.views} views</div>
                    </div>
                </a>`;
            fragment.appendChild(el);
        });
        gallery.appendChild(fragment);

        offset = data.nextOffset;
        if (offset !== null && videos.length === PAGE_SIZE) loadMoreBtn.style.display = "block";
        
        // Update Results Hint
        const hint = `Showing ${gallery.children.length} videos`;
        document.getElementById("resultsHintDesktop").textContent = hint;
    } catch (e) { console.error(e); }
    finally { loader.style.display = "none"; loading = false; }
}

loadMoreBtn.onclick = () => load();
// ... (keep your existing search/filter listeners from previous working version)
load(true);
