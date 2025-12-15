'use client'

import MapClient from './MapClient'

interface Trip {
  id: string
  titulo: string
  local_partida: string
  local_destino: string
  latitude_partida?: number
  longitude_partida?: number
  latitude_destino?: number
  longitude_destino?: number
}

interface MapProps {
  trips: Trip[]
}

export default function Map({ trips }: MapProps) {
  return <MapClient trips={trips} />
}
