import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://hlvxzarxrwcvatnlfhub.supabase.co';
const defaultKey = 'tu-anon-key-aqui';

let rawUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
let rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

// Limpiar espacios, comillas, /rest/v1 y barras al final (/)
const cleanUrl = rawUrl
  .trim()
  .replace(/^["']|["']$/g, '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

const cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');

export const supabase = createClient(cleanUrl, cleanKey);