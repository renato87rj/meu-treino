import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    console.error('Auth callback: No code parameter provided');
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // ignore
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error.message, error.status);
      const errorParam = error.status === 400 ? 'invalid_code' : 'auth_failed';
      return NextResponse.redirect(`${origin}/login?error=${errorParam}`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error('Auth callback unexpected error:', error);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
