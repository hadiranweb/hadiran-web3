import { db } from "@/db";
import { projects, projectTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { EditorialCollection } from "@/components/landing/EditorialCollection";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {title:"کارگاه",description:"پروژه‌ها و ظرف‌های باز هادیران؛ از پرسش تا نمونه و یادگیری.",alternates:{canonical:"/lab"}};
const labels:Record<string,string>={idea:"ایده",concept:"مفهوم",research:"تحقیق",prototype:"نمونهٔ اولیه",development:"توسعه",beta:"بتا",production:"تولید",archived:"بایگانی‌شده"};
export default async function LabPage(){
  let items:(typeof projects.$inferSelect)[]=[]; let available=false;
  const tags:Record<number,string[]>={};
  if(process.env.DATABASE_URL) {
    try { items=await db.select().from(projects);available=true; } catch { console.error("[hadiran] public lab unavailable"); }
    if(available)try{const links=await db.select({id:projectTopics.projectId,label:topics.labelFa}).from(projectTopics).innerJoin(topics,eq(projectTopics.topicId,topics.id));for(const link of links)(tags[link.id] ||= []).push(link.label);}catch{console.error("[hadiran] public project topics unavailable");}
  }
  return <EditorialCollection kind="lab" available={available} items={items.map(item=>({id:String(item.id),href:`/lab/${item.slug}`,title:item.nameFa,summary:item.descriptionFa || "",status:item.status,label:labels[item.status] || item.status,topics:tags[item.id] || [],progress:item.progress}))} />;
}
