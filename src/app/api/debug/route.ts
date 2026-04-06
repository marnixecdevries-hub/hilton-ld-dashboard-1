import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Test a simple read
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, trainer_name')
    .limit(1);

  // Test an insert
  const { data: insertData, error: insertError } = await supabase
    .from('evaluations')
    .insert({
      trainer_name: 'API Test',
      trainer_department: 'Test',
      hotel_code: 'AMSAP',
      manager_name: 'Test',
      manager_department: 'Test',
      evaluation_date: '2026-03-27',
      score_work_area: 3, score_appearance: 3, score_body_language: 3,
      score_voice: 3, score_attention: 3, score_preparation: 3,
      score_demonstration: 3, score_practice: 3, score_follow_through: 3,
      score_question_techniques: 3,
      avg_presentation: 3, avg_delivery: 3, avg_coaching: 3, avg_overall: 3,
      strengths: 'test', development_areas: 'test',
    })
    .select('id')
    .single();

  return NextResponse.json({
    envCheck: { hasUrl: !!url, hasKey: !!key, keyLength: key.length },
    readTest: { success: !error, data, error: error?.message },
    insertTest: { success: !insertError, data: insertData, error: insertError?.message, code: insertError?.code },
  });
}
