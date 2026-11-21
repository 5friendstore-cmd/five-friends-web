import { SUPABASE_CONFIG } from './config.js';

let supabaseClient = null;

try {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
  }
} catch (error) {
  console.error("Error inicializando Supabase:", error);
}

export { supabaseClient };
