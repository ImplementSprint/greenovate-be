import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// --- Identity Client (for Auth validation) ---
if (!env.supabaseUrl || (!env.supabaseAnonKey && !env.supabaseServiceRoleKey)) {
  console.error('[SUPABASE] Missing Identity project configuration!', {
    url: !!env.supabaseUrl,
    anon: !!env.supabaseAnonKey,
    service: !!env.supabaseServiceRoleKey,
  });
}

const supabaseKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;
export const supabase = createClient(env.supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
console.log('[SUPABASE] Identity client initialized with URL:', env.supabaseUrl);

// --- Supply Chain Client (for Shipments, Products, Inventory) ---
if (!env.scmSupabaseUrl || !env.scmSupabaseAnonKey) {
  console.error('[SUPABASE] Missing Supply Chain project configuration!', {
    url: !!env.scmSupabaseUrl,
    anon: !!env.scmSupabaseAnonKey,
  });
}

export const supabaseSCM = createClient(env.scmSupabaseUrl, env.scmSupabaseAnonKey, {
  auth: { persistSession: false },
});
console.log('[SUPABASE] Supply Chain client initialized with URL:', env.scmSupabaseUrl);

// --- Fulfillment Client (for Shipments, Warehouse) ---
if (!env.fulfillmentSupabaseUrl || !env.fulfillmentSupabaseServiceRoleKey) {
  console.error('[SUPABASE] Missing Fulfillment project configuration!', {
    url: !!env.fulfillmentSupabaseUrl,
    service: !!env.fulfillmentSupabaseServiceRoleKey,
  });
}

const fulfillmentKey = env.fulfillmentSupabaseServiceRoleKey || env.fulfillmentSupabaseAnonKey;
export const supabaseFulfillment = createClient(env.fulfillmentSupabaseUrl, fulfillmentKey, {
  auth: { persistSession: false },
});
console.log('[SUPABASE] Fulfillment client initialized with URL:', env.fulfillmentSupabaseUrl);
