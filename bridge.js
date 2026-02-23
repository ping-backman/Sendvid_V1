import { fetchVideos } from "/api.js";

const params = new URLSearchParams(location.search);
const encodedId = params.get("id");
// Decode the pro URL back to the real ID
const id = encodedId ? atob(encodedId) : null;

async function initBridge() {
    if (!id) { location.href = "index.html"; return; }

    const data = await fetchVideos({ id });
    if (data?.video) {
        const v = data.video;
        document.getElementById("prevThumb").src = v.thumbnail;
        document.getElementById("prevTitle").textContent = v.title;
        // ... (rest of your bridge timer logic)
        
        // When timer ends, send to video page with same encoded ID
        document.getElementById("watchBtn").onclick = () => {
            location.href = `video.html?id=${encodedId}`;
        };
    }
}
initBridge();
