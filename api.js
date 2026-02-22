const API_BASE = "https://api-cache.uilliam-maya.workers.dev";

export async function fetchVideos(params = {}) {
    const url = new URL(API_BASE);
    
    Object.entries(params).forEach(([k, v]) => {
        // We check for null/undefined but allow 0 (for offset)
        if (v !== undefined && v !== null && v !== "") {
            url.searchParams.set(k, v);
        }
    });

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("API Fetch failed");
    return res.json();
}
