import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cxgsswbtdukrfqbbalgm.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'dummy_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
