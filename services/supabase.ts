import { createClient } from '@supabase/supabase-js';

// Access environment variables
// Note: In Vite, these are injected via the define config in vite.config.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Database features will fail. Please check your .env settings.');
}

// Create client with fallback values to prevent "supabaseUrl is required" error during module loading.
// This ensures the app can render even if .env is missing, though database operations will fail.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key'
);