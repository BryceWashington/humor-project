import { createClient } from '@supabase/supabase-js'

const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!process.env.SUPABASE_PROJECT_ID || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
