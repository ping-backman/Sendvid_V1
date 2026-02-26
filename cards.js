// cards.js
const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

export function createVideoCard(video, options = {}) {
    const el = document.createElement("div");
    el.className = `card ${options.compact ? "side-card" : "fade-in"}`;
    el.dataset.id = video.id;
    if (watched.has(video.id)) el.classList.add("watched");

    el.innerHTML = `
        <a href="/w/${video.id}" class="card-link ${options.compact ? "side-card-link" : ""}">
            <img class="thumb" src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            <div class="card-body">
                <div class="title">${video.title}</div>
                <div class="meta">${video.duration} • ${video.views} views</div>
            </div>
        </a>
    `;

    el.addEventListener("click", e => {
        const link = e.target.closest(".card-link");
        if (!link) return;
        watched.add(video.id);
        localStorage.setItem("watched", JSON.stringify([...watched]));
        el.classList.add("watched");
    });

    return el;
}
