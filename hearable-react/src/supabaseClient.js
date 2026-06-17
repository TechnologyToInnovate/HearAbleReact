import { createClient } from '@supabase/supabase-js'

// Vite requires us to use import.meta.env to grab our secret keys securely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This single variable 'supabase' is your new master key to the database!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)