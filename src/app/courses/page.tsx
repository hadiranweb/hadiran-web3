import { db } from "@/db";
import { courses, courseTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { EditorialCollection } from "@/components/landing/EditorialCollection";
export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"دوره‌ها",description:"یادگیری در هادیران؛ از فهم تا تمرین و بازبینی.",alternates:{canonical:"/courses"}};
export default async function CoursesPage(){
  let items:(typeof courses.$inferSelect)[]=[];let available=false;const tags:Record<number,string[]>={};
  if(process.env.DATABASE_URL){
    try{items=await db.select().from(courses);available=true;}catch{console.error("[hadiran] public courses unavailable");}
    if(available)try{const links=await db.select({id:courseTopics.courseId,label:topics.labelFa}).from(courseTopics).innerJoin(topics,eq(courseTopics.topicId,topics.id));for(const link of links)(tags[link.id] ||= []).push(link.label);}catch{console.error("[hadiran] public course topics unavailable");}
  }
  return <EditorialCollection kind="courses" available={available} items={items.map(item=>({id:String(item.id),href:`/courses/${item.slug}`,title:item.titleFa,summary:item.descriptionFa || "",status:item.type,label:item.type==="free" ? "رایگان" : "فروشی",topics:tags[item.id] || []}))} />;
}
