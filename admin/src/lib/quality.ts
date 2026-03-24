import type { Drama, Dynasty } from "@/types";

export type QualityIssue = {
  kind:
    | "invalid_dynasty_ref"
    | "theme_dynasty_time_nonoverlap"
    | "missing_poster"
    | "rating_without_count"
    | "count_without_rating"
    | "invalid_platform_url";
  level: "error" | "warning";
  dramaId: string;
  dramaTitle: string;
  message: string;
};

function isLikelyUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function collectDramaQualityIssues(
  dramas: Drama[],
  dynasties: Dynasty[],
): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const dynastyMap = new Map(dynasties.map((d) => [d.id, d]));

  for (const drama of dramas) {
    const dynasty = dynastyMap.get(drama.dynasty_id);

    if (!dynasty) {
      issues.push({
        kind: "invalid_dynasty_ref",
        level: "error",
        dramaId: drama.id,
        dramaTitle: drama.title,
        message: `引用了不存在的朝代 ID: ${drama.dynasty_id}`,
      });
      continue;
    }

    const hasOverlap =
      drama.story_end_year >= dynasty.start_year &&
      drama.story_start_year <= dynasty.end_year;

    if (!hasOverlap) {
      issues.push({
        kind: "theme_dynasty_time_nonoverlap",
        level: "warning",
        dramaId: drama.id,
        dramaTitle: drama.title,
        message: `主题朝代为 ${dynasty.name}，但剧情年代 ${drama.story_start_year}~${drama.story_end_year} 与其时间区间 ${dynasty.start_year}~${dynasty.end_year} 不重叠，请确认主题归属是否符合预期`,
      });
    }

    if (!drama.poster_url) {
      issues.push({
        kind: "missing_poster",
        level: "warning",
        dramaId: drama.id,
        dramaTitle: drama.title,
        message: "未设置海报",
      });
    }

    if (drama.douban_rating != null && drama.douban_rating_count == null) {
      issues.push({
        kind: "rating_without_count",
        level: "warning",
        dramaId: drama.id,
        dramaTitle: drama.title,
        message: "有评分但缺少评分人数",
      });
    }

    if (drama.douban_rating == null && drama.douban_rating_count != null) {
      issues.push({
        kind: "count_without_rating",
        level: "warning",
        dramaId: drama.id,
        dramaTitle: drama.title,
        message: "有评分人数但缺少评分",
      });
    }

    for (const platform of drama.platforms) {
      if (!isLikelyUrl(platform.url)) {
        issues.push({
          kind: "invalid_platform_url",
          level: "warning",
          dramaId: drama.id,
          dramaTitle: drama.title,
          message: `平台「${platform.name}」URL 看起来不是标准 http(s) 链接`,
        });
      }
    }
  }

  return issues;
}

export function validateDramaCrossFields(
  drama: Drama,
  dynasties: Dynasty[],
): string[] {
  const errors: string[] = [];
  const dynasty = dynasties.find((d) => d.id === drama.dynasty_id);

  if (!dynasty) {
    errors.push(`朝代 ID 不存在: ${drama.dynasty_id}`);
    return errors;
  }

  return errors;
}
