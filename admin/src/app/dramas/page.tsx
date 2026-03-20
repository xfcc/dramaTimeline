import Link from "next/link";

import { getDramas, getDynasties } from "@/lib/data";
import { DramaTable } from "@/components/DramaTable";

export default async function DramasPage() {
  const [dramas, dynasties] = await Promise.all([getDramas(), getDynasties()]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">剧集管理</h1>
          <p className="mt-1 text-sm text-zinc-500">
            共 {dramas.length} 部剧集
          </p>
        </div>
        <Link
          href="/dramas/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          + 新建剧集
        </Link>
      </div>

      <DramaTable dramas={dramas} dynasties={dynasties} />
    </div>
  );
}
