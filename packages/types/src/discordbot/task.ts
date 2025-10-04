export type TaskStatus = 'draft' | 'skip' | 'pending' | 'success' | 'warn' | 'danger' | 'error';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  memo?: string;
}
