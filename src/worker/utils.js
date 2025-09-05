import { createClient } from '@supabase/supabase-js';
// Helper function to get Supabase client
export const getSupabase = (env) => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
};
