# 华夏剧典 · 本地编辑（drama-edit）

独立于前台静态站的**本地数据编辑工具**。通过选择与 `dramaTimeline` 仓库中 `data/` 相同结构的文件夹，编辑 `dynasties.json` 与 `dramas.json`，校验规则与线上管理后台一致（复用 `admin/src/lib/validation.ts`）。

## 谁能用、怎么用

### 方式 A：有完整仓库的维护者（推荐开发调试）

1. 克隆本仓库（需包含上层 `admin/`，以便共享校验逻辑）
2. 安装依赖并启动：

```bash
cd drama-edit
npm install
npm run dev
```

3. 在应用内点击「选择数据文件夹」，选中仓库根目录下的 `data/`（内含两个 JSON）

### 方式 B：完全不懂开发的协作者

请使用 **Release 里打好的绿色压缩包**（Windows 一般为 `portable` 或 `zip` 解压后运行；macOS 为 `zip` 解压后的 `.app`）。无需安装向导。

解压对方发来的**内容包**后，应能看到 `data/` 与 `public/posters/`。在编辑器中请点击「选择数据文件夹」，选中其中的 **`data` 目录**（内含 `dynasties.json`、`dramas.json`）。编辑保存后，将修改后的文件连同海报目录一并打包发回维护者。

维护者在仓库根目录可执行：

```bash
bash scripts/pack-content-bundle.sh
```

生成带时间戳的 `huaxia-content-*.zip`（含 `data/` 与 `public/posters/`），便于互传。

> 在 `drama-edit` 目录执行 `npm run build` 可本地打出编辑器分发包（输出在 `drama-edit/release/`）。若需 CI 自动构建，见 `PLANNED.md`。

## 数据约定

- 目录内需同时存在：`dynasties.json`、`dramas.json`
- 保存前会自动按 Zod 规则校验；`dramas` 中的 `dynasty_id` 必须在 `dynasties` 中存在

## 与主项目的关系

| 项目 | 职责 |
|------|------|
| `dramaTimeline/`（根目录） | 前台静态站 |
| `admin/` | 不部署线上；保留目录仅用于与编辑器 **共享 Zod 校验**（避免两套规则） |
| `drama-edit/` | 本地编辑 + 将来发布用的数据包 |

## 待办与需要你确认的事项

见同目录 [`PLANNED.md`](./PLANNED.md)。
