import { Timeline } from "@/components/Timeline/Timeline";
import { getDramas, getDynasties } from "@/lib/data";

export default async function Home() {
  const [dynasties, dramas] = await Promise.all([getDynasties(), getDramas()]);

  return (
    <main className="min-h-screen w-full">
      <Timeline dynasties={dynasties} dramas={dramas} />
    </main>
  );
}
