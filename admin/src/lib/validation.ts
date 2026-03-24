import { z } from "zod";

export const dynastySchema = z
  .object({
    id: z
      .string()
      .min(1, "ID 不能为空")
      .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "ID 只能包含字母和数字，且以字母开头"),
    name: z.string().min(1, "名称不能为空"),
    start_year: z.number({ coerce: true }).int("必须为整数"),
    end_year: z.number({ coerce: true }).int("必须为整数"),
    display_order: z.number({ coerce: true }).int("必须为整数").min(0, "排序值不能为负数"),
    parent_id: z.string().nullable(),
    track: z.literal("main"),
    color: z.string().min(1, "颜色不能为空"),
  })
  .refine((d) => d.start_year < d.end_year, {
    message: "起始年份必须小于结束年份",
    path: ["end_year"],
  });

export const platformSchema = z.object({
  name: z.string().min(1, "平台名称不能为空"),
  url: z.string().min(1, "URL 不能为空"),
});

export const dramaSchema = z
  .object({
    id: z
      .string()
      .min(1, "ID 不能为空")
      .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "ID 只能包含字母和数字，且以字母开头"),
    title: z.string().min(1, "标题不能为空"),
    category: z.enum(["serious", "romance"]),
    douban_rating: z.number().min(0).max(10).nullable(),
    douban_rating_count: z.number().int().min(0).nullable(),
    episode_count: z.number({ coerce: true }).int().min(1, "集数必须大于 0"),
    release_year: z.number({ coerce: true }).int(),
    story_start_year: z.number({ coerce: true }).int(),
    story_end_year: z.number({ coerce: true }).int(),
    dynasty_id: z.string().min(1, "朝代不能为空"),
    historical_anchor: z.string().min(1, "时间锚点不能为空"),
    core_tension: z.string().min(1, "核心张力不能为空"),
    poster_url: z.string().nullable(),
    platforms: z.array(platformSchema),
  })
  .refine((d) => d.story_start_year < d.story_end_year, {
    message: "故事起始年份必须小于结束年份",
    path: ["story_end_year"],
  });

export type DynastyInput = z.infer<typeof dynastySchema>;
export type DramaInput = z.infer<typeof dramaSchema>;
