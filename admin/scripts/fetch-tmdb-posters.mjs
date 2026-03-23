#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const TMDB_BASE = "https://www.themoviedb.org";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const ROOT_DIR = path.resolve(process.cwd(), "..");
const DRAMAS_PATH = path.join(ROOT_DIR, "data", "dramas.json");
const POSTERS_DIR = path.join(ROOT_DIR, "public", "posters");
const SIZES = [
  { name: "thumb", width: 120, height: 180, quality: 80 },
  { name: "medium", width: 240, height: 360, quality: 85 },
  { name: "large", width: 480, height: 720, quality: 90 },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: Infinity,
    force: false,
    dryRun: false,
    delayMs: 1200,
    jitterMs: 400,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--limit") {
      const val = Number(args[i + 1]);
      if (!Number.isFinite(val) || val <= 0) {
        throw new Error("Invalid --limit value");
      }
      options.limit = val;
      i += 1;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--delay-ms") {
      const val = Number(args[i + 1]);
      if (!Number.isFinite(val) || val < 0) {
        throw new Error("Invalid --delay-ms value");
      }
      options.delayMs = val;
      i += 1;
    } else if (arg === "--jitter-ms") {
      const val = Number(args[i + 1]);
      if (!Number.isFinite(val) || val < 0) {
        throw new Error("Invalid --jitter-ms value");
      }
      options.jitterMs = val;
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalize(text) {
  return text
    .replace(/[·・:：,，!！?？'"“”‘’\s\-—_]/g, "")
    .toLowerCase();
}

function absoluteUrl(urlPath) {
  if (!urlPath) return null;
  if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
    return urlPath;
  }
  if (urlPath.startsWith("//")) {
    return `https:${urlPath}`;
  }
  if (urlPath.startsWith("/")) {
    return `${TMDB_BASE}${urlPath}`;
  }
  return `${TMDB_BASE}/${urlPath}`;
}

function scoreCandidate(drama, candidate) {
  const title = drama.title ?? "";
  const altTitle = candidate.original_name ?? "";
  const n1 = normalize(title);
  const n2 = normalize(candidate.name ?? "");
  const n3 = normalize(altTitle);
  let score = 0;

  if (n1 === n2 || n1 === n3) score += 100;
  if (n2.includes(n1) || n1.includes(n2)) score += 30;
  if (n3.includes(n1) || n1.includes(n3)) score += 20;

  const year = Number(drama.release_year);
  const firstAir = candidate.first_air_date?.slice(0, 4);
  if (Number.isFinite(year) && firstAir) {
    const diff = Math.abs(Number(firstAir) - year);
    if (diff === 0) score += 25;
    else if (diff <= 1) score += 18;
    else if (diff <= 3) score += 8;
  }

  if (candidate.poster_path) score += 15;
  if (candidate.popularity) score += Math.min(10, candidate.popularity / 10);
  if (candidate.posterPath) score += 10;
  return score;
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseSearchCandidates(html) {
  const candidates = [];
  const rowRegex = /<a[^>]*class="[^"]*result[^"]*"[^>]*href="(\/tv\/\d+[^"]*)"[^>]*>[\s\S]*?<\/a>/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const block = rowMatch[0];
    const urlPath = rowMatch[1];
    const titleMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    const imageAltMatch = block.match(/<img[^>]*alt="([^"]+)"/);
    const dateMatch = block.match(
      /<span[^>]*class="[^"]*release_date[^"]*"[^>]*>([\s\S]*?)<\/span>/,
    );
    const posterMatch = block.match(
      /<img[^>]*class="[^"]*poster[^"]*"[^>]*src="([^"]+)"/,
    );

    const title = decodeHtmlEntities(
      (
        (titleMatch?.[1] ?? "").replace(/<[^>]+>/g, "").trim() ||
        (imageAltMatch?.[1] ?? "").trim()
      ).trim(),
    );
    const dateText = (dateMatch?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
    const firstAirYear = Number(dateText.slice(0, 4));

    candidates.push({
      name: title,
      original_name: title,
      first_air_date: Number.isFinite(firstAirYear)
        ? `${firstAirYear}-01-01`
        : null,
      popularity: 0,
      posterPath: posterMatch?.[1] ? absoluteUrl(posterMatch[1]) : null,
      detailUrl: absoluteUrl(urlPath),
    });
  }
  return candidates;
}

async function extractPosterFromDetail(detailUrl) {
  const res = await fetch(detailUrl, {
    headers: {
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    return null;
  }
  const html = await res.text();
  const ogImage = html.match(
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
  )?.[1];
  if (ogImage) return absoluteUrl(ogImage);

  const posterImg = html.match(
    /<img[^>]*class="[^"]*poster[^"]*"[^>]*src="([^"]+)"/i,
  )?.[1];
  return posterImg ? absoluteUrl(posterImg) : null;
}

async function searchTmdbTv(drama) {
  const query = new URLSearchParams({ query: drama.title });
  const url = `${TMDB_BASE}/search/tv?${query.toString()}`;
  const res = await fetch(url, {
    headers: {
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`TMDB web search failed (${res.status}) for ${drama.title}`);
  }

  const html = await res.text();
  const results = parseSearchCandidates(html);
  if (!results.length) return null;

  const sorted = results
    .map((item) => ({ item, score: scoreCandidate(drama, item) }))
    .sort((a, b) => b.score - a.score);

  const best = sorted[0]?.item ?? null;
  if (!best) return null;
  if (!best.posterPath && best.detailUrl) {
    best.posterPath = await extractPosterFromDetail(best.detailUrl);
  }
  return best;
}

function centerCropToPoster(imageMeta) {
  const targetRatio = 2 / 3;
  const srcWidth = imageMeta.width ?? 0;
  const srcHeight = imageMeta.height ?? 0;
  if (!srcWidth || !srcHeight) {
    throw new Error("Cannot read source image size");
  }

  const srcRatio = srcWidth / srcHeight;
  if (srcRatio > targetRatio) {
    const width = Math.round(srcHeight * targetRatio);
    return {
      left: Math.max(0, Math.floor((srcWidth - width) / 2)),
      top: 0,
      width,
      height: srcHeight,
    };
  }

  const height = Math.round(srcWidth / targetRatio);
  return {
    left: 0,
    top: Math.max(0, Math.floor((srcHeight - height) / 2)),
    width: srcWidth,
    height,
  };
}

async function ensurePosterDirs() {
  await fs.mkdir(path.join(POSTERS_DIR, "original"), { recursive: true });
  for (const size of SIZES) {
    await fs.mkdir(path.join(POSTERS_DIR, size.name), { recursive: true });
  }
}

async function savePosterVariants(dramaId, imageBuffer) {
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  const crop = centerCropToPoster(meta);
  const cropped = image.extract(crop);

  await cropped
    .clone()
    .webp({ quality: 95 })
    .toFile(path.join(POSTERS_DIR, "original", `${dramaId}.webp`));

  for (const size of SIZES) {
    await cropped
      .clone()
      .resize(size.width, size.height, { fit: "cover" })
      .webp({ quality: size.quality })
      .toFile(path.join(POSTERS_DIR, size.name, `${dramaId}.webp`));
  }
}

async function fetchPosterBuffer(posterPathOrUrl) {
  const imageUrl = posterPathOrUrl.startsWith("/t/p/")
    ? `${TMDB_IMAGE_BASE}${posterPathOrUrl}`
    : posterPathOrUrl;
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to download poster (${res.status})`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pauseBetweenRequests(options) {
  const jitter = options.jitterMs
    ? Math.floor(Math.random() * (options.jitterMs + 1))
    : 0;
  const waitMs = options.delayMs + jitter;
  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

async function main() {
  const options = parseArgs();
  const dramas = await readJson(DRAMAS_PATH);
  await ensurePosterDirs();

  const targets = dramas.filter((d) => options.force || !d.poster_url);
  const picked = targets.slice(0, options.limit);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const drama of picked) {
    try {
      const match = await searchTmdbTv(drama);
      if (!match?.posterPath) {
        skipped += 1;
        console.log(`skip(no poster): ${drama.title}`);
        continue;
      }

      const score = scoreCandidate(drama, match);
      if (score < 35) {
        skipped += 1;
        console.log(`skip(low score ${score.toFixed(1)}): ${drama.title}`);
        continue;
      }

      if (options.dryRun) {
        console.log(
          `dry-run: ${drama.title} <- ${match.name} (${match.first_air_date ?? "n/a"})`,
        );
        continue;
      }

      const buffer = await fetchPosterBuffer(match.posterPath);
      await savePosterVariants(drama.id, buffer);
      drama.poster_url = `/posters/medium/${drama.id}.webp`;
      updated += 1;
      console.log(`updated: ${drama.title} <- ${match.name}`);
    } catch (err) {
      failed += 1;
      console.error(`failed: ${drama.title} (${err.message})`);
    }

    await pauseBetweenRequests(options);
  }

  if (!options.dryRun && updated > 0) {
    await writeJson(DRAMAS_PATH, dramas);
  }

  console.log(
    `done. selected=${picked.length}, updated=${updated}, skipped=${skipped}, failed=${failed}, dryRun=${options.dryRun}`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
