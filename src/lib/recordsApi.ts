/**
 * Remote Records API (Stub - Local Only Mode)
 * Backend sync is disabled. All functions return local-only fallbacks.
 */
import type { RecordWithMeta, WorkRecord } from '@/types';

export async function fetchAllRecordsRemote(): Promise<RecordWithMeta[]> {
  // Local-only mode: no remote fetch
  return [];
}

export async function fetchRecordsByPeriodRemote(
  _startDate: string,
  _endDate: string
): Promise<RecordWithMeta[]> {
  // Local-only mode: no remote fetch
  return [];
}

export async function upsertRecordRemote(
  _record: WorkRecord & Partial<RecordWithMeta>
): Promise<RecordWithMeta | null> {
  // Local-only mode: no remote sync
  return null;
}

export async function deleteRecordRemote(_id: string): Promise<void> {
  // Local-only mode: no remote delete
}
