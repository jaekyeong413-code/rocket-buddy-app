import { supabase } from '@/lib/supabaseClient';
import type { RecordWithMeta, WorkRecord, DeliveryData, ReturnsData, FreshBagData } from '@/types';

type RecordRow = {
  id: string;
  date: string;
  route: '203D' | '206A';
  round: 1 | 2;
  delivery: DeliveryData;
  returns: ReturnsData;
  fresh_bag: FreshBagData;
  schema_version: number;
  updated_at: string;
  synced_at: string | null;
  created_at: string;
};

function mapRowToRecord(row: RecordRow): RecordWithMeta {
  return {
    id: row.id,
    date: row.date,
    route: row.route,
    round: row.round,
    delivery: row.delivery,
    returns: row.returns,
    freshBag: row.fresh_bag,
    schemaVersion: row.schema_version ?? 1,
    updatedAt: row.updated_at ?? row.created_at,
    syncedAt: row.synced_at ?? null,
  };
}

export async function fetchAllRecordsRemote(): Promise<RecordWithMeta[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRowToRecord(row as RecordRow));
}

export async function fetchRecordsByPeriodRemote(
  startDate: string,
  endDate: string
): Promise<RecordWithMeta[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRowToRecord(row as RecordRow));
}

export async function upsertRecordRemote(record: WorkRecord & Partial<RecordWithMeta>): Promise<RecordWithMeta | null> {
  const now = new Date().toISOString();
  const payload = {
    id: record.id,
    date: record.date,
    route: record.route,
    round: record.round,
    delivery: record.delivery,
    returns: record.returns,
    fresh_bag: record.freshBag,
    schema_version: record.schemaVersion ?? 1,
    updated_at: record.updatedAt ?? now,
    synced_at: now,
  };

  const { data, error } = await supabase
    .from('records')
    .upsert(payload, { onConflict: 'date,route,round' })
    .select('*')
    .single();

  if (error) throw error;
  return data ? mapRowToRecord(data as RecordRow) : null;
}

export async function deleteRecordRemote(id: string): Promise<void> {
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
