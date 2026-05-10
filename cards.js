// cards.js

// Maintain watched set using localStorage

const watched =
  new Set(

    JSON.parse(

      localStorage.getItem(
        "watched"
      ) || "[]"
    )
  );

/**
 * Mark a video as watched
 * Called from player.js
 * when playback begins
 */

export function markAsWatched(videoId) {

  if (
    !videoId ||
    watched.has(videoId)
  ) {

    return;
  }

  watched.add(videoId);

  localStorage.setItem(
    "watched",
    JSON.stringify([...watched])
  );

  /* ================= UPDATE UI ================= */

  document
    .querySelectorAll(
      `.card[data-id="${videoId}"]`
    )
    .forEach(card => {

      card.classList.add("watched");

    });
}

/**
 * Create a video card element
 * @param {Object} video
 * @param {Object} options
 * @returns {HTMLElement}
 */

export function createVideoCard(
  video,
  options = {}
) {

  const el =
    document.createElement("div");

  el.className =
    `card ${
      options.compact
        ? "side-card"
        : "fade-in"
    }`;

  el.dataset.id =
    video.id;

  // Add watched class if already viewed

  if (watched.has(video.id)) {

    el.classList.add("watched");
  }

  el.innerHTML = `
    <a
      href="/w/${video.id}"
      class="
        card-link
        ${options.compact
          ? "side-card-link"
          : ""}
      "
    >

      <img
        class="thumb"
        src="${video.thumbnail}"
        alt="${video.title}"
        loading="lazy"
      >

      <div class="card-body">

        <div class="title">
          ${video.title}
        </div>

        <div class="meta">
          ${video.duration}
          •
          ${video.views} views
        </div>

      </div>

    </a>
  `;

  return el;
}

/**
 * Optional utility:
 * mark multiple videos as watched
 */

export function markMultipleWatched(
  videoIds = []
) {

  videoIds.forEach(id => {

    markAsWatched(id);

  });
}
