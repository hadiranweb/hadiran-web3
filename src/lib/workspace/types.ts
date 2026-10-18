export type ModuleKind = "knowledge" | "projects" | "collaborations" | "products";
export type WorkspaceItem = {
  id: string; title: string; titleEn?: string; category: string; status: string;
  detail: string; updated: string; url?: string; editUrl?: string;
  progress?: number; price?: string; slug?: string; body?: string; email?: string;
};
export type WorkspaceData = {
  source: "demo" | "live" | "error"; productCount?: number | null;
  knowledge: WorkspaceItem[]; projects: WorkspaceItem[]; collaborations: WorkspaceItem[];
};
