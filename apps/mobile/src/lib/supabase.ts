// Supabase client for the app. Uses only the publishable key: what the app can
// read or write is decided by Row Level Security on the server (docs/04).
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in apps/mobile/.env',
  );
}

export const supabase = createClient(url, key);
