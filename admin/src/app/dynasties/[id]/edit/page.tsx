import { notFound } from "next/navigation";

import { getDynasties } from "@/lib/data";
import { DynastyForm } from "@/components/DynastyForm";

export default async function EditDynastyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dynasties = await getDynasties();
  const dynasty = dynasties.find((d) => d.id === id);

  if (!dynasty) notFound();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">编辑朝代</h1>
        <p className="mt-1 text-sm text-zinc-500">修改「{dynasty.name}」</p>
      </div>

      <DynastyForm initialData={dynasty} dynasties={dynasties} />
    </div>
  );
}
