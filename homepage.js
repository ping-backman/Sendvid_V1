import { fetchVideos } from "/api.js";

let offset = 0;
const limit = 20;

const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");

async function load(reset = false) {
  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
  }

  loader.style.display = "block";

  const sort = document.getElementById("sort").value;
  const q = document.getElementById("q").value;

  const data = await fetchVideos({
    limit,
    offset,
    sort,
    q
  });

  data.videos.forEach(v => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <a href="bridge.html?id=${v.id}">
        <img class="thumb" src="${v.thumbnail}">
        <div style="padding:10px">
          <div class="title">${v.title}</div>
          <div class="meta">${v.duration} • ${v.views} views</div>
        </div>
      </a>
    `;
    gallery.appendChild(el);
  });

  offset = data.nextOffset;
  loader.style.display = "none";
}

document.getElementById("apply").onclick = () => load(true);
document.getElementById("loadMore").onclick = () => load();

load(true);
