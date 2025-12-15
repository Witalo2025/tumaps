import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Criar cliente apenas se as credenciais estiverem configuradas
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(
      supabaseUrl, 
      supabaseAnonKey, 
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'tumaps-auth-token',
          debug: process.env.NODE_ENV === 'development'
        },
        global: {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        },
        db: {
          schema: 'public'
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    )
  : null
