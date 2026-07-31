import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  MapPin, 
  Signal, 
  Battery, 
  Activity, 
  Flame, 
  Settings,
  ShieldAlert
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Vehicle } from '../types';
import { cn } from '../lib/utils';
import { mockVehicles } from '../lib/mockData';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

// Retrieve Google Maps API Key safely
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Deck.gl overlay bridge element
interface DeckGlOverlayProps {
  layers: any[];
}

function DeckGlOverlay({ layers }: DeckGlOverlayProps) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const overlay = new GoogleMapsOverlay({ layers });
    overlay.setMap(map);
    return () => {
      overlay.setMap(null);
    };
  }, [map, layers]);
  return null;
}

// Generate realistic São Paulo coordinates for each vehicle naturally distributed
const getVehicleCoords = (v: Vehicle, index: number) => {
  const hubs = [
    { lat: -23.5614, lng: -46.6559 }, // Av Paulista
    { lat: -23.6086, lng: -46.6971 }, // Marginal Berrini
    { lat: -23.6273, lng: -46.6565 }, // Congonhas Airfield
    { lat: -23.5505, lng: -46.6333 }, // Praça da Sé
    { lat: -23.5874, lng: -46.6576 }, // Parque Ibirapuera
    { lat: -23.5512, lng: -46.6872 }, // Vila Madalena
  ];
  const hub = hubs[index % hubs.length];
  // Natural separation offsets
  const offsetLat = ((index * 0.0075) % 0.016) - 0.008;
  const offsetLng = ((index * 0.0095) % 0.019) - 0.009;
  return {
    lat: hub.lat + offsetLat,
    lng: hub.lng + offsetLng
  };
};

export function Tracking() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Heatmap configuration parameters
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapRadius, setHeatmapRadius] = useState<number>(45);
  const [heatmapIntensity, setHeatmapIntensity] = useState<number>(2.0);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.75);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  useEffect(() => {
    const isDemo = localStorage.getItem('efraim_demo_session') === 'true';
    if (isDemo) {
      setVehicles(mockVehicles);
      return;
    }

    if (!auth.currentUser) return;
    const q = query(collection(db, 'vehicles'), where('ownerId', '==', auth.currentUser.uid));
    return onSnapshot(q, (s) => {
      const dbVehicles = s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle));
      setVehicles(dbVehicles.length > 0 ? dbVehicles : mockVehicles);
    });
  }, []);

  const rentedVehicles = vehicles.filter(v => v.status === 'rented');

  // Find coordinates for currently selected vehicle
  const selectedVehicleDetails = useMemo(() => {
    if (!selectedVehicle) return null;
    const veh = rentedVehicles.find(v => v.id === selectedVehicle);
    if (!veh) return null;
    const idx = rentedVehicles.indexOf(veh);
    return {
      vehicle: veh,
      coords: getVehicleCoords(veh, idx)
    };
  }, [selectedVehicle, rentedVehicles]);

  // Dynamic simulation of raw coordinates for the deck.gl heatmap overlay layers
  const heatmapData = useMemo(() => {
    const points: { COORDS: [number, number]; weight: number }[] = [];

    // 1. Vehicle active trails (spiral trail offset positions)
    rentedVehicles.forEach((v, index) => {
      const currentLoc = getVehicleCoords(v, index);
      points.push({ COORDS: [currentLoc.lng, currentLoc.lat], weight: 4 });

      // Build out circular historical positions
      for (let j = 1; j <= 8; j++) {
        const angle = (j * Math.PI) / 4;
        const distance = 0.0035 * j;
        const trailLat = currentLoc.lat + Math.sin(angle) * distance;
        const trailLng = currentLoc.lng + Math.cos(angle) * distance;
        points.push({
          COORDS: [trailLng, trailLat],
          weight: Math.max(1, 5 - Math.floor(j / 2))
        });
      }
    });

    // 2. High-circulation logistics hubs within SP
    const hubs = [
      { lat: -23.5614, lng: -46.6559, weight: 15, count: 25 }, // Av Paulista
      { lat: -23.6273, lng: -46.6565, weight: 18, count: 30 }, // Congonhas Airport
      { lat: -23.6086, lng: -46.6971, weight: 12, count: 20 }, // Marginal Pinheiros
      { lat: -23.4322, lng: -46.4692, weight: 24, count: 40 }, // Guarulhos Area
      { lat: -23.5505, lng: -46.6333, weight: 10, count: 15 }  // Centro
    ];

    hubs.forEach(h => {
      for (let c = 0; c < h.count; c++) {
        const rad = 0.012 * Math.random();
        const ang = Math.random() * Math.PI * 2;
        points.push({
          COORDS: [
            h.lng + Math.cos(ang) * rad,
            h.lat + Math.sin(ang) * rad
          ],
          weight: Math.floor(Math.random() * h.weight) + 2
        });
      }
    });

    return points;
  }, [rentedVehicles]);

  // Construct deck.gl Heatmap layer safely
  const overlayLayers = useMemo(() => {
    if (!showHeatmap || heatmapData.length === 0) return [];

    return [
      new HeatmapLayer({
        id: 'fleet-heatmap',
        data: heatmapData,
        getPosition: (d: any) => d.COORDS,
        getWeight: (d: any) => d.weight,
        radiusPixels: heatmapRadius,
        intensity: heatmapIntensity,
        threshold: 0.02,
        opacity: heatmapOpacity,
        colorRange: [
          [240, 249, 232],
          [186, 228, 188],
          [123, 204, 196],
          [67, 162, 202],
          [8, 104, 172]
        ]
      })
    ];
  }, [showHeatmap, heatmapData, heatmapRadius, heatmapIntensity, heatmapOpacity]);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="font-display text-[26px] font-bold tracking-tight mb-1">Rastreamento</h2>
          <p className="text-subtle text-[13px]">Geolocalização em tempo real e mapa de calor da circulação da frota</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* Map visual panel boundaries */}
        <div className="flex-1 panel relative overflow-hidden bg-bg/20 flex flex-col h-full border border-line">
          
          {!hasValidKey ? (
            /* Visual key registration instruction placeholder inside the map box container */
            <div className="flex-1 p-6 md:p-12 text-center flex flex-col items-center justify-center bg-bg/5 h-full overflow-y-auto">
              <div className="max-w-md w-full p-8 bg-surface border border-line rounded-[24px] shadow-sm space-y-6">
                <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <MapPin size={26} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-medium text-ink uppercase tracking-tight">Ativar Rastreamento Google Maps</h3>
                  <p className="text-xs text-subtle leading-relaxed">
                    Exiba em tempo real a rota circulatória dos motoristas e o <strong>mapa de calor de circulação</strong> configurando a chave de API correta.
                  </p>
                </div>
                
                <div className="text-left bg-bg p-4 rounded-xl border border-line space-y-3">
                   <p className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-line pb-1.5">
                     <Settings size={12} className="text-accent animate-spin duration-5000" /> Como configurar:
                   </p>
                   <ol className="text-[10.5px] text-subtle space-y-2 list-decimal list-inside leading-relaxed">
                     <li>Obtenha uma chave Google Maps: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-accent underline font-semibold">Iniciar Console</a></li>
                     <li>Abra as <strong>Configurações</strong> do AI Studio (ícone de engrenagem ⚙️ no topo direito)</li>
                     <li>Selecione a guia de <strong>Secrets</strong> (Segredos de ambiente)</li>
                     <li>Insira o segredo de nome <code>GOOGLE_MAPS_PLATFORM_KEY</code> colando o valor gerado.</li>
                   </ol>
                </div>
                
                <p className="text-[10px] text-danger/90 font-bold bg-danger/5 py-2 px-4 rounded-lg border border-danger/10">
                  O painel reiniciará automaticamente após salvar!
                </p>
              </div>
            </div>
          ) : (
            /* Interactive Live Map */
            <APIProvider apiKey={API_KEY} version="weekly">
              <div className="absolute inset-0 w-full h-full">
                <Map
                  defaultCenter={{ lat: -23.56, lng: -46.65 }}
                  defaultZoom={11.5}
                  mapId="EFRAIM_LIVE_METRICS_MAP"
                  mapTypeControl={false}
                  streetViewControl={false}
                  fullscreenControl={false}
                  zoomControl={true}
                  mapTypeId={mapType}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Heatmap implementation bridge */}
                  {showHeatmap && <DeckGlOverlay layers={overlayLayers} />}

                  {/* Vehicle markers with labels */}
                  {rentedVehicles.map((v, i) => {
                    const coords = getVehicleCoords(v, i);
                    return (
                      <AdvancedMarker
                        key={v.id}
                        position={coords}
                        title={`${v.model} - ${v.plate}`}
                        onClick={() => setSelectedVehicle(v.id)}
                      >
                        {/* Custom marker dimensions restriction for CF3 */}
                        <div style={{ width: '40px', height: '40px' }} className="relative flex items-center justify-center cursor-pointer">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl border-2 transition-all hover:scale-110",
                            selectedVehicle === v.id 
                              ? "bg-accent border-white ring-4 ring-accent/30 scale-125 z-20" 
                              : "bg-blue-600 border-white z-10"
                          )}>
                            <CarIcon size={18} />
                          </div>
                          
                          <div className={cn(
                            "absolute top-11 bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded border shadow-sm border-line whitespace-nowrap z-30 transition-opacity pointer-events-none",
                            selectedVehicle === v.id ? "opacity-100" : "opacity-85"
                          )}>
                            <p className="text-[9px] font-bold font-mono text-ink leading-tight">{v.plate}</p>
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}
                </Map>

                {/* Heatmap density parameters card controls */}
                <div className="absolute left-4 top-4 bg-surface/95 backdrop-blur-md p-4 rounded-xl border border-line shadow-2xl max-w-sm w-72 pointer-events-auto space-y-4">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <div className="flex items-center gap-1.5">
                      <Flame size={15} className="text-accent animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink">Mapa de Calor</span>
                    </div>
                    
                    <button 
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={cn(
                        "text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded transition-colors",
                        showHeatmap 
                          ? "bg-accent text-white" 
                          : "bg-bg text-subtle hover:bg-line border border-line"
                      )}
                    >
                      {showHeatmap ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  {showHeatmap && (
                    <div className="space-y-3">
                      {/* Radius Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-subtle font-bold uppercase">
                          <span>Raio Concentração</span>
                          <span className="text-ink font-mono">{heatmapRadius}px</span>
                        </div>
                        <input 
                          type="range"
                          min="15"
                          max="80"
                          value={heatmapRadius}
                          onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                          className="w-full accent-accent bg-bg/50 h-1.5 rounded cursor-pointer"
                        />
                      </div>

                      {/* Intensity Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-subtle font-bold uppercase">
                          <span>Densidade de Vias</span>
                          <span className="text-ink font-mono">{heatmapIntensity}x</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="5"
                          step="0.5"
                          value={heatmapIntensity}
                          onChange={(e) => setHeatmapIntensity(Number(e.target.value))}
                          className="w-full accent-accent bg-bg/50 h-1.5 rounded cursor-pointer"
                        />
                      </div>

                      {/* Opacity Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-subtle font-bold uppercase">
                          <span>Opacidade Camada</span>
                          <span className="text-ink font-mono">{Math.round(heatmapOpacity * 100)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.05"
                          value={heatmapOpacity}
                          onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                          className="w-full accent-accent bg-bg/50 h-1.5 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Satellite or standard roadmap modes */}
                  <div className="flex border-t border-line pt-2.5 gap-1.5">
                    {(['roadmap', 'hybrid', 'satellite'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setMapType(type)}
                        className={cn(
                          "flex-1 text-[9px] uppercase tracking-wider font-bold py-1 rounded transition-all capitalize border text-center",
                          mapType === type 
                            ? "bg-ink border-ink text-white" 
                            : "bg-surface border-line text-subtle hover:text-ink hover:bg-bg"
                        )}
                      >
                        {type === 'roadmap' ? 'Padrão' : type === 'hybrid' ? 'Satélite' : 'Terreno'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tracking stats capsule popup overlay in map center bottom */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-md px-5 py-2 rounded-full border border-line shadow-xl flex items-center gap-6 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    <span className="text-[9px] font-semibold text-subtle uppercase tracking-widest">Conexão Ativa</span>
                  </div>
                  <div className="w-px h-3 bg-line"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ink">{rentedVehicles.length} Ativos</span>
                </div>
              </div>
            </APIProvider>
          )}
        </div>

        {/* Sidebar panels detail vehicle lists */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-hidden">
          <div className="panel bg-surface flex-1 flex flex-col overflow-hidden border-line">
            <div className="p-4 border-b border-line bg-bg/30 flex items-center justify-between">
              <h3 className="text-[12px] font-bold tracking-tight uppercase text-ink">Status Geral</h3>
              {hasValidKey && (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                  GPS Ligado
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {rentedVehicles.length === 0 ? (
                <div className="p-8 text-center text-subtle">
                  <p className="text-[12px] italic">Não há veículos ativos rodando.</p>
                </div>
              ) : (
                rentedVehicles.map((v, i) => {
                  const isSelected = selectedVehicle === v.id;
                  return (
                    <div 
                      key={v.id} 
                      onClick={() => setSelectedVehicle(isSelected ? null : v.id)}
                      className={cn(
                        "p-3.5 rounded-xl transition-all cursor-pointer border",
                        isSelected 
                          ? "bg-bg border-accent shadow-sm" 
                          : "border-transparent hover:bg-bg/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold font-mono text-ink bg-bg px-2 py-0.5 rounded border border-line">{v.plate}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                          <span className="text-[9px] font-bold text-success uppercase tracking-tighter">Ativo</span>
                        </div>
                      </div>
                      <p className="font-bold text-[13px] text-ink leading-tight">{v.model}</p>
                      
                      <div className="flex items-center justify-between mt-3 text-[9.5px] font-semibold text-subtle uppercase">
                        <div className="flex items-center gap-1">
                          <Battery size={11} className="text-emerald-500" />
                          <span>85% Comb.</span>
                        </div>
                        <span className="font-bold text-accent font-mono">{(55 + (i * 12) % 35)} km/h</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedVehicleDetails && (
            <div className="panel p-5 bg-surface border-line space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <Activity className="text-danger animate-pulse" size={15} />
                <h4 className="text-[10.5px] font-bold uppercase tracking-widest text-ink">Telemetria Digital</h4>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-subtle">Modelo</span>
                  <span className="font-bold">{selectedVehicleDetails.vehicle.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-subtle">Sinal de Rede</span>
                  <span className="font-bold text-success flex items-center gap-1">
                    <Signal size={12} /> 100%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-subtle">Corrida Recente</span>
                  <span className="font-semibold text-accent">Zonas Centrais</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-line text-[10.5px]">
                  <span className="text-subtle">Latitude:</span>
                  <span className="font-mono">{selectedVehicleDetails.coords.lat.toFixed(5)}</span>
                </div>
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-subtle">Longitude:</span>
                  <span className="font-mono">{selectedVehicleDetails.coords.lng.toFixed(5)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Map custom marker icon placeholder
const CarIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M5 17h10" />
    <path d="M9 10V8" />
  </svg>
);
