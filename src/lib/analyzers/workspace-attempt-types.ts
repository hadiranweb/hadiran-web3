export type WorkspaceAttemptAnswer = { id: string; labelFa: string; valueFa: string };
export type WorkspaceAttemptScore = { id: string; titleFa: string; valueFa: string };

export type WorkspaceAttemptRow = {
  attemptId: number;
  publicCode: string | null;
  nameFa: string;
  phone: string;
  status: "submitted" | "in_progress";
  instrumentVersion: string;
  submittedAt: string | null;
  updatedAt: string | null;
  businessName: string | null;
  scores: WorkspaceAttemptScore[];
  answers: WorkspaceAttemptAnswer[];
};
