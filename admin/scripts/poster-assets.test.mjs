import assert from "node:assert/strict";
import test from "node:test";

import {
  POSTER_SIZES,
  isUsablePosterUrl,
  normalizeDoubanPosterUrl,
  normalizeTmdbPosterUrl,
} from "./poster-assets.mjs";

test("normalizes TMDB thumbnail URLs to original image URLs", () => {
  assert.equal(
    normalizeTmdbPosterUrl(
      "https://media.themoviedb.org/t/p/w94_and_h141_bestv2/poster.jpg",
    ),
    "https://image.tmdb.org/t/p/original/poster.jpg",
  );
  assert.equal(
    normalizeTmdbPosterUrl("https://image.tmdb.org/t/p/w500/poster.jpg"),
    "https://image.tmdb.org/t/p/original/poster.jpg",
  );
  assert.equal(
    normalizeTmdbPosterUrl("/t/p/w94_and_h141_bestv2/poster.jpg"),
    "https://image.tmdb.org/t/p/original/poster.jpg",
  );
  assert.equal(
    normalizeTmdbPosterUrl("/poster.jpg"),
    "https://image.tmdb.org/t/p/original/poster.jpg",
  );
});

test("exports retina-friendly poster variant sizes", () => {
  assert.deepEqual(
    POSTER_SIZES.map(({ name, width, height }) => ({ name, width, height })),
    [
      { name: "thumb", width: 240, height: 360 },
      { name: "medium", width: 480, height: 720 },
      { name: "large", width: 960, height: 1440 },
    ],
  );
});

test("normalizes Douban poster thumbnails to large image URLs", () => {
  assert.equal(
    normalizeDoubanPosterUrl(
      "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p631944470.jpg",
    ),
    "https://img1.doubanio.com/view/photo/l/public/p631944470.jpg",
  );
  assert.equal(
    normalizeDoubanPosterUrl(
      "//img2.doubanio.com/view/photo/m/public/p631944470.jpg",
    ),
    "https://img2.doubanio.com/view/photo/l/public/p631944470.jpg",
  );
});

test("rejects Douban default placeholder poster URLs", () => {
  assert.equal(
    isUsablePosterUrl(
      "https://img1.doubanio.com/cuphead/movie-static/pics/tv_default_small.png",
    ),
    false,
  );
  assert.equal(
    isUsablePosterUrl(
      "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2575362797.jpg",
    ),
    true,
  );
});
