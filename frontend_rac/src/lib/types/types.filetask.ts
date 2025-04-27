export interface Task {
  id: number;
  created_at: string;
  user_id: string;
  name: string;
  file_id: string;
  file_name: string;
  current_snapshot_id?: number;
}
