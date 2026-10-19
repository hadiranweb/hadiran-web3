import type { Metadata } from "next";
import { loadPublicGarden } from "@/lib/garden/public";
import { GardenPreview } from "@/components/garden/GardenPreview";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {title:"کارگاهِ روشن‌تر دیدن — نمونهٔ مستقل",robots:{index:false,follow:false}};
export default async function GardenPreviewPage() {
  return <GardenPreview snapshot={await loadPublicGarden()}/>;
}
