import { createClient } from '@supabase/supabase-js';

// Safely access environment variables
const getEnvVar = (key: string) => {
  try {
    // Check standard Vite env vars first (if available)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    // Check process.env (injected by Vite define)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors accessing env
  }
  return '';
};

let supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_KEY') || getEnvVar('SUPABASE_KEY');
let validConfig = false;

// Sanitize URL
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.trim();
  if (supabaseUrl.includes('https//') && !supabaseUrl.startsWith('https//')) {
     const match = supabaseUrl.match(/(https?:\/\/[a-zA-Z0-9.-]+)/g);
     if (match && match.length > 0) {
        supabaseUrl = match[match.length - 1]; 
     }
  }
}

// Validate Configuration
try {
  if (!supabaseUrl) throw new Error('Supabase URL not found');
  new URL(supabaseUrl); // Validation
  if (!supabaseKey) throw new Error('Supabase Key not found');
  validConfig = true;
} catch (e) {
  console.warn(`Supabase not configured ("${supabaseUrl}"). App will run in Offline/Demo mode.`);
  supabaseUrl = 'https://placeholder.supabase.co';
}

export const isSupabaseConfigured = validConfig;

// Create client (even if placeholder, to satisfy exports)
export const supabase = createClient(
  supabaseUrl, 
  supabaseKey || 'placeholder-key'
);