import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, person, personOrganizations, personSkills, personTopics, skills, topics } from "@/db/schema";
import { readPublic } from "./source";

/** دادهٔ عمومیِ معرفی هادی؛ یک منبع مشترک برای صفحهٔ فعلی و بلوک زندهٔ استودیو. */
export function loadPublicPersonProfile() {
  return readPublic("public person profile", async () => {
    const [hadiran] = await db.select().from(person).where(eq(person.slug, "hadiran"));
    if (!hadiran) return null;
    const [personSkillsList, personTopicsList, personOrganizationsList] = await Promise.all([
      db
        .select({ id: skills.id, labelFa: skills.labelFa, slug: skills.slug })
        .from(personSkills)
        .innerJoin(skills, eq(personSkills.skillId, skills.id))
        .where(eq(personSkills.personId, hadiran.id)),
      db
        .select({ id: topics.id, labelFa: topics.labelFa, slug: topics.slug })
        .from(personTopics)
        .innerJoin(topics, eq(personTopics.topicId, topics.id))
        .where(eq(personTopics.personId, hadiran.id)),
      db
        .select({
          id: organizations.id,
          nameFa: organizations.nameFa,
          url: organizations.url,
          roleFa: personOrganizations.roleFa,
        })
        .from(personOrganizations)
        .innerJoin(organizations, eq(personOrganizations.organizationId, organizations.id))
        .where(eq(personOrganizations.personId, hadiran.id)),
    ]);
    return { hadiran, personSkillsList, personTopicsList, personOrganizationsList };
  });
}

/** حداقل رکورد عمومیِ شخص برای صفحهٔ تماس؛ بدون بارگیری joinهای صفحهٔ معرفی. */
export function loadPublicPersonRecord() {
  return readPublic("public person contact", async () => {
    const [row] = await db.select().from(person).where(eq(person.slug, "hadiran"));
    return row ?? null;
  });
}
