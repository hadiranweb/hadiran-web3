export type AccountRole = "owner" | "author" | "member";

export function isOwner(role: string | null | undefined): boolean {
  return role === "owner";
}

export function isStaff(role: string | null | undefined): boolean {
  return role === "owner" || role === "author";
}

export function roleFa(role: string | null | undefined): string {
  if (role === "owner") return "مدیر";
  if (role === "author") return "آزمون‌ساز";
  if (role === "member") return "عضو";
  return "مهمان";
}
