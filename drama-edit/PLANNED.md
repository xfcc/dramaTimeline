# drama-edit 规划（已根据你的选择更新）

## 你已确认的方向

1. **分发形态**：绿色 zip / 解压即运行（不要安装向导）。`electron-builder` 已偏向 `win: portable + zip`、`mac: zip`。
2. **互传内容**：内容包需包含 **数据 + 海报**。仓库根目录已提供打包脚本：[`scripts/pack-content-bundle.sh`](../scripts/pack-content-bundle.sh)（生成带 `data/` 与 `public/posters/` 的 zip）。
3. **线上 admin**：以本地编辑为主，**不维护线上 admin**。仓库内可保留 `admin/` 目录仅作 **Zod 校验复用**（避免与 `drama-edit` 两套规则分叉）；不部署、不对外暴露即可。
4. **前台更新方式（已采纳的建议）**：**合并数据 → 本地 `npm run build` → 上传 `out/` 到 TOS + CDN**。前台已恢复为构建时从 `data/` 读入，利于 SEO、零后端、与「只买对象存储」一致。

## 已完成（本阶段）

- [x] `drama-edit/` Electron 本地编辑器（选目录、编辑 JSON、校验、保存）
- [x] 校验复用 `admin/src/lib/validation.ts`
- [x] 内容包打包脚本 `scripts/pack-content-bundle.sh`
- [x] 前台 `page.tsx` 回到静态数据源路径（与纯静态部署一致）

## 建议后续待办

1. **CI 打编辑器 zip**：在 Actions 里对 `drama-edit` 跑 `npm run build`，产出 `release/*.zip` 供协作者下载。
2. **（可选）抽公共校验**：将 `validation.ts` 移到例如 `shared/validation.ts`，`drama-edit` 与遗留 `admin` 共用，语义上更清晰（非必须）。
3. **（可选）编辑器增强**：支持一次选择「内容包根目录」（内含 `data/` + `public/posters/`），在应用内提示海报是否与 `poster_url` 一致。

## 协作者操作备忘

1. 解压收到的内容 zip，应看到 `data/` 与 `public/posters/`。
2. 打开「华夏剧典编辑」，**选择其中的 `data` 文件夹**（内含两个 JSON）进行编辑与保存。
3. 将修改后的整个文件夹重新打包发回（或只发回你改过的 `data` + 若有新海报则带上对应 `public/posters` 子路径）。
