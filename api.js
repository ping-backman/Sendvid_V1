const API_BASE =
  "https://script.google.com/macros/s/AKfycbwCal_zKjLjgOqZWyTEMVRp1Pv68axT4f5s6ahuKUMGcpOdSmDP2oo0Q5Pydgq4NcR9/exec";

export async function fetchVideos(params = {}) {
  const url = new URL(API_BASE);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  return res.json();
}
