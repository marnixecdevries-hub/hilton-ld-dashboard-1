'use server';

import { getSupabase } from './supabase';
import { ParsedEvaluation } from '@/types';
import { computeAverages } from './utils';

export async function submitEvaluation(data: ParsedEvaluation) {
  const averages = computeAverages(data);

  const record = {
    ...data,
    ...averages,
    notes_work_area: data.notes_work_area || null,
    notes_appearance: data.notes_appearance || null,
    notes_body_language: data.notes_body_language || null,
    notes_voice: data.notes_voice || null,
    notes_attention: data.notes_attention || null,
    notes_preparation: data.notes_preparation || null,
    notes_demonstration: data.notes_demonstration || null,
    notes_practice: data.notes_practice || null,
    notes_follow_through: data.notes_follow_through || null,
    notes_question_techniques: data.notes_question_techniques || null,
  };

  const { data: result, error } = await getSupabase()
    .from('evaluations')
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    console.error('Supabase URL loaded:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error('Supabase Key loaded:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    return { success: false, error: error.message };
  }

  return { success: true, data: result };
}

export async function submitMultipleEvaluations(evaluations: ParsedEvaluation[]) {
  const results = [];
  const errors = [];

  for (const data of evaluations) {
    const result = await submitEvaluation(data);
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push(result.error);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: `${errors.length} evaluation(s) failed to upload: ${errors.join('; ')}` };
  }

  return { success: true, count: results.length };
}
