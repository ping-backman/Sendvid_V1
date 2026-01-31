import { fetchVideos } from "/api.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");

const player = document.getElementById("player");
const similar = document.getElementById("similar");

async function init() {
  const data = await fetchVideos({ id });

  if (!data.video) return;

  player.innerHTML = `
    <iframe
      src="${data.video.embed}"
      width="100%"
      height="480"
      frameborder="0"
      allowfullscreen>
    </iframe>
  `;

  const related = await fetchVideos({
    sort: "discover",
    limit: 8
  });

  related.videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <a href="bridge.html?id=${v.id}">
        <img class="thumb" src="${v.thumbnail}">
        <div style="padding:10px">
          <div class="title">${v.title}</div>
        </div>
      </a>
    `;
    similar.appendChild(el);
  });
}

init();
