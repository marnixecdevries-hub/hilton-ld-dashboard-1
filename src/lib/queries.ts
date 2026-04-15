import { getSupabase } from './supabase';
import { Evaluation } from '@/types';

export async function getRecentEvaluations(limit = 10): Promise<Evaluation[]> {
  const { data, error } = await getSupabase()
    .from('evaluations')
    .select('*')
    .order('evaluation_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function insertEvaluation(evaluation: Omit<Evaluation, 'id' | 'created_at'>): Promise<Evaluation> {
  const { data, error } = await getSupabase()
    .from('evaluations')
    .insert(evaluation)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDepartments(): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('evaluations')
    .select('trainer_department');
  if (error) throw error;
  const departments = [...new Set((data || []).map(d => d.trainer_department))];
  return departments.sort();
}
