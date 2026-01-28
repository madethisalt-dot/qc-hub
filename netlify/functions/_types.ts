// netlify/functions/_types.ts
export type StatusSeverity = "ok" | "info" | "warn" | "down";

export type ManualStatusItem = {
  id: string;
  title: string;
  message: string;
  severity: StatusSeverity;
  updatedAt: string;
};

export type Monitor = {
  id: string;
  name: string;
  url: string;
};

export type MonitorResult = {
  monitorId: string;
  ok: boolean;
  httpStatus?: number;
  checkedAt: string;
};

export type HubState = {
  manual: ManualStatusItem[];
  monitors: Monitor[];
  monitorResults: Record<string, MonitorResult>;
  lastAutoRun?: string;
};

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type Submission = {
  id: string;
  title: string;
  course: string;
  type: "notes" | "exam" | "study-guide" | "other";
  fileUrl: string;
  status: SubmissionStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
};
