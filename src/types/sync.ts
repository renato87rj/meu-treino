export type SyncOperation =
  | 'CREATE_PLAN'
  | 'UPDATE_PLAN'
  | 'DELETE_PLAN'
  | 'CREATE_HISTORY'
  | 'DELETE_HISTORY';

export interface SyncQueueItem {
  id: number;
  operation: SyncOperation;
  data: unknown;
  timestamp: string;
  retries: number;
}
