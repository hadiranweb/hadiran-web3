import { connection } from "next/server";
import { homePortraitPublicUrl } from "@/lib/storage/disk";
import { ReassemblyPortrait } from "./ReassemblyPortrait";

export async function HomePortrait() {
  await connection();
  const src = await homePortraitPublicUrl();
  if (!src) return <ReassemblyPortrait />;

  return (
    // Disk SVG is owner-placed; img keeps scripts inert.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="تصویر هادی، بنیان‌گذار هادیران"
      className="relative mx-auto block h-auto w-full max-w-[28rem]"
      decoding="async"
    />
  );
}
