export const TMDB_IMAGE_ORIGINAL_BASE = "https://image.tmdb.org/t/p/original";

export const POSTER_SIZES = [
  { name: "thumb", width: 240, height: 360, quality: 82 },
  { name: "medium", width: 480, height: 720, quality: 88 },
  { name: "large", width: 960, height: 1440, quality: 92 },
];

export function isUsablePosterUrl(posterPathOrUrl) {
  if (!posterPathOrUrl) return false;
  return !/\/movie-static\/pics\/[^/]*default[^/]*\.(?:png|jpg|jpeg|webp)$/i.test(
    posterPathOrUrl,
  );
}

export function normalizeTmdbPosterUrl(posterPathOrUrl) {
  if (!posterPathOrUrl) return posterPathOrUrl;

  if (posterPathOrUrl.startsWith("//")) {
    return normalizeTmdbPosterUrl(`https:${posterPathOrUrl}`);
  }

  const relativePosterMatch = posterPathOrUrl.match(/^\/t\/p\/[^/]+\/(.+)$/);
  if (relativePosterMatch) {
    return `${TMDB_IMAGE_ORIGINAL_BASE}/${relativePosterMatch[1]}`;
  }

  if (posterPathOrUrl.startsWith("/")) {
    return `${TMDB_IMAGE_ORIGINAL_BASE}${posterPathOrUrl}`;
  }

  try {
    const url = new URL(posterPathOrUrl);
    const absolutePosterMatch = url.pathname.match(/^\/t\/p\/[^/]+\/(.+)$/);
    if (
      absolutePosterMatch &&
      (url.hostname.endsWith("themoviedb.org") ||
        url.hostname.endsWith("tmdb.org"))
    ) {
      return `${TMDB_IMAGE_ORIGINAL_BASE}/${absolutePosterMatch[1]}`;
    }
  } catch {
    return posterPathOrUrl;
  }

  return posterPathOrUrl;
}

export function normalizeDoubanPosterUrl(posterPathOrUrl) {
  if (!posterPathOrUrl) return posterPathOrUrl;

  const absoluteUrl = posterPathOrUrl.startsWith("//")
    ? `https:${posterPathOrUrl}`
    : posterPathOrUrl;

  return absoluteUrl.replace(
    /\/view\/photo\/[^/]+\/public\//,
    "/view/photo/l/public/",
  );
}
