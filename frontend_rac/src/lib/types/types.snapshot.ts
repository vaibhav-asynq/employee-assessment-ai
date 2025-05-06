import { TemplatedData } from "./types.analysis";

export interface SnapshotReport {
  editable: TemplatedData;
  sorted_by?: {
    stakeholders?: Record<string, any>;
    competency?: Record<string, any>;
  };
}

export type SnapshotReportWithMisc = SnapshotReport & {
  selectedPath?: `${string}.${string}`;
};

export interface Snapshot {
  id: number;
  snapshot_name?: string;
  task_id: number;
  created_at: string;
  parent_id?: number | null;
  trigger_type: string;
  manual_report: SnapshotReportWithMisc;
  full_report: SnapshotReport;
  ai_Competencies: SnapshotReport;
}

export interface SnapshotCreateRequest {
  file_id: string;
  snapshot_name?: string;
  manual_report: SnapshotReportWithMisc;
  full_report: SnapshotReport;
  ai_Competencies: SnapshotReport;
  trigger_type?: string;
  parent_id?: number | null;
}
