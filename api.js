const API_BASE =
  "https://api-cache.uilliam-maya.workers.dev";

export async function fetchVideos(params = {}) {
  const url = new URL(API_BASE);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  return res.json();
}
