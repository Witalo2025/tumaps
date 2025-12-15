"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navigation, MapPin, AlertTriangle, Car, Zap, LogOut, User, Clock, TrendingUp, Award, Settings } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'

// Importar o mapa dinamicamente para evitar problemas de SSR
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full rounded-lg bg-[#1a1a1a] border border-purple-900/30 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  )
})

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Dados de exemplo para o mapa
  const sampleTrips = [
    {
      id: '1',
      titulo: 'Viagem Centro - Zona Sul',
      local_partida: 'Centro',
      local_destino: 'Zona Sul',
      latitude_partida: -23.5505,
      longitude_partida: -46.6333,
      latitude_destino: -23.5629,
      longitude_destino: -46.6544
    },
    {
      id: '2',
      titulo: 'Viagem Aeroporto - Centro',
      local_partida: 'Aeroporto',
      local_destino: 'Centro',
      latitude_partida: -23.4356,
      longitude_partida: -46.4731,
      latitude_destino: -23.5505,
      longitude_destino: -46.6333
    }
  ]

  useEffect(() => {
    // Verificar se o supabase está configurado ANTES de qualquer operação
    if (!supabase) {
      console.error('Supabase não está configurado')
      router.push('/login')
      return
    }

    const checkAuth = async () => {
      try {
        // Verificar autenticação
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao verificar sessão:', error)
          router.push('/login')
          return
        }

        if (session?.user) {
          setUser(session.user)
          setLoading(false)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        router.push('/login')
      }
    }

    checkAuth()

    // Escutar mudanças de autenticação - APENAS se supabase existir
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        router.push('/login')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-purple-950/20 to-[#0a0a0a] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-purple-950/20 to-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-purple-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent">
                  tumaps
                </h1>
                <p className="text-sm text-gray-400">Bem-vindo de volta!</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-purple-900/20 rounded-lg transition-all hover:scale-110">
                <Settings className="w-6 h-6 text-purple-400" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600/20 to-pink-600/20 hover:from-red-600/30 hover:to-pink-600/30 px-4 py-2 rounded-lg transition-all border border-red-500/30 hover:border-red-500/50"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <div className="relative group mb-8">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-50 blur transition-opacity"></div>
          <div className="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-full">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user?.email}</h2>
                <p className="text-purple-300">Motorista Profissional</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Award className="w-6 h-6" />
                  <span className="text-2xl font-bold">1,250</span>
                </div>
                <p className="text-sm text-purple-300">Pontos</p>
              </div>
            </div>
          </div>
        </div>

        {/* MAPA PRINCIPAL - DESTAQUE */}
        <div className="mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-50 blur transition-opacity"></div>
            <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl border border-purple-900/30 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Suas Viagens no Mapa
                </h3>
              </div>
              <MapComponent trips={sampleTrips} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
            <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl border border-purple-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-600/20 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-purple-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">342</div>
              <div className="text-sm text-purple-300">Viagens Realizadas</div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
            <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl border border-purple-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-pink-600/20 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-pink-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">127h</div>
              <div className="text-sm text-purple-300">Tempo de Navegação</div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
            <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl border border-purple-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-600/20 p-3 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-blue-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">89</div>
              <div className="text-sm text-purple-300">Alertas Enviados</div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
            <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl border border-purple-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-600/20 p-3 rounded-xl">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">4.8</div>
              <div className="text-sm text-purple-300">Avaliação Média</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Viagens Recentes */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
            <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl border border-purple-900/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Viagens Recentes</h3>
              <div className="space-y-4">
                {[
                  { from: 'Centro', to: 'Zona Sul', time: '25 min', distance: '12.5 km', status: 'completed' },
                  { from: 'Aeroporto', to: 'Centro', time: '35 min', distance: '18.2 km', status: 'completed' },
                  { from: 'Zona Norte', to: 'Shopping', time: '18 min', distance: '8.7 km', status: 'completed' },
                ].map((trip, index) => (
                  <div key={index} className="bg-[#0a0a0a]/50 backdrop-blur-sm border border-purple-900/20 rounded-xl p-4 hover:border-purple-500/40 transition-all hover:scale-[1.02]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          <span className="font-medium text-purple-200">{trip.from}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="w-4 h-4 text-pink-400" />
                          <span className="text-sm">{trip.to}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 px-3 py-1 rounded-full border border-green-500/30">
                        <span className="text-xs text-green-400 font-medium">Concluída</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-purple-300 mt-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {trip.time}
                      </span>
                      <span>•</span>
                      <span>{trip.distance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alertas Enviados */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
            <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl border border-purple-900/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Seus Alertas</h3>
              <div className="space-y-4">
                {[
                  { type: 'Acidente', location: 'Av. Principal', time: 'Há 2 horas', icon: AlertTriangle, color: 'red' },
                  { type: 'Trânsito', location: 'Rua das Flores', time: 'Há 5 horas', icon: Car, color: 'yellow' },
                  { type: 'Polícia', location: 'Rodovia BR-101', time: 'Há 1 dia', icon: Zap, color: 'blue' },
                ].map((alert, index) => {
                  const Icon = alert.icon
                  return (
                    <div key={index} className="bg-[#0a0a0a]/50 backdrop-blur-sm border border-purple-900/20 rounded-xl p-4 hover:border-purple-500/40 transition-all hover:scale-[1.02]">
                      <div className="flex items-center gap-4">
                        <div className={`bg-${alert.color}-600/20 p-3 rounded-full border border-${alert.color}-500/30`}>
                          <Icon className={`w-5 h-5 text-${alert.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-purple-200">{alert.type}</div>
                          <div className="text-sm text-purple-300">{alert.location}</div>
                        </div>
                        <div className="text-xs text-purple-400">{alert.time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="relative group bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 p-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-purple-900/50">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <Navigation className="w-8 h-8 mb-2 mx-auto relative z-10" />
            <div className="font-medium relative z-10">Nova Rota</div>
          </button>
          
          <button className="relative group bg-gradient-to-br from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 p-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-pink-900/50">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <AlertTriangle className="w-8 h-8 mb-2 mx-auto relative z-10" />
            <div className="font-medium relative z-10">Reportar</div>
          </button>
          
          <button className="relative group bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 p-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-blue-900/50">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <MapPin className="w-8 h-8 mb-2 mx-auto relative z-10" />
            <div className="font-medium relative z-10">Favoritos</div>
          </button>
          
          <button className="relative group bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 p-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-purple-900/50">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <Award className="w-8 h-8 mb-2 mx-auto relative z-10" />
            <div className="font-medium relative z-10">Conquistas</div>
          </button>
        </div>
      </main>
    </div>
  )
}
