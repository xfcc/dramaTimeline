import { notFound } from "next/navigation";

import { getDramas, getDynasties } from "@/lib/data";
import { DramaForm } from "@/components/DramaForm";

export default async function EditDramaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dramas, dynasties] = await Promise.all([getDramas(), getDynasties()]);
  const drama = dramas.find((d) => d.id === id);

  if (!drama) notFound();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">编辑剧集</h1>
        <p className="mt-1 text-sm text-zinc-500">修改「{drama.title}」</p>
      </div>

      <DramaForm initialData={drama} dynasties={dynasties} />
    </div>
  );
}
