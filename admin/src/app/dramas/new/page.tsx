import { getDynasties } from "@/lib/data";
import { DramaForm } from "@/components/DramaForm";

export default async function NewDramaPage() {
  const dynasties = await getDynasties();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">新建剧集</h1>
        <p className="mt-1 text-sm text-zinc-500">创建一个新的剧集条目</p>
      </div>

      <DramaForm dynasties={dynasties} />
    </div>
  );
}
