import { and, eq, isNotNull } from "drizzle-orm";
import { courses, knowledge, memoryItems, projects, shopListings } from "@/db/schema";

/**
 * قرارداد انتشار عمومی.
 * فقط همین فیلترها وارد projection عمومی می‌شوند.
 * حافظهٔ خصوصی، تفسیر شخصی آزمون، و دادهٔ مالی اینجا نیستند.
 */
export const publicKnowledgeFilter = and(
  isNotNull(knowledge.memoryItemId),
  eq(knowledge.aiIndexable, true),
  eq(memoryItems.lifecycle, "approved"),
  eq(memoryItems.visibility, "public"),
);

export const publicKnowledgeJoin = eq(knowledge.memoryItemId, memoryItems.id);

export const publicProjectFilter = eq(projects.published, true);

export const publicCourseFilter = eq(courses.published, true);

export const publicShopFilter = eq(shopListings.published, true);
