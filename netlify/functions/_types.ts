// netlify/functions/_types.ts
export type StatusSeverity = "ok" | "⚠" | "warn" | "down";

export interface StatusItem {
  id: string;
  label: string;
  url: string;
  status: StatusSeverity;
  lastChecked: string;
  message?: string;
}

export interface Submission {
  id: string;
  courseCode: string;
  courseName: string;
  type: "notes" | "exam" | "cheatsheet";
  term: string;
  professor?: string;
  fileUrl: string;
  submittedAt: string;
  approved: boolean;
}
