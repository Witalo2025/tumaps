"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Verificar se o Supabase está configurado
    if (!isSupabaseConfigured() || !supabase) {
      // Se não estiver configurado, redirecionar para login
      router.push('/login')
      return
    }

    // Verificar se usuário está autenticado (com verificação adicional)
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  )
}
