import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const isMock = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

if (isMock) {
  console.warn('Supabase credentials missing. Cloud sync will be disabled.');
}

// Ensure the client doesn't crash the app if keys are missing
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
