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
        // Manual PKCE exchange happens in /auth/callback. Leaving detection on
        // lets whichever island initializes first strip GoTrue's error params
        // from the URL before the recovery code on the page reads them.
        detectSessionInUrl: false,
        flowType: 'pkce',
        redirectTo
      }
    })
  : (null as any); 