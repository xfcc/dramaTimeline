#!/usr/bin/env bash
# 打包「数据 + 海报」，便于与朋友互传或备份。
# 用法：在仓库根目录执行  bash scripts/pack-content-bundle.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
NAME="huaxia-content-$(date +%Y%m%d-%H%M).zip"
zip -r -q "$NAME" data public/posters
echo "已生成: $ROOT/$NAME"
