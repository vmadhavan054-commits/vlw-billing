import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mzdsntzbrfazsulqbwyx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16ZHNudHpicmZhenN1bHFid3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDkxNDAsImV4cCI6MjEwMzk4NTE0MH0.G4R3hLwL2DwV8XYuJETq5yL-PRFF-vMKexHMtzYT-Hs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
