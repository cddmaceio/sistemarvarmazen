"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Helper function to get Supabase client
const getSupabase = (env) => {
    return (0, supabase_js_1.createClient)(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
};
exports.getSupabase = getSupabase;
