const params = new URLSearchParams(location.search);
const id = params.get("id");

setTimeout(() => {
  location.href = `video.html?id=${id}`;
}, 2500);
