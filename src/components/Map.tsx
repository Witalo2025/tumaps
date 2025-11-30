'use client'

import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

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

export default function MapComponent({ trips }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return

      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
      })

      try {
        const { Map } = await loader.importLibrary('maps')

        // Calculate center based on trips
        const validTrips = trips.filter(trip => trip.latitude_partida && trip.longitude_partida)
        const center: google.maps.LatLngLiteral = validTrips.length > 0
          ? { lat: validTrips[0].latitude_partida!, lng: validTrips[0].longitude_partida! }
          : { lat: -23.5505, lng: -46.6333 } // Default to São Paulo

        const mapOptions: google.maps.MapOptions = {
          center,
          zoom: 5,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#242f3e' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#242f3e' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#746855' }]
            }
          ]
        }

        const map = new Map(mapRef.current, mapOptions)
        mapInstanceRef.current = map

        // Add markers for each trip
        trips.forEach((trip) => {
          // Marker for departure
          if (trip.latitude_partida && trip.longitude_partida) {
            const departureMarker = new google.maps.Marker({
              position: { lat: trip.latitude_partida, lng: trip.longitude_partida },
              map,
              title: `${trip.titulo} - Partida`,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#8b5cf6" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="#ffffff"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
              }
            })

            const departureInfoWindow = new google.maps.InfoWindow({
              content: `
                <div style="color: black;">
                  <h3 style="font-weight: bold; margin-bottom: 8px;">${trip.titulo}</h3>
                  <p style="margin: 4px 0;"><strong>Partida:</strong> ${trip.local_partida}</p>
                </div>
              `
            })

            departureMarker.addListener('click', () => {
              departureInfoWindow.open(map, departureMarker)
            })
          }

          // Marker for destination
          if (trip.latitude_destino && trip.longitude_destino) {
            const destinationMarker = new google.maps.Marker({
              position: { lat: trip.latitude_destino, lng: trip.longitude_destino },
              map,
              title: `${trip.titulo} - Destino`,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#ec4899" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="#ffffff"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
              }
            })

            const destinationInfoWindow = new google.maps.InfoWindow({
              content: `
                <div style="color: black;">
                  <h3 style="font-weight: bold; margin-bottom: 8px;">${trip.titulo}</h3>
                  <p style="margin: 4px 0;"><strong>Destino:</strong> ${trip.local_destino}</p>
                </div>
              `
            })

            destinationMarker.addListener('click', () => {
              destinationInfoWindow.open(map, destinationMarker)
            })
          }
        })

      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()
  }, [trips])

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-purple-900/30">
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}