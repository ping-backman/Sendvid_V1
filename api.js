// api.js

import {
  getTrendingBucket
} from "/trending-session.js";

const API_BASE =
  "https://api-cache.uilliam-maya.workers.dev/";

export async function fetchVideos(
  params = {}
) {

  const url =
    new URL(API_BASE);

  /* ================= PARAMS ================= */

  Object.entries(params)
    .forEach(([key, value]) => {

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {

        url.searchParams.set(
          key,
          value
        );
      }
    });

  /* ================= STABLE TRENDING ================= */

  const sort =
    params.sort;

  const query =
    params.q;

  if (
    sort === "trending" &&
    !query
  ) {

    url.searchParams.set(
      "tb",
      getTrendingBucket()
    );
  }

  /* ================= FETCH ================= */

  const res =
    await fetch(
      url.toString()
    );

  if (!res.ok) {

    throw new Error(
      "API request failed"
    );
  }

  return res.json();
}
