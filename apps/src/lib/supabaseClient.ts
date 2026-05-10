import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const redirectTo = import.meta.env.PROD
  ? 'https://midjourney-prompt-generator.eu/auth/callback'
  : 'http://localhost:4321/auth/callback'

// Guard against server-side initialization — Supabase RealtimeClient requires
// native WebSocket (Node 22+). All client usage is inside useEffect/handlers,
// so null during SSR is safe; Astro re-evaluates the module in the browser.
export const supabase = typeof window !== 'undefined'
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        redirectTo
      }
    })
  : (null as any); 