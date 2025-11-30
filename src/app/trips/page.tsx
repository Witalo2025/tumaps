"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navigation, Plus, MapPin, Clock, Calendar, ArrowRight, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

interface Trip {
  id: string
  titulo: string
  descricao: string
  data_inicio: string
  data_termino: string
  local_partida: string
  local_destino: string
  user_id: string
  latitude_partida?: number
  longitude_partida?: number
  latitude_destino?: number
  longitude_destino?: number
}

export default function TripsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'cancelled'>('all')

  useEffect(() => {
    checkAuth()
    loadTrips()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)
  }

  const loadTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
      
      if (error) throw error
      
      setTrips(data || [])
    } catch (error) {
      console.error('Erro ao carregar viagens:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTrips = trips.filter(trip => {
    // Por enquanto sem filtro, já que não há status
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-purple-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Minhas Viagens
                </h1>
                <p className="text-sm text-gray-400">Histórico completo das suas rotas</p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/trips/new')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Viagem
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Map Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Mapa das Viagens</h2>
          <Map trips={filteredTrips} />
        </div>

        {/* Lista de Viagens */}
        <div className="grid gap-4">
          {filteredTrips.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-purple-900/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Navigation className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhuma viagem encontrada</h3>
                <p className="text-gray-500 text-center mb-6">
                  Você ainda não realizou nenhuma viagem.
                </p>
                <Button
                  onClick={() => router.push('/trips/new')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Viagem
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTrips.map((trip) => (
              <Card key={trip.id} className="bg-[#1a1a1a] border-purple-900/30 hover:border-purple-500/40 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-purple-600/20 p-3 rounded-full">
                        <MapPin className="w-6 h-6 text-purple-400" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{trip.titulo}</h3>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <span className="font-medium">{trip.local_partida}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-pink-400" />
                            <span className="font-medium">{trip.local_destino}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {trip.data_inicio} - {trip.data_termino}
                          </span>
                        </div>
                        {trip.descricao && (
                          <p className="text-sm text-gray-500 mt-2">{trip.descricao}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" className="border-purple-500/30 hover:border-purple-500/50">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}