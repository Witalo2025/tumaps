'use client'

import { useEffect, useRef, useState } from 'react'

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

export default function MapClient({ trips }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const userLocationMarkerRef = useRef<google.maps.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)

  // Carrega a API do Google Maps de forma otimizada
  useEffect(() => {
    if (typeof window === 'undefined') return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey || apiKey === 'SUA_CHAVE_AQUI') {
      setError('configure_api_key')
      return
    }

    // Handler oficial do Google Maps para falhas de autenticação/billing
    // Este é chamado ANTES do erro aparecer no console
    ;(window as any).gm_authFailure = () => {
      console.log('🚫 Google Maps: Erro de autenticação/faturamento detectado')
      setError('billing_not_enabled')
      setIsLoaded(false)
    }

    // Listener global para capturar outros erros do Google Maps
    const handleGoogleMapsError = (event: ErrorEvent) => {
      const errorMessage = event.message || ''
      
      if (errorMessage.includes('BillingNotEnabledMapError')) {
        event.preventDefault() // Previne log no console
        event.stopPropagation()
        setError('billing_not_enabled')
        setIsLoaded(false)
        return
      }
      
      if (errorMessage.includes('ApiNotActivatedMapError')) {
        event.preventDefault()
        event.stopPropagation()
        setError('api_not_activated')
        setIsLoaded(false)
        return
      }
      
      if (errorMessage.includes('InvalidKeyMapError')) {
        event.preventDefault()
        event.stopPropagation()
        setError('invalid_key')
        setIsLoaded(false)
        return
      }
    }

    // Intercepta XMLHttpRequest para suprimir erros de rede do Google Maps
    const originalXHROpen = XMLHttpRequest.prototype.open
    const originalXHRSend = XMLHttpRequest.prototype.send

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      const urlString = url.toString()
      
      // Marca requisições do Google Maps
      if (urlString.includes('maps.googleapis.com')) {
        (this as any)._isGoogleMapsRequest = true
      }
      
      return originalXHROpen.call(this, method, url, ...args)
    }

    XMLHttpRequest.prototype.send = function(...args: any[]) {
      if ((this as any)._isGoogleMapsRequest) {
        // Suprime eventos de erro para requisições do Google Maps
        const originalOnError = this.onerror
        this.onerror = function(event) {
          // Suprime erro silenciosamente - já tratamos via gm_authFailure
          console.log('🔇 Erro de rede do Google Maps suprimido (já tratado)')
          return false
        }
        
        // Suprime eventos de timeout
        const originalOnTimeout = this.ontimeout
        this.ontimeout = function(event) {
          console.log('🔇 Timeout do Google Maps suprimido (já tratado)')
          return false
        }
      }
      
      return originalXHRSend.apply(this, args)
    }

    // Sobrescreve console.error temporariamente para suprimir erros do Google Maps
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const message = args.join(' ')
      if (message.includes('Google Maps JavaScript API error') || 
          message.includes('BillingNotEnabledMapError') ||
          message.includes('ApiNotActivatedMapError') ||
          message.includes('InvalidKeyMapError') ||
          message.includes('XMLHttpRequest failed') ||
          message.includes('maps.googleapis.com')) {
        // Suprime o erro do console - já estamos tratando na UI
        return
      }
      originalConsoleError.apply(console, args)
    }

    window.addEventListener('error', handleGoogleMapsError, true) // useCapture = true

    // Função para verificar se o Google Maps está disponível
    const checkGoogleMapsLoaded = () => {
      return typeof window !== 'undefined' && window.google?.maps !== undefined
    }

    // Se já está carregado, apenas atualiza o estado
    if (checkGoogleMapsLoaded()) {
      setIsLoaded(true)
      return () => {
        window.removeEventListener('error', handleGoogleMapsError, true)
        console.error = originalConsoleError
        XMLHttpRequest.prototype.open = originalXHROpen
        XMLHttpRequest.prototype.send = originalXHRSend
        delete (window as any).gm_authFailure
      }
    }

    // Verifica se o script já existe no DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    
    if (existingScript) {
      // Script já existe, aguarda carregar
      const checkInterval = setInterval(() => {
        if (checkGoogleMapsLoaded()) {
          setIsLoaded(true)
          clearInterval(checkInterval)
        }
      }, 100)
      
      // Timeout de segurança (10 segundos)
      const timeout = setTimeout(() => {
        clearInterval(checkInterval)
        if (!checkGoogleMapsLoaded()) {
          setError('load_error')
        }
      }, 10000)
      
      return () => {
        clearInterval(checkInterval)
        clearTimeout(timeout)
        window.removeEventListener('error', handleGoogleMapsError, true)
        console.error = originalConsoleError
        XMLHttpRequest.prototype.open = originalXHROpen
        XMLHttpRequest.prototype.send = originalXHRSend
        delete (window as any).gm_authFailure
      }
    }

    // Callback global para quando o Maps carregar
    const callbackName = 'initGoogleMaps_' + Date.now()
    
    ;(window as any)[callbackName] = () => {
      setIsLoaded(true)
      delete (window as any)[callbackName]
    }

    // Carrega o script do Google Maps
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`
    script.async = true
    script.defer = true
    
    script.onerror = () => {
      console.log('⚠️ Erro ao carregar script do Google Maps')
      setError('load_error')
      delete (window as any)[callbackName]
    }

    document.head.appendChild(script)

    // Cleanup
    return () => {
      delete (window as any)[callbackName]
      delete (window as any).gm_authFailure
      window.removeEventListener('error', handleGoogleMapsError, true)
      console.error = originalConsoleError
      XMLHttpRequest.prototype.open = originalXHROpen
      XMLHttpRequest.prototype.send = originalXHRSend
    }
  }, [])

  // Função para mostrar instruções de configuração de localização
  const openLocationSettings = () => {
    setShowInstructionsModal(true)
  }

  // Função para solicitar localização com fallback
  const requestLocation = (highAccuracy = true) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocalização não disponível neste navegador')
      setIsRequestingLocation(false)
      return
    }

    // Verifica se está em contexto seguro (HTTPS ou localhost)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    
    if (!isSecureContext) {
      setLocationError('secure_context')
      setIsRequestingLocation(false)
      return
    }

    setIsRequestingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(newLocation)
        setLocationError(null)
        setIsRequestingLocation(false)

        // Inicia o rastreamento contínuo após obter permissão
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
        }

        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const loc = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            }
            setUserLocation(loc)
          },
          (err) => {
            console.log('⚠️ Erro no rastreamento de localização')
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
          }
        )

        watchIdRef.current = watchId
      },
      (error) => {
        setIsRequestingLocation(false)

        // Se falhou com alta precisão, tenta com precisão normal
        if (highAccuracy && error.code === 3) {
          console.log('⏱️ Timeout com alta precisão, tentando com precisão normal...')
          requestLocation(false)
          return
        }

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            setLocationError('denied')
            break
          case 2: // POSITION_UNAVAILABLE
            setLocationError('unavailable')
            break
          case 3: // TIMEOUT
            setLocationError('timeout')
            break
          default:
            setLocationError('unknown')
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 15000 : 30000,
        maximumAge: highAccuracy ? 0 : 10000
      }
    )
  }

  // Solicita localização automaticamente ao carregar
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocalização não disponível neste navegador')
      return
    }

    // Solicita permissão automaticamente (sem notificação)
    requestLocation(true)

    // Cleanup: para o rastreamento quando o componente é desmontado
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  // Inicializa o mapa quando a API estiver carregada
  useEffect(() => {
    if (!isLoaded || !mapRef.current || typeof window === 'undefined' || !window.google?.maps) return

    const validTrips = trips.filter(trip => trip.latitude_partida && trip.longitude_partida)
    
    // Centro padrão (São Paulo) ou localização do usuário
    const defaultCenter = userLocation || { lat: -23.5505, lng: -46.6333 }
    const center = validTrips.length > 0
      ? { lat: validTrips[0].latitude_partida!, lng: validTrips[0].longitude_partida! }
      : defaultCenter

    try {
      // Cria o mapa com estilo escuro roxo/preto
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: userLocation ? 15 : 5,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8b5cf6" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#a78bfa" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#7c3aed" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#1a1a1a" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b21a8" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#1a1a1a" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#2d1b4e" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#8b5cf6" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#2d1b4e" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#4c1d95" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#a78bfa" }],
          },
          {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#1a1a1a" }],
          },
          {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#7c3aed" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#1a0a2e" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b21a8" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#0a0a0a" }],
          },
        ],
      })

      googleMapRef.current = map

      // Limpa marcadores antigos
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []

      // Adiciona marcadores para cada viagem
      const bounds = new google.maps.LatLngBounds()
      let hasValidLocation = false

      trips.forEach((trip) => {
        // Marcador de partida (roxo)
        if (trip.latitude_partida && trip.longitude_partida) {
          const departureMarker = new google.maps.Marker({
            position: { lat: trip.latitude_partida, lng: trip.longitude_partida },
            map,
            title: `${trip.titulo} - Partida`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#8b5cf6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          })

          const departureInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="color: #0a0a0a; padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 8px;">${trip.titulo}</h3>
                <p style="font-size: 14px;">
                  <strong>Partida:</strong> ${trip.local_partida}
                </p>
              </div>
            `,
          })

          departureMarker.addListener('click', () => {
            departureInfoWindow.open(map, departureMarker)
          })

          markersRef.current.push(departureMarker)
          bounds.extend({ lat: trip.latitude_partida, lng: trip.longitude_partida })
          hasValidLocation = true
        }

        // Marcador de destino (rosa)
        if (trip.latitude_destino && trip.longitude_destino) {
          const destinationMarker = new google.maps.Marker({
            position: { lat: trip.latitude_destino, lng: trip.longitude_destino },
            map,
            title: `${trip.titulo} - Destino`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#ec4899',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          })

          const destinationInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="color: #0a0a0a; padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 8px;">${trip.titulo}</h3>
                <p style="font-size: 14px;">
                  <strong>Destino:</strong> ${trip.local_destino}
                </p>
              </div>
            `,
          })

          destinationMarker.addListener('click', () => {
            destinationInfoWindow.open(map, destinationMarker)
          })

          markersRef.current.push(destinationMarker)
          bounds.extend({ lat: trip.latitude_destino, lng: trip.longitude_destino })
          hasValidLocation = true
        }
      })

      // Ajusta o zoom para mostrar todos os marcadores
      if (hasValidLocation && !userLocation) {
        map.fitBounds(bounds)
        
        // Previne zoom excessivo quando há apenas um marcador
        const listener = google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom()! > 15) map.setZoom(15)
          google.maps.event.removeListener(listener)
        })
      }
    } catch (err) {
      console.log('⚠️ Erro ao inicializar mapa')
      setError('map_init_error')
    }

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }
  }, [isLoaded, trips, userLocation])

  // Atualiza marcador de localização do usuário em tempo real
  useEffect(() => {
    if (!googleMapRef.current || !userLocation || typeof window === 'undefined' || !window.google?.maps) return

    // Remove marcador anterior se existir
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null)
    }

    // Cria novo marcador para localização do usuário (azul pulsante)
    const userMarker = new google.maps.Marker({
      position: userLocation,
      map: googleMapRef.current,
      title: 'Sua Localização',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      animation: google.maps.Animation.DROP,
    })

    // Adiciona círculo de precisão ao redor do marcador
    const accuracyCircle = new google.maps.Circle({
      map: googleMapRef.current,
      center: userLocation,
      radius: 50, // 50 metros de raio
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.3,
      strokeWeight: 1,
    })

    const userInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="color: #0a0a0a; padding: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 8px;">📍 Você está aqui</h3>
          <p style="font-size: 12px; color: #666;">
            Lat: ${userLocation.lat.toFixed(6)}<br/>
            Lng: ${userLocation.lng.toFixed(6)}
          </p>
        </div>
      `,
    })

    userMarker.addListener('click', () => {
      userInfoWindow.open(googleMapRef.current!, userMarker)
    })

    userLocationMarkerRef.current = userMarker

    // Centraliza mapa na localização do usuário (apenas na primeira vez)
    if (googleMapRef.current.getZoom()! < 13) {
      googleMapRef.current.setCenter(userLocation)
      googleMapRef.current.setZoom(15)
    } else {
      // Apenas atualiza a posição suavemente
      googleMapRef.current.panTo(userLocation)
    }

    // Cleanup
    return () => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null)
      }
      accuracyCircle.setMap(null)
    }
  }, [userLocation])

  // Renderiza mensagens de erro específicas
  if (error) {
    const errorMessages = {
      configure_api_key: {
        title: '⚠️ Configure sua chave da API do Google Maps',
        steps: [
          '📝 Abra o arquivo .env.local na raiz do projeto',
          '🔑 Adicione: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui',
          '🌐 Obtenha sua chave em: console.cloud.google.com/google/maps-apis',
          '💳 Habilite o faturamento no Google Cloud Console',
          '🔄 Reinicie o servidor de desenvolvimento'
        ]
      },
      billing_not_enabled: {
        title: '💳 Faturamento não habilitado no Google Cloud',
        steps: [
          '🌐 Acesse: console.cloud.google.com/billing',
          '💳 Vincule uma conta de faturamento ao seu projeto',
          '✅ Habilite a API do Google Maps JavaScript',
          '⏱️ Aguarde alguns minutos para a ativação',
          '🔄 Recarregue esta página'
        ]
      },
      api_not_activated: {
        title: '🔌 API do Google Maps não está ativada',
        steps: [
          '🌐 Acesse: console.cloud.google.com/apis/library',
          '🔍 Procure por "Maps JavaScript API"',
          '✅ Clique em "Ativar"',
          '⏱️ Aguarde alguns minutos para a ativação',
          '🔄 Recarregue esta página'
        ]
      },
      invalid_key: {
        title: '🔑 Chave da API inválida',
        steps: [
          '🌐 Acesse: console.cloud.google.com/apis/credentials',
          '🔑 Verifique se a chave está correta',
          '✅ Confirme que a chave tem permissões para Maps JavaScript API',
          '📝 Atualize o arquivo .env.local com a chave correta',
          '🔄 Reinicie o servidor de desenvolvimento'
        ]
      },
      load_error: {
        title: '❌ Erro ao carregar Google Maps',
        steps: [
          '🔑 Verifique se sua chave da API está correta',
          '✅ Confirme que a API JavaScript do Google Maps está habilitada',
          '🌐 Verifique sua conexão com a internet',
          '🔄 Tente recarregar a página'
        ]
      },
      map_init_error: {
        title: '⚠️ Erro ao inicializar o mapa',
        steps: [
          '🔄 Tente recarregar a página',
          '🔑 Verifique suas credenciais do Google Maps',
          '💳 Confirme que o faturamento está ativo',
          '📧 Contate o suporte se o problema persistir'
        ]
      }
    }

    const errorInfo = errorMessages[error as keyof typeof errorMessages] || errorMessages.load_error

    return (
      <div className="h-96 w-full rounded-lg overflow-hidden border border-red-900/30 bg-gradient-to-br from-red-950/20 to-black/50 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-2xl">
          <p className="text-red-400 text-lg font-semibold">{errorInfo.title}</p>
          <div className="text-sm text-red-300/70 space-y-2 text-left">
            {errorInfo.steps.map((step, index) => (
              <p key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0">{step.split(' ')[0]}</span>
                <span>{step.substring(step.indexOf(' ') + 1)}</span>
              </p>
            ))}
          </div>
          {(error === 'billing_not_enabled' || error === 'api_not_activated') && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚡ O Google Maps requer uma conta de faturamento ativa, mesmo para uso gratuito.
                Você tem $200 de crédito mensal grátis!
              </p>
            </div>
          )}
          <div className="mt-6">
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              🌐 Abrir Google Cloud Console
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-96 w-full rounded-lg overflow-hidden border border-purple-900/30 bg-black/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-purple-300">Carregando Google Maps...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="h-96 w-full rounded-lg overflow-hidden border border-purple-900/30"
        style={{ minHeight: '384px' }}
      />
      
      {/* Modal de instruções de configuração */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowInstructionsModal(false)}>
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/50 rounded-2xl p-8 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                Como permitir localização
              </h2>
              <button 
                onClick={() => setShowInstructionsModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6 text-gray-200">
              {/* Chrome/Edge */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 text-blue-300 flex items-center gap-2">
                  🌐 Chrome / Edge / Brave
                </h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="font-bold">1.</span> Clique no ícone <strong>🔒</strong> ao lado da URL (barra de endereço)</li>
                  <li className="flex gap-2"><span className="font-bold">2.</span> Encontre a opção <strong>"Localização"</strong></li>
                  <li className="flex gap-2"><span className="font-bold">3.</span> Selecione <strong>"Permitir"</strong></li>
                  <li className="flex gap-2"><span className="font-bold">4.</span> Recarregue a página (F5)</li>
                </ol>
              </div>

              {/* Firefox */}
              <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 text-orange-300 flex items-center gap-2">
                  🦊 Firefox
                </h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="font-bold">1.</span> Clique no ícone <strong>🔒</strong> ao lado da URL</li>
                  <li className="flex gap-2"><span className="font-bold">2.</span> Clique em <strong>"Mais informações"</strong></li>
                  <li className="flex gap-2"><span className="font-bold">3.</span> Vá em <strong>"Permissões"</strong> → <strong>"Localização"</strong></li>
                  <li className="flex gap-2"><span className="font-bold">4.</span> Desmarque <strong>"Usar padrão"</strong> e selecione <strong>"Permitir"</strong></li>
                  <li className="flex gap-2"><span className="font-bold">5.</span> Recarregue a página (F5)</li>
                </ol>
              </div>

              {/* Safari */}
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 text-purple-300 flex items-center gap-2">
                  🧭 Safari (Mac)
                </h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="font-bold">1.</span> Vá em <strong>Safari</strong> → <strong>Preferências</strong></li>
                  <li className="flex gap-2"><span className="font-bold">2.</span> Clique em <strong>"Sites"</strong></li>
                  <li className="flex gap-2"><span className="font-bold">3.</span> Selecione <strong>"Localização"</strong> na barra lateral</li>
                  <li className="flex gap-2"><span className="font-bold">4.</span> Encontre este site e selecione <strong>"Permitir"</strong></li>
                  <li className="flex gap-2"><span className="font-bold">5.</span> Recarregue a página (⌘R)</li>
                </ol>
              </div>

              {/* Mobile */}
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-5">
                <h3 className="font-bold text-lg mb-3 text-green-300 flex items-center gap-2">
                  📱 Android / iOS
                </h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="font-bold">1.</span> Vá em <strong>Configurações</strong> do dispositivo</li>
                  <li className="flex gap-2"><span className="font-bold">2.</span> Procure por <strong>"Localização"</strong> ou <strong>"GPS"</strong></li>
                  <li className="flex gap-2"><span className="font-bold">3.</span> Ative a <strong>Localização</strong></li>
                  <li className="flex gap-2"><span className="font-bold">4.</span> Encontre o navegador (Chrome/Safari) nas permissões</li>
                  <li className="flex gap-2"><span className="font-bold">5.</span> Permita acesso à localização</li>
                  <li className="flex gap-2"><span className="font-bold">6.</span> Volte ao site e recarregue</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowInstructionsModal(false)
                  window.location.reload()
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                🔄 Recarregar página
              </button>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Indicador de status de localização - quando está funcionando */}
      {!locationError && userLocation && (
        <div className="absolute top-4 left-4 bg-blue-900/90 text-blue-200 px-4 py-2 rounded-lg text-sm shadow-lg border border-blue-700/50 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          Localização em tempo real ativa
        </div>
      )}

      {/* Indicador de carregamento inicial */}
      {!locationError && !userLocation && (
        <div className="absolute top-4 left-4 bg-purple-900/90 text-purple-200 px-4 py-2 rounded-lg text-sm shadow-lg border border-purple-700/50">
          📍 Obtendo sua localização...
        </div>
      )}
    </div>
  )
}
