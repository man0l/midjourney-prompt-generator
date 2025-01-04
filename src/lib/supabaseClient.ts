import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const redirectTo = process.env.NODE_ENV === 'production' 
  ? 'https://midjourney-generator-two.vercel.app/auth/callback'
  : 'http://localhost:3000/auth/callback'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirectTo
  }
}); 