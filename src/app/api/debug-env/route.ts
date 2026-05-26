import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TEMPORARY: Remove after diagnosis
export async function GET() {
  const vars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30) + '...'
      : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 10) + '...'
      : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 10) + '...'
      : 'NOT SET',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
      ? process.env.ANTHROPIC_API_KEY.slice(0, 10) + '...'
      : 'NOT SET',
  };
  return NextResponse.json(vars);
}
