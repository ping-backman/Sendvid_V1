const API_BASE = "https://api-cache.uilliam-maya.workers.dev";

export async function fetchVideos(params = {}) {
    const url = new URL(API_BASE);
    
    // Explicitly mapping for GAS compatibility
    const mapping = {
        discoverSeed: params.discoverSeed,
        limit: params.limit,
        offset: params.offset,
        sort: params.sort,
        q: params.q,
        id: params.id,
        length: params.length
    };

    Object.entries(mapping).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
            url.searchParams.set(k, v);
        }
    });

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("API Fetch failed");
    return res.json();
}
