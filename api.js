//api.js
const API_BASE = "https://api-cache.uilliam-maya.workers.dev";

export async function fetchVideos(params = {}) {
  const url = new URL(API_BASE);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error("API request failed");
  }

  return res.json();
}
