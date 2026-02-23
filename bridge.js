import { fetchVideos } from "/api.js";

/** * Hybrid ID Detection
 * 1. Checks URL query params (?id=...)
 * 2. If empty, checks the URL path (/w/ID)
 */
const params = new URLSearchParams(location.search);
const videoId = params.get("id") || window.location.pathname.split('/').filter(Boolean).pop();

let timeLeft = 6;
const timerEl = document.getElementById("timer");
const statusTextEl = document.getElementById("statusText");
const watchBtn = document.getElementById("watchBtn");
const previewCard = document.getElementById("previewCard");

async function initBridge() {
    // Check if ID is "w" or empty (happens if path is just /w/)
    if (!videoId || videoId === 'w') {
        statusTextEl.textContent = "Error: No video ID detected.";
        console.error("Pathname: ", window.location.pathname);
        return;
    }

    // 1. Fetch Metadata for the Preview Card
    try {
        const data = await fetchVideos({ id: videoId });
        if (data?.video) {
            const v = data.video;
            document.getElementById("prevThumb").src = v.thumbnail;
            document.getElementById("prevTitle").textContent = v.title;
            document.getElementById("prevMeta").textContent = `${v.duration} • ${v.views} views`;
            previewCard.style.display = "block";
        } else {
            statusTextEl.textContent = "Video not found.";
        }
    } catch (e) {
        console.error("Metadata fetch failed", e);
    }

    // 2. Countdown Logic
    const countdown = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timerEl.textContent = timeLeft;
        } else {
            clearInterval(countdown);
            statusTextEl.innerHTML = "Ready to watch!";
            
            // Enable and stylize Watch Button
            watchBtn.textContent = "Continue to Video";
            watchBtn.classList.add("active");
            watchBtn.disabled = false;
            watchBtn.style.cursor = "pointer";
            
            // Final Redirect to the Clean Video URL
            watchBtn.onclick = () => {
                window.location.href = `/v/${videoId}`;
            };
        }
    }, 1000);
}

initBridge();
