export interface SnapshotReport {
  editable: Record<string, any>;
  sorted_by?: {
    stakeholders?: Record<string, any>;
    competency?: Record<string, any>;
  };
}

export interface Snapshot {
  id: number;
  task_id: number;
  created_at: string;
  parent_id?: number | null;
  trigger_type: string;
  manual_report: SnapshotReport;
  full_report: SnapshotReport;
  ai_Competencies: SnapshotReport;
}

export interface SnapshotCreateRequest {
  file_id: string;
  manual_report: SnapshotReport;
  full_report: SnapshotReport;
  ai_Competencies: SnapshotReport;
  trigger_type?: string;
  parent_id?: number | null;
}
