import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://hlvxzarxrwcvatnlfhub.supabase.co';
const defaultKey = 'placeholder-key';

// Limpiar espacios y comillas accidentales
const cleanUrl = (import.meta.env.VITE_SUPABASE_URL || defaultUrl).trim().replace(/^["']|["']$/g, '');
const cleanKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey).trim().replace(/^["']|["']$/g, '');

export const supabase = createClient(cleanUrl, cleanKey);