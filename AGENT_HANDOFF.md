# AGENT_HANDOFF · 华夏剧典（dramaTimeline）

> 写给下一个接手这个项目的 AI Agent。读完这份文档，你应当能在 10 分钟内理解项目的定位、当前形态、代码骨架和待办方向。

---

## 一、项目是什么

**华夏剧典**（Huaxia Jvdian）是一个**以"朝代/时间"为锚点的国产历史剧可视化索引引擎**。

- 一句话定义：把散落在各平台的华语历史剧，按朝代纵向编织成一张深色博物馆质感的时间画卷。
- 不做的事：不推荐、不排行、不放广告、不接入算法流。
- 做的事：按朝代分组展示剧集 → 悬停/点击查看核心信息（豆瓣评分、集数、年份、历史锚点、核心张力、播放平台）。

### 为什么做这件事（核心痛点）

1. **历史坐标错乱**：看完《大明风华》接着看《山河月明》，脑子里缺乏"朱元璋→朱棣→朱祁镇"的绝对时间坐标。
2. **正剧与演义维度污染**：考据党和爽剧受众互相觉得吵闹，把《大明王朝1566》和《戏说乾隆》混在一个列表里对双方都是噪音。
3. **长尾检索效率低**：搜"五代十国相关剧"得到的全是营销号碎片。

### 长期意义

表层是一个克制高级的视觉索引；底层壁垒是一套结构化的**历史剧知识图谱**（剧集 ↔ 时间 ↔ 事件 ↔ 人物）。原 `docs/knowledge/PRODUCT_SPEC.md` 把这个图谱拆成三个阶段（详见 `docs/knowledge/PRODUCT_SPEC.md` 第二节）：

| 阶段 | 关联维度 | 当前进度 |
|---|---|---|
| Phase 1 | 时间（朝代/年份） | ✅ 已完成 MVP |
| Phase 2 | 历史事件 | ❌ 未开始（数据 schema 已在 spec 中预留） |
| Phase 3 | 历史人物 | ❌ 未开始 |

---

## 二、仓库结构（多子项目并存）

仓库根目录其实是**三个子项目**并存的 monorepo（未使用 workspace 工具，互相通过相对路径引用）：

```
dramaTimeline/
├── src/                    # ① 前台静态站（Next.js 16，对外展示主体）
├── data/                   #    数据源：dynasties.json + dramas.json
├── public/posters/         #    海报：thumb / medium / large / original
├── scripts/                #    工具脚本（海报发布、内容包打包）
├── docs/knowledge/         #    内部知识文档：产品愿景、接手说明索引
├── README.md               #    产品介绍（面向用户/读者）
│
├── admin/                  # ② 旧版管理后台（Next.js）
│                           #    现状：不部署、不维护线上
│                           #    保留原因：drama-edit 复用其 Zod 校验逻辑
│
└── drama-edit/             # ③ 本地数据编辑器（Electron + Vite + React）
                            #    分发给不懂开发的协作者用，绿色 zip 即解即用
```

> ⚠️ **`admin/` 已退役**。详见 `drama-edit/PLANNED.md`，目前协作模式已切换为：**本地 `drama-edit` 改 JSON → 维护者合并 → `npm run build` → 上传 `out/` 到 TOS + CDN**。`admin/` 现仅作为 Zod 校验源（`admin/src/lib/validation.ts`）被 `drama-edit` 通过 `@shared-validation` 别名引用。

---

## 三、技术栈（前台主体）

| 层 | 选择 |
|---|---|
| 框架 | Next.js 16 + React 19（App Router） |
| 渲染模式 | **静态导出** `output: "export"`（`next.config.ts`） |
| 样式 | Tailwind CSS 4（`@tailwindcss/postcss`） |
| 动画 | Framer Motion 12 |
| 字体 | CSS 字体栈优先使用 Noto Serif SC（标题）+ Noto Sans SC（正文），回退到系统中文字体 |
| 编译器 | React Compiler（`reactCompiler: true`） |
| 数据 | 构建时读取本地 JSON（`src/lib/data.ts` 用 `node:fs`） |

部署：零后端，静态站点（`out/`）上传到对象存储 + CDN。

---

## 四、数据模型

定义见 `src/types/index.ts`，Zod 校验见 `admin/src/lib/validation.ts`。

### Dynasty（朝代）

```ts
{
  id: DynastyId;          // 强类型枚举，如 "tang" / "ming" / "northernSong"
  name: string;
  start_year: number;     // 负数表示公元前
  end_year: number;
  display_order: number;  // 同时间段的多个朝代用此排序
  parent_id: DynastyId | null;  // 处理并行政权（如"魏/蜀/吴" parent 是"threeKingdoms"）
  track: "main";          // 预留字段
  color: string;          // 形如 "var(--dyn-tang)"，对应 globals.css 中的 token
}
```

当前 27 个朝代节点，覆盖**春秋战国 → 秦 → 楚汉 → 两汉（含西汉/新/东汉子节点）→ 三国（含魏/蜀/吴）→ 两晋 → 南北朝 → 隋 → 唐 → 五代十国 → 宋辽夏金（含两宋/北宋/南宋/辽/西夏/金）→ 元 → 明 → 清 → 民国**。

### Drama（剧集）

```ts
{
  id: string;
  title: string;
  category: "serious" | "romance";       // 严肃正剧 / 史事演义（二元分类，不细分）
  douban_rating: number | null;
  douban_rating_count: number | null;
  episode_count: number;
  release_year: number;
  story_start_year: number;
  story_end_year: number;
  dynasty_id: DynastyId;                  // 注意：从 spec 的 dynasty_ids[] 简化为单值
  historical_anchor: string;              // 一句话历史锚点
  core_tension: string;                   // 一句话核心张力
  poster_url: string | null;              // "/posters/medium/<id>.webp"
  platforms: { name: string; url: string }[];
}
```

当前 `data/dramas.json` 收录 **89 部** 剧集。

> 重要：原 spec 中 `dynasty_ids: string[]`（支持跨朝代）在第 `91256ab` 次提交时被**简化为单值** `dynasty_id`。跨朝代展示能力（spec 中的 Span Bar）随之取消。

---

## 五、前台关键代码（必读地图）

| 文件 | 作用 |
|---|---|
| `src/app/layout.tsx` | 全局布局，配置思源宋/黑字体 |
| `src/app/page.tsx` | 入口：构建时读 JSON → 渲染 `<Timeline>` |
| `src/app/globals.css` | 全局 CSS 变量，朝代配色 token（`--dyn-tang` 等） |
| `src/components/Timeline/Timeline.tsx` | **主时间轴组件**（必读，~320 行） |
| `src/components/DramaNode/DramaRow.tsx` | 单部剧集的海报卡片（120×180） |
| `src/components/DetailDrawer/DetailDrawer.tsx` | 右侧详情抽屉（点击卡片打开） |
| `src/components/Filter/CategoryFilter.tsx` | 顶部"严肃正剧 / 史事演义"切换 |
| `src/hooks/useFilter.ts` | 滤镜状态 hook |
| `src/hooks/useDetailDrawer.ts` | 抽屉状态 hook |
| `src/lib/data.ts` | 从 `data/*.json` 读取（仅服务端可用） |

### Timeline.tsx 的当前形态（关键事实）

当前实现**不是** spec 里写的"水平手风琴 + 蜂巢网格 + 分叉轨道"，而是一个更朴素的**两栏纵向滚动布局**：

- **左栏**（280 px，sticky）：朝代名 + 年份跨度 + 一根贯穿的金色时间轴，带滚动驱动的"光束"（`useScroll` + `useTransform`）。
- **右栏**：该朝代所有剧集，以海报卡片 flex-wrap 平铺。
- **并行政权（魏/蜀/吴 等）**：当前通过 `buildTree` 收集子节点并把后代剧集一并归入父朝代行（`collectDescendantIds`），**未实际渲染分叉轨道**。子朝代信息（display_order、parent_id）仍保留在数据里，未来要做分叉时可直接用。

`filter.useFilter("serious")` 默认只显示严肃正剧。

---

## 六、当前进展（从 git log 看脉络）

```
10fb15c chore: 引入 drama-edit 编辑器，收紧 .gitignore
6e96856 docs: README 重写为产品介绍
70b3bf2 feat(branding): 项目改名"华夏剧典"，admin 入口加 Basic Auth
2fafd92 feat(data): 统一主轴时间轴，收紧编辑分类规则
4e27249 feat(data): 自动抓海报，补齐剧集封面
ac19d07 feat(admin): quality guards / 完整度 UI / Gemini AI 建议
1681f3a chore: 海报一键发布工作流
d2854e8 fix(build): TS 排除 admin workspace
e95b489 feat(admin): 后台首版
91256ab feat: dynasty_ids → dynasty_id，扩至 70 部
7cfe44e feat: 海报卡片 + 右侧抽屉详情
ab72fc8 feat: 树状缩进 + 无限画布
669dbf6 chore: 从仓库移除产品文档
5871c93 feat: MVP 上线
df61f6c Initial commit
```

### 已完成

- ✅ MVP 时间轴（纵向两栏，深色博物馆主题）
- ✅ 27 个朝代 + 89 部剧集 + 89 张海报（thumb/medium/large/original 四档）
- ✅ 严肃正剧 / 史事演义二元滤镜
- ✅ 海报卡片 + 右侧详情抽屉
- ✅ Zod 校验复用（admin → drama-edit）
- ✅ Electron 本地编辑器 `drama-edit`（可分发给协作者用）
- ✅ 内容包打包脚本 `scripts/pack-content-bundle.sh`
- ✅ 海报一键发布脚本 `scripts/publish-posters.mjs`
- ✅ 静态导出 → 对象存储 + CDN 的部署路径

### 与 PRODUCT_SPEC 的差距（尚未实现 / 已偏离）

| Spec 设想 | 当前实现 |
|---|---|
| 水平手风琴时间轴（左远古→右现代） | 纵向滚动，朝代从上到下 |
| 蜂巢六边形网格 | 普通海报卡片 flex-wrap |
| 三国/南北朝/五代十国的分叉轨道 + SVG 曲线 | 子朝代被折叠进父朝代行，未分叉渲染 |
| 跨朝代剧集的 Span Bar | 已取消（数据简化为单 `dynasty_id`） |
| View Transitions API + spring 折叠动画 | 未实现 |
| 历史事件标记（赤壁之战、玄武门之变…） | Phase 2，未启动 |
| 历史人物图谱 | Phase 3，未启动 |
| 移动端 / 搜索 / SEO 静态页 / UGC | 全部明确不做（见 spec 第八节） |

> 📌 **判断题**：现在的 MVP 是"功能可用、视觉克制"的最简版本。如果接下来想冲击 spec 里描述的"博物馆级数字展厅质感"，分叉轨道 + 蜂巢网格 + 横向时间轴这三件事是最值得继续投入的方向。

---

## 七、协作 / 发布工作流（现行）

```text
协作者                              维护者
─────────                          ─────────
拿到 huaxia-content-*.zip
  ↓
解压 → 见 data/ + public/posters/
  ↓
打开 "华夏剧典编辑" (drama-edit)
  ↓
选择内层 data/ 目录
  ↓
改 JSON，Zod 校验通过，保存
  ↓
连同 posters 重新打包                ←  收到 zip
                                     ↓
                                   解压覆盖到仓库的 data/ + public/posters/
                                     ↓
                                   npm run build  →  out/
                                     ↓
                                   上传 out/ 到对象存储 + CDN 刷新
```

### 常用命令

```bash
# 前台开发
npm install
npm run dev                     # http://localhost:3000

# 前台静态导出（部署用）
npm run build                   # 产物在 out/

# 海报一键提交（含 add/commit/可选 push）
npm run publish-posters         # 不推
npm run publish-posters:push    # 推到 origin/main

# 打包内容包发给协作者
bash scripts/pack-content-bundle.sh

# 本地编辑器（开发）
cd drama-edit
npm install
npm run dev                     # 自动起 vite + electron

# 本地编辑器（出绿色包）
cd drama-edit
npm run build                   # 产物在 drama-edit/release/
```

### 环境变量

- **前台**：不需要任何环境变量（纯静态）。`.env.example` 仅作历史预留。
- **admin/**（如果有人重启）：需要 `ADMIN_USERNAME` / `ADMIN_PASSWORD`（Basic Auth），可选 `GEMINI_API_KEY`（AI 建议功能）。详见 `admin/.env.example`。
- **drama-edit/**：无需环境变量。

---

## 八、给下一个 Agent 的建议起点

按"性价比 / 风险"排序：

1. **补数据 / 修分类**：通过 `drama-edit` 增补剧集、修正 `category` 与 `historical_anchor`。低风险，直接增量价值。
2. **重塑 Timeline UI 的两个高 ROI 子项**：
   - 分叉轨道渲染（三国 / 南北朝 / 五代十国 / 宋辽夏金已经有 `parent_id` 数据，只差视觉层）。
   - 蜂巢网格 / 紧凑布局，让"清宫剧扎堆区"不再撑爆纵向空间。
3. **回归"跨朝代"能力**：把 `dynasty_id: DynastyId` 变回 `dynasty_ids: DynastyId[]`，同步更新 Zod 校验、`drama-edit`、Timeline 渲染。
4. **Phase 2 历史事件层**：建 `data/events.json`，在朝代时间轴上叠加事件点。这是从"索引"走向"知识图谱"的关键一步。
5. **CI 打 drama-edit 绿色包**（见 `drama-edit/PLANNED.md`）：让协作者可以从 GitHub Releases 直接下载。

### ⚠️ 几个一定要先看的文件 / 雷区

- `docs/knowledge/PRODUCT_SPEC.md`：完整产品愿景，但**部分已偏离**，把它当"北极星"而不是"现状描述"。
- `drama-edit/PLANNED.md`：解释了 admin 为什么退役、协作流为什么改成 Electron。
- `next.config.ts` 的 `output: "export"`：意味着**不能用** Next.js 的 SSR / API Route / 动态路由 SSG 数据获取。要加后端能力得另起服务。
- `dynasty_id` 是单值不是数组，注意不要被 spec 误导。
- `admin/` 不要直接拿去部署线上，里面的 Basic Auth 是临时方案；要恢复线上后台需要重新设计鉴权。
- `src/components/Timeline/Timeline.tsx` 里 `LEFT_COL_WIDTH / LINE_X / LABEL_LEFT` 这些常量是视觉调优的关键参数，改之前最好截屏对比。
- 前台不要直接恢复 `next/font/google`，否则静态构建会依赖构建机访问 Google Fonts；如需固定字体，请把字体文件 vendored 到项目内再用本地字体。

---

## 九、一句话定位

> "把每一部历史剧放回它所属的时间坐标里"——这是华夏剧典的全部野心，也是判断任何新需求是否该做的唯一尺子。
