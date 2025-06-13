import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createBrowserClient, type SupabaseClient } from '@supabase/supabase-js'

let anonClient: SupabaseClient | undefined
function createAnonClient() {
  if (anonClient) {
    return anonClient
  }
  anonClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return anonClient
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export { createAnonClient }

export function createAdminClient() {
  if (!process.env.NEXT_SERVICE_ROLE_SUPABASE_KEY) {
    throw new Error('NEXT_SERVICE_ROLE_SUPABASE_KEY is not set.')
  }
  // This client is privileged and should only be used on the server.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SERVICE_ROLE_SUPABASE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
