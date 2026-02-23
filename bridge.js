import { fetchVideos } from "/api.js";

const params = new URLSearchParams(location.search);
const videoId = params.get("id");

let timeLeft = 6; // Matches the 6s in your HTML
const timerEl = document.getElementById("timer");
const statusTextEl = document.getElementById("statusText");
const watchBtn = document.getElementById("watchBtn");
const previewCard = document.getElementById("previewCard");

async function initBridge() {
    if (!videoId) {
        statusTextEl.textContent = "Error: No video ID provided.";
        return;
    }

    // 1. Fetch preview metadata
    try {
        const data = await fetchVideos({ id: videoId });
        if (data?.video) {
            document.getElementById("prevThumb").src = data.video.thumbnail;
            document.getElementById("prevTitle").textContent = data.video.title;
            document.getElementById("prevMeta").textContent = `${data.video.duration} • ${data.video.views} views`;
            previewCard.style.display = "block";
        }
    } catch (e) {
        console.error("Failed to load preview data", e);
    }

    // 2. Handle Countdown
    const countdown = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timerEl.textContent = timeLeft;
        } else {
            clearInterval(countdown);
            statusTextEl.textContent = "Your video is ready!";
            
            // Enable Watch Button
            watchBtn.textContent = "Watch Video Now";
            watchBtn.classList.add("active");
            watchBtn.disabled = false;
            
            // Redirect to the actual video page when clicked
            watchBtn.onclick = () => {
                window.location.href = `/v/${videoId}`;
            };
        }
    }, 1000);
}

initBridge();
