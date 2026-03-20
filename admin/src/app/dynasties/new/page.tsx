import { getDynasties } from "@/lib/data";
import { DynastyForm } from "@/components/DynastyForm";

export default async function NewDynastyPage() {
  const dynasties = await getDynasties();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">新建朝代</h1>
        <p className="mt-1 text-sm text-zinc-500">创建一个新的朝代条目</p>
      </div>

      <DynastyForm dynasties={dynasties} />
    </div>
  );
}
