import { createClient } from '@supabase/supabase-js';

const env = import.meta.env;
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error('缺少环境变量: VITE_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('缺少环境变量: VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
