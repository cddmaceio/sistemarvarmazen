import { createClient } from '@supabase/supabase-js';

// Environment interface
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

// Helper function to get Supabase client
export const getSupabase = (env: Env) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
};