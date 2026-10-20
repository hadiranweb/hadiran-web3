export type ModuleKind = "knowledge" | "projects" | "collaborations" | "products";

export type WorkspaceItem = {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  status: string;
  detail: string;
  updated: string;
  url?: string;
  editUrl?: string;
  progress?: number;
  email?: string;
  phase?: "draft" | "review" | "published" | "archived";
  visibility?: "private" | "public";
  publicUrl?: string;
};

export type WorkspaceData = {
  source: "live" | "error";
  productCount?: number | null;
  knowledge: WorkspaceItem[];
  projects: WorkspaceItem[];
  collaborations: WorkspaceItem[];
};
