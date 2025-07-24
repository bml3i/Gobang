import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// For development, provide mock client if env vars are missing
let supabase

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co') {
  console.warn('⚠️ Supabase environment variables not configured. Using mock client for development.')
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  
  // Create a mock client for development
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    }),
    removeChannel: () => {}
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Game configuration from environment variables
export const gameConfig = {
  tablesCount: parseInt(import.meta.env.VITE_GAME_TABLES_COUNT) || 8,
  moveTimeoutSeconds: parseInt(import.meta.env.VITE_MOVE_TIMEOUT_SECONDS) || 10,
  idleTimeoutMinutes: parseInt(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES) || 10,
  startGameTimeoutSeconds: parseInt(import.meta.env.VITE_START_GAME_TIMEOUT_SECONDS) || 30
}