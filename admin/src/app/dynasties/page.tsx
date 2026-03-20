import Link from "next/link";

import { getDynasties, getDramas } from "@/lib/data";
import { DynastyTable } from "@/components/DynastyTable";

export default async function DynastiesPage() {
  const [dynasties, dramas] = await Promise.all([getDynasties(), getDramas()]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">朝代管理</h1>
          <p className="mt-1 text-sm text-zinc-500">
            共 {dynasties.length} 个朝代
          </p>
        </div>
        <Link
          href="/dynasties/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          + 新建朝代
        </Link>
      </div>

      <DynastyTable dynasties={dynasties} dramas={dramas} />
    </div>
  );
}
