// trending-session.js

const TRENDING_WINDOW_HOURS =
  12;

export function getTrendingBucket() {

  let tb =
    sessionStorage.getItem("tb");

  const currentTb =
    Math.floor(
      Date.now() /
      (
        1000 *
        60 *
        60 *
        TRENDING_WINDOW_HOURS
      )
    );

  /* ================= FIRST VISIT ================= */

  if (!tb) {

    sessionStorage.setItem(
      "tb",
      currentTb
    );

    return currentTb;
  }

  /* ================= ROTATION EXPIRED ================= */

  if (
    Number(tb) !== currentTb
  ) {

    sessionStorage.setItem(
      "tb",
      currentTb
    );

    return currentTb;
  }

  return Number(tb);
}
