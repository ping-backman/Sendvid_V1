import { fetchVideos } from "/api.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");
let timeLeft = 6;

async function initBridge() {
    if (!id) { location.href = "index.html"; return; }

    const data = await fetchVideos({ id });
    if (data?.video) {
        const v = data.video;
        document.getElementById("prevThumb").src = v.thumbnail;
        document.getElementById("prevTitle").textContent = v.title;
        document.getElementById("prevMeta").textContent = `${v.duration} • ${v.views} views`;
        document.getElementById("previewCard").style.display = "block";
    }

    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            const btn = document.getElementById("watchBtn");
            btn.textContent = "WATCH VIDEO NOW";
            btn.classList.add("active");
            btn.onclick = () => { location.href = `video.html?id=${id}`; };
        }
    }, 1000);
}
initBridge();
