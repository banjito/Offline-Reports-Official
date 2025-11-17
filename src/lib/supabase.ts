import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for the desktop app
 * This connects to the same database as the web app
 */

// In Electron, we need to load environment variables differently
// These will be passed from the main process
let supabaseUrl: string;
let supabaseAnonKey: string;
let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize the Supabase client with credentials
 * This should be called from the renderer process after receiving credentials from main process
 */
export function initializeSupabase(url: string, anonKey: string): SupabaseClient {
  supabaseUrl = url;
  supabaseAnonKey = anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  console.log('Supabase client initialized for desktop app');
  return supabaseClient;
}

/**
 * Get the initialized Supabase client
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initializeSupabase first.');
  }
  return supabaseClient;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const client = getSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

/**
 * Helper to check for connection errors
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  const connectionErrorPatterns = [
    'connection refused',
    'network error',
    'timeout',
    'socket hang up',
    'ECONNREFUSED',
    'fetch failed',
    'Failed to fetch',
  ];
  
  const errorMessage = typeof error.message === 'string' 
    ? error.message.toLowerCase() 
    : typeof error === 'string' 
      ? error.toLowerCase() 
      : JSON.stringify(error).toLowerCase();
  
  return connectionErrorPatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
}

