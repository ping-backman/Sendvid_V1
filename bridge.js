import { fetchVideos } from "/api.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");
const timerEl = document.getElementById("timer");
const watchBtn = document.getElementById("watchBtn");
const statusText = document.getElementById("statusText");

let timeLeft = 6;

async function initBridge() {
    if (!id) {
        location.href = "index.html";
        return;
    }

    // 1. Fetch video data to show the preview
    try {
        const data = await fetchVideos({ id });
        if (data?.video) {
            const v = data.video;
            document.getElementById("prevThumb").src = v.thumbnail;
            document.getElementById("prevTitle").textContent = v.title;
            document.getElementById("prevMeta").textContent = `${v.duration} • ${v.views} views`;
            document.getElementById("previewCard").style.display = "block";
        }
    } catch (e) {
        console.error("Preview load failed", e);
    }

    // 2. Start Countdown
    const countdown = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            enableButton();
        }
    }, 1000);
}

function enableButton() {
    statusText.innerHTML = "Your video is ready!";
    watchBtn.textContent = "WATCH VIDEO NOW";
    watchBtn.classList.add("active");
    
    watchBtn.onclick = () => {
        // This click will trigger the Adsterra Pop-under automatically
        location.href = `video.html?id=${id}`;
    };
}

initBridge();
