import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Create a fresh client right here to rule out module caching issues
  const freshClient = createClient(url, key);

  const { data, error } = await freshClient
    .from('evaluations')
    .select('id, trainer_name')
    .limit(1);

  return NextResponse.json({
    envCheck: { hasUrl: !!url, hasKey: !!key, keyLength: key.length, keyPrefix: key.substring(0, 30) },
    readTest: { success: !error, data, error: error?.message },
  });
}
