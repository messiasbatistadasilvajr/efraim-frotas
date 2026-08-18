import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  MapPin, 
  Signal, 
  Battery, 
  Activity, 
  Flame, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Play, 
  Pause, 
  RotateCcw, 
  Gauge, 
  Navigation, 
  Layers, 
  Share2, 
  Volume2, 
  Radio, 
  Search, 
  Car, 
  Crosshair, 
  CheckCircle2, 
  Info,
  Sliders,
  Maximize2
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Vehicle } from '../types';
import { cn } from '../lib/utils';
import { mockVehicles } from '../lib/mockData';
import { useToast } from './ToastProvider';
import L from 'leaflet';

// Fortaleza Routes for dynamic live simulation
const FORTALEZA_CIRCUITS: { [key: number]: { name: string; waypoints: [number, number][] } } = {
  0: {
    name: 'Av. Beira-Mar & Meireles',
    waypoints: [
      [-3.7230, -38.4980],
      [-3.7252, -38.4890],
      [-3.7210, -38.4770],
      [-3.7290, -38.4850],
      [-3.7310, -38.4990],
      [-3.7260, -38.5080],
      [-3.7230, -38.4980]
    ]
  },
  1: {
    name: 'Av. Santos Dumont / Aldeota',
    waypoints: [
      [-3.7360, -38.5090],
      [-3.7370, -38.4950],
      [-3.7390, -38.4800],
      [-3.7460, -38.4740],
      [-3.7480, -38.4900],
      [-3.7420, -38.5070],
      [-3.7360, -38.5090]
    ]
  },
  2: {
    name: 'Aeroporto Pinto Martins & Serrinha',
    waypoints: [
      [-3.7740, -38.5340],
      [-3.7790, -38.5280],
      [-3.7870, -38.5360],
      [-3.7820, -38.5480],
      [-3.7730, -38.5440],
      [-3.7740, -38.5340]
    ]
  },
  3: {
    name: 'Av. Washington Soares / Sul',
    waypoints: [
      [-3.7620, -38.4890],
      [-3.7780, -38.4830],
      [-3.8010, -38.4800],
      [-3.8150, -38.4820],
      [-3.8000, -38.4810],
      [-3.7750, -38.4850],
      [-3.7620, -38.4890]
    ]
  },
  4: {
    name: 'Messejana Hub & BR-116',
    waypoints: [
      [-3.8290, -38.4990],
      [-3.8380, -38.4940],
      [-3.8460, -38.5030],
      [-3.8390, -38.5130],
      [-3.8290, -38.4990]
    ]
  },
  5: {
    name: 'Centro Histórico & Praia de Iracema',
    waypoints: [
      [-3.7220, -38.5200],
      [-3.7280, -38.5290],
      [-3.7350, -38.5330],
      [-3.7320, -38.5190],
      [-3.7220, -38.5200]
    ]
  }
};

// Play sound synthesizers for tactical auditory feedback
const playTone = (freq: number, type: OscillatorType = 'sine', duration: number = 0.15) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio context errors if blocked
  }
};

export function Tracking() {
  const { showToast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const geofenceCircleRef = useRef<L.Circle | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'moving' | 'stopped' | 'locked'>('all');

  // Simulation Controls State
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [vehicleProgress, setVehicleProgress] = useState<{ [id: string]: number }>({});
  const [blockedVehicles, setBlockedVehicles] = useState<{ [id: string]: boolean }>({});
  const [vehicleTelemetry, setVehicleTelemetry] = useState<{ 
    [id: string]: { 
      lat: number; 
      lng: number; 
      speed: number; 
      battery: number; 
      fuel: number; 
      ignition: boolean; 
      heading: number; 
      trail: [number, number][];
      address: string;
    } 
  }>({});

  // Map Appearance
  const [mapLayer, setMapLayer] = useState<'street' | 'dark' | 'satellite'>('street');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showGeofence, setShowGeofence] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isConfirmingBlock, setIsConfirmingBlock] = useState<string | null>(null);

  // Load Vehicles
  useEffect(() => {
    const isDemo = localStorage.getItem('efraim_demo_session') === 'true';
    if (isDemo) {
      setVehicles(mockVehicles);
      return;
    }

    if (!auth.currentUser) {
      setVehicles(mockVehicles);
      return;
    }
    const q = query(collection(db, 'vehicles'), where('ownerId', '==', auth.currentUser.uid));
    return onSnapshot(q, (s) => {
      const dbVehicles = s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle));
      setVehicles(dbVehicles.length > 0 ? dbVehicles : mockVehicles);
    });
  }, []);

  const activeVehicles = useMemo(() => {
    const base = vehicles.length > 0 ? vehicles : mockVehicles;
    return base.filter(v => v.status === 'rented' || v.status === 'available');
  }, [vehicles]);

  // Initialize Telemetry and Positions along Fortaleza circuits
  useEffect(() => {
    const initialTelemetry: { [id: string]: any } = {};
    const initialProgress: { [id: string]: number } = {};

    activeVehicles.forEach((v, idx) => {
      const circuit = FORTALEZA_CIRCUITS[idx % 6];
      const startPt = circuit.waypoints[0];
      const prog = (idx * 0.16) % 1;
      initialProgress[v.id] = prog;

      initialTelemetry[v.id] = {
        lat: startPt[0],
        lng: startPt[1],
        speed: 42 + ((idx * 7) % 25),
        battery: 92 - (idx * 4),
        fuel: 85 - (idx * 6),
        ignition: true,
        heading: (idx * 60) % 360,
        trail: [startPt],
        address: `${circuit.name}, Fortaleza - CE`
      };
    });

    setVehicleProgress(initialProgress);
    setVehicleTelemetry(initialTelemetry);
    if (activeVehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(activeVehicles[0].id);
    }
  }, [activeVehicles]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-3.7319, -38.5267], // Fortaleza Center
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Map Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let maxZoom = 19;

    if (mapLayer === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
    }

    L.tileLayer(tileUrl, {
      maxZoom,
      subdomains: 'abcd'
    }).addTo(map);
  }, [mapLayer]);

  // Geofence Circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (geofenceCircleRef.current) {
      map.removeLayer(geofenceCircleRef.current);
      geofenceCircleRef.current = null;
    }

    if (showGeofence) {
      const circle = L.circle([-3.7450, -38.5150], {
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.07,
        weight: 1.5,
        dashArray: '6, 8',
        radius: 8500 // 8.5 km radius covering Greater Fortaleza
      }).addTo(map);

      circle.bindTooltip('🛡️ Cerca Eletrônica: Fortaleza & Região Metropolitana', {
        permanent: false,
        direction: 'top',
        className: 'geofence-tooltip'
      });

      geofenceCircleRef.current = circle;
    }
  }, [showGeofence]);

  // Heatmap Clusters
  useEffect(() => {
    if (!heatmapLayerGroupRef.current) return;
    const group = heatmapLayerGroupRef.current;
    group.clearLayers();

    if (showHeatmap) {
      const hotspots = [
        { center: [-3.7250, -38.4972], radius: 1800, intensity: 0.25, name: 'Beira Mar / Meireles' },
        { center: [-3.7345, -38.5032], radius: 1500, intensity: 0.22, name: 'Aldeota / Santos Dumont' },
        { center: [-3.7763, -38.5326], radius: 2200, intensity: 0.30, name: 'Aeroporto Pinto Martins' },
        { center: [-3.7428, -38.4725], radius: 1600, intensity: 0.20, name: 'Papicu / Shopping RioMar' },
        { center: [-3.8322, -38.4990], radius: 2000, intensity: 0.24, name: 'Messejana Terminal' }
      ];

      hotspots.forEach(h => {
        L.circle(h.center as [number, number], {
          color: '#f43f5e',
          fillColor: '#f43f5e',
          fillOpacity: h.intensity,
          weight: 0,
          radius: h.radius
        }).addTo(group);
      });
    }
  }, [showHeatmap]);

  // Interpolate position along circuit waypoints
  const getInterpolatedPoint = (waypoints: [number, number][], progress: number) => {
    const totalSegments = waypoints.length - 1;
    const scaledProg = (progress % 1) * totalSegments;
    const currentIdx = Math.floor(scaledProg);
    const nextIdx = (currentIdx + 1) % waypoints.length;
    const segmentFactor = scaledProg - currentIdx;

    const p1 = waypoints[currentIdx];
    const p2 = waypoints[nextIdx];

    const lat = p1[0] + (p2[0] - p1[0]) * segmentFactor;
    const lng = p1[1] + (p2[1] - p1[1]) * segmentFactor;

    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    const heading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

    return { lat, lng, heading };
  };

  // Real-Time Simulation Interval
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setVehicleProgress(prev => {
        const nextProgress = { ...prev };

        activeVehicles.forEach((v, idx) => {
          if (blockedVehicles[v.id]) return; // Stop if locked

          const step = (0.0018 + (idx * 0.0004)) * simulationSpeed;
          nextProgress[v.id] = ((nextProgress[v.id] || 0) + step) % 1;
        });

        return nextProgress;
      });

      setVehicleTelemetry(prev => {
        const nextTelemetry = { ...prev };

        activeVehicles.forEach((v, idx) => {
          const circuit = FORTALEZA_CIRCUITS[idx % 6];
          const isBlocked = blockedVehicles[v.id];
          const currentProg = vehicleProgress[v.id] || 0;
          const { lat, lng, heading } = getInterpolatedPoint(circuit.waypoints, currentProg);

          const prevData = prev[v.id] || {
            speed: 45,
            battery: 90,
            fuel: 80,
            ignition: true,
            trail: []
          };

          const newSpeed = isBlocked 
            ? 0 
            : Math.min(85, Math.max(25, prevData.speed + (Math.sin(Date.now() / 2000 + idx) * 4)));

          const updatedTrail = [...(prevData.trail || [])];
          if (updatedTrail.length === 0 || Math.abs(updatedTrail[updatedTrail.length - 1][0] - lat) > 0.0003) {
            updatedTrail.push([lat, lng]);
            if (updatedTrail.length > 25) updatedTrail.shift();
          }

          nextTelemetry[v.id] = {
            lat,
            lng,
            speed: Math.round(newSpeed),
            battery: isBlocked ? 99 : Math.max(15, prevData.battery - 0.005),
            fuel: isBlocked ? prevData.fuel : Math.max(10, prevData.fuel - 0.008),
            ignition: !isBlocked,
            heading,
            trail: updatedTrail,
            address: `${circuit.name}, Fortaleza - CE`
          };
        });

        return nextTelemetry;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, activeVehicles, blockedVehicles, vehicleProgress]);

  // Update Leaflet Markers based on live telemetry
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    activeVehicles.forEach((v) => {
      const data = vehicleTelemetry[v.id];
      if (!data) return;

      const isSelected = selectedVehicleId === v.id;
      const isBlocked = blockedVehicles[v.id];
      const isMoving = data.speed > 5 && !isBlocked;

      const markerHtml = `
        <div class="relative group cursor-pointer transition-all duration-300 transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all ${
            isBlocked
              ? 'bg-rose-600 border-white ring-4 ring-rose-500/40 text-white animate-pulse'
              : isSelected
              ? 'bg-indigo-600 border-white ring-4 ring-indigo-500/40 text-white'
              : isMoving
              ? 'bg-emerald-600 border-white text-white'
              : 'bg-amber-600 border-white text-white'
          }">
            <svg class="w-6 h-6 transition-transform duration-300" style="transform: rotate(${data.heading - 90}deg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
              <path d="M5 17h10" />
            </svg>
          </div>

          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-black font-mono px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap flex items-center gap-1">
            <span>${v.plate}</span>
            <span class="text-[8px] opacity-75 font-normal">(${isBlocked ? 'BLOQ' : `${data.speed}km/h`})</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-vehicle-icon',
        html: markerHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      if (!markersRef.current[v.id]) {
        const marker = L.marker([data.lat, data.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedVehicleId(v.id);
          playTone(580, 'sine', 0.1);
        });
        markersRef.current[v.id] = marker;
      } else {
        markersRef.current[v.id].setLatLng([data.lat, data.lng]);
        markersRef.current[v.id].setIcon(customIcon);
      }
    });

    // Clean up deleted vehicles
    Object.keys(markersRef.current).forEach(id => {
      if (!activeVehicles.some(v => v.id === id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });
  }, [activeVehicles, vehicleTelemetry, selectedVehicleId, blockedVehicles]);

  // Draw Live Breadcrumb Polyline for selected vehicle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (selectedVehicleId && vehicleTelemetry[selectedVehicleId]) {
      const trail = vehicleTelemetry[selectedVehicleId].trail;
      if (trail && trail.length > 1) {
        polylineRef.current = L.polyline(trail, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.85,
          dashArray: '4, 6'
        }).addTo(map);
      }
    }
  }, [selectedVehicleId, vehicleTelemetry]);

  // Center map on selected vehicle
  const centerOnVehicle = (id: string) => {
    setSelectedVehicleId(id);
    const data = vehicleTelemetry[id];
    if (data && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([data.lat, data.lng], 14, {
        duration: 0.8
      });
      playTone(650, 'sine', 0.1);
    }
  };

  // Remote Block / Cut-off Engine Simulation
  const handleToggleBlock = (vehicleId: string) => {
    const isCurrentlyBlocked = blockedVehicles[vehicleId];
    const targetVeh = activeVehicles.find(v => v.id === vehicleId);

    if (!isCurrentlyBlocked) {
      // Prompt confirmation
      setIsConfirmingBlock(vehicleId);
    } else {
      // Unblock directly
      setBlockedVehicles(prev => ({ ...prev, [vehicleId]: false }));
      playTone(880, 'sine', 0.25);
      showToast(`Ignição reativada com sucesso para o veículo ${targetVeh?.plate || vehicleId}!`, 'success');
    }
  };

  const confirmBlockExecution = () => {
    if (!isConfirmingBlock) return;
    const targetVeh = activeVehicles.find(v => v.id === isConfirmingBlock);

    setBlockedVehicles(prev => ({ ...prev, [isConfirmingBlock]: true }));
    playTone(220, 'sawtooth', 0.4);
    showToast(`Comando de Bloqueio Remoto enviado via Telemetria para a placa ${targetVeh?.plate || isConfirmingBlock}!`, 'warning');
    setIsConfirmingBlock(null);
  };

  const selectedVehicleObj = useMemo(() => {
    return activeVehicles.find(v => v.id === selectedVehicleId) || activeVehicles[0];
  }, [activeVehicles, selectedVehicleId]);

  const selectedTelemetry = selectedVehicleObj ? vehicleTelemetry[selectedVehicleObj.id] : null;
  const isSelectedBlocked = selectedVehicleObj ? blockedVehicles[selectedVehicleObj.id] : false;

  // Filtered List for Sidebar
  const filteredVehicles = useMemo(() => {
    return activeVehicles.filter(v => {
      const matchesSearch = v.plate.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            v.model.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const telem = vehicleTelemetry[v.id];
      const isBlocked = blockedVehicles[v.id];
      const isMoving = telem && telem.speed > 5 && !isBlocked;

      if (filterStatus === 'moving') return isMoving;
      if (filterStatus === 'stopped') return !isMoving && !isBlocked;
      if (filterStatus === 'locked') return isBlocked;
      return true;
    });
  }, [activeVehicles, searchQuery, filterStatus, vehicleTelemetry, blockedVehicles]);

  return (
    <div className="space-y-4 h-[calc(100vh-130px)] flex flex-col animate-in fade-in duration-300">
      
      {/* Top Bar Header & Live Metrics Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
            <Radio size={20} className="animate-pulse text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[20px] font-bold tracking-tight text-ink">Centro de Telemetria & Rastreamento</h2>
              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Ao Vivo (Fortaleza - CE)
              </span>
            </div>
            <p className="text-subtle text-xs">Simulação e rastreamento GPS de alta precisão com corte remoto e mapa de calor</p>
          </div>
        </div>

        {/* Live Simulation Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-bg p-1 rounded-xl border border-line">
            <button
              onClick={() => {
                setIsSimulating(!isSimulating);
                playTone(isSimulating ? 350 : 700, 'sine', 0.1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs",
                isSimulating 
                  ? "bg-accent text-white" 
                  : "bg-surface text-ink hover:bg-line border border-line"
              )}
            >
              {isSimulating ? <Pause size={14} /> : <Play size={14} />}
              {isSimulating ? 'Pausar Simulação' : 'Retomar GPS'}
            </button>

            <div className="flex items-center gap-1 px-2 border-l border-line ml-1">
              {[1, 2, 4].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimulationSpeed(spd)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all",
                    simulationSpeed === spd 
                      ? "bg-ink text-white" 
                      : "text-subtle hover:text-ink hover:bg-surface"
                  )}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedVehicleObj) centerOnVehicle(selectedVehicleObj.id);
            }}
            className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 shadow-xs"
            title="Recentralizar Mapa"
          >
            <Crosshair size={14} className="text-accent" />
            <span className="hidden sm:inline">Centralizar</span>
          </button>
        </div>
      </header>

      {/* Main Map + Side Panels Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
        
        {/* Left Map Viewport */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-line bg-slate-900 shadow-sm flex flex-col">
          
          {/* Leaflet Map Canvas */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

          {/* Floating Map Floating Controls Top-Left */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-auto">
            
            {/* Map Layer Switcher */}
            <div className="bg-surface/95 backdrop-blur-md p-1.5 rounded-xl border border-line shadow-lg flex items-center gap-1">
              {(['street', 'dark', 'satellite'] as const).map(layer => (
                <button
                  key={layer}
                  onClick={() => {
                    setMapLayer(layer);
                    playTone(450, 'sine', 0.08);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-all",
                    mapLayer === layer 
                      ? "bg-ink text-white shadow-xs" 
                      : "text-subtle hover:text-ink hover:bg-bg"
                  )}
                >
                  {layer === 'street' ? 'Vias' : layer === 'dark' ? 'Noite' : 'Satélite'}
                </button>
              ))}
            </div>

            {/* Heatmap & Geofence Toggles */}
            <div className="bg-surface/95 backdrop-blur-md p-2 rounded-xl border border-line shadow-lg space-y-1.5 text-xs">
              <label className="flex items-center justify-between gap-3 cursor-pointer select-none text-[11px] font-bold text-ink">
                <span className="flex items-center gap-1.5">
                  <Flame size={13} className="text-rose-500" />
                  Mapa de Calor
                </span>
                <input 
                  type="checkbox" 
                  checked={showHeatmap} 
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer select-none text-[11px] font-bold text-ink border-t border-line pt-1.5">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-indigo-500" />
                  Cerca Fortaleza
                </span>
                <input 
                  type="checkbox" 
                  checked={showGeofence} 
                  onChange={(e) => setShowGeofence(e.target.checked)}
                  className="rounded accent-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Quick HUD Overlay Bottom Center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-surface/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-line shadow-xl flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-ink">{activeVehicles.length} Veículos Conectados</span>
            </div>
            <div className="w-px h-4 bg-line"></div>
            <div className="flex items-center gap-2 text-subtle">
              <Navigation size={13} className="text-accent" />
              <span>Rotas em Fortaleza / CE</span>
            </div>
          </div>
        </div>

        {/* Right Details & Vehicle Selector Panel */}
        <div className="w-full lg:w-96 flex flex-col gap-3 shrink-0 h-full overflow-hidden">
          
          {/* Selected Vehicle Live Telemetry Card */}
          {selectedVehicleObj && selectedTelemetry && (
            <div className="panel p-4 bg-surface border-line space-y-3.5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black font-mono bg-bg px-2 py-0.5 rounded border border-line text-ink">
                      {selectedVehicleObj.plate}
                    </span>
                    {isSelectedBlocked ? (
                      <span className="bg-rose-500/10 text-rose-600 font-bold text-[10px] px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <Lock size={10} /> Ignição Cortada
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-600 font-bold text-[10px] px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <Signal size={10} /> Online
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-ink text-sm leading-tight">{selectedVehicleObj.model}</h3>
                  <p className="text-[11px] text-subtle truncate max-w-[220px]">{selectedTelemetry.address}</p>
                </div>

                {/* Remote Cut-off Engine Button */}
                <button
                  onClick={() => handleToggleBlock(selectedVehicleObj.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm",
                    isSelectedBlocked
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  )}
                  title={isSelectedBlocked ? "Reativar Veículo" : "Cortar Ignição Remotamente"}
                >
                  {isSelectedBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>{isSelectedBlocked ? 'Desbloquear' : 'Bloquear'}</span>
                </button>
              </div>

              {/* Dynamic Speedometer & Gauge Box */}
              <div className="bg-bg p-3 rounded-xl border border-line grid grid-cols-3 gap-2 text-center">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-subtle uppercase tracking-wider flex items-center justify-center gap-1">
                    <Gauge size={11} className="text-accent" />
                    Velocidade
                  </div>
                  <div className={cn(
                    "text-lg font-black font-mono",
                    selectedTelemetry.speed > 70 ? "text-rose-500" : "text-ink"
                  )}>
                    {selectedTelemetry.speed} <span className="text-[10px] font-normal text-subtle">km/h</span>
                  </div>
                </div>

                <div className="space-y-0.5 border-x border-line">
                  <div className="text-[10px] font-bold text-subtle uppercase tracking-wider flex items-center justify-center gap-1">
                    <Battery size={11} className="text-emerald-500" />
                    Bateria
                  </div>
                  <div className="text-lg font-black font-mono text-emerald-600">
                    {Math.round(selectedTelemetry.battery)}%
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-subtle uppercase tracking-wider flex items-center justify-center gap-1">
                    <Activity size={11} className="text-amber-500" />
                    Combustível
                  </div>
                  <div className="text-lg font-black font-mono text-amber-600">
                    {Math.round(selectedTelemetry.fuel)}%
                  </div>
                </div>
              </div>

              {/* GPS Coordinates & Share Link */}
              <div className="flex items-center justify-between text-[11px] text-subtle pt-1">
                <div className="font-mono">
                  GPS: {selectedTelemetry.lat.toFixed(4)}, {selectedTelemetry.lng.toFixed(4)}
                </div>
                <button
                  onClick={() => {
                    playTone(720, 'sine', 0.1);
                    showToast(`Link de rastreio seguro gerado para a placa ${selectedVehicleObj.plate}!`, 'info');
                  }}
                  className="text-accent font-bold hover:underline flex items-center gap-1"
                >
                  <Share2 size={12} /> Compartilhar
                </button>
              </div>
            </div>
          )}

          {/* Vehicle List Filter & Selector */}
          <div className="panel flex-1 flex flex-col overflow-hidden bg-surface border-line">
            
            {/* Search and Filters Header */}
            <div className="p-3 border-b border-line space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  type="text"
                  placeholder="Buscar por placa ou modelo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-bg border border-line rounded-lg focus:outline-none focus:border-accent text-ink"
                />
              </div>

              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'moving', label: 'Em Rota' },
                  { id: 'stopped', label: 'Parados' },
                  { id: 'locked', label: 'Bloqueados' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterStatus(f.id as any)}
                    className={cn(
                      "flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                      filterStatus === f.id 
                        ? "bg-ink text-white" 
                        : "text-subtle hover:bg-bg hover:text-ink"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Vehicle List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredVehicles.length === 0 ? (
                <div className="p-6 text-center text-subtle text-xs">
                  Nenhum veículo encontrado com esse filtro.
                </div>
              ) : (
                filteredVehicles.map((v) => {
                  const telem = vehicleTelemetry[v.id];
                  const isSelected = selectedVehicleId === v.id;
                  const isBlocked = blockedVehicles[v.id];
                  const isMoving = telem && telem.speed > 5 && !isBlocked;

                  return (
                    <div
                      key={v.id}
                      onClick={() => centerOnVehicle(v.id)}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer",
                        isSelected 
                          ? "bg-accent/5 border-accent shadow-xs" 
                          : "bg-surface border-line hover:border-accent/40 hover:bg-bg/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono font-bold text-ink bg-bg px-2 py-0.5 rounded border border-line">
                          {v.plate}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            isBlocked ? "bg-rose-500" : isMoving ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                          )} />
                          <span className={cn(
                            "text-[10px] font-bold uppercase",
                            isBlocked ? "text-rose-600" : isMoving ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {isBlocked ? 'Bloqueado' : isMoving ? `${telem?.speed || 0} km/h` : 'Parado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-ink truncate max-w-[160px]">{v.model}</span>
                        <span className="text-[10.5px] text-subtle">{v.color}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Remote Lock */}
      {isConfirmingBlock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface max-w-md w-full p-6 rounded-2xl border border-line shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={26} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-ink">Confirmar Corte de Ignição</h3>
              <p className="text-xs text-subtle">
                Você tem certeza que deseja cortar o combustível/ignição do veículo agora? Esta ação desliga a propulsão do veículo assim que a velocidade for segura.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsConfirmingBlock(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBlockExecution}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold flex-1 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Lock size={14} />
                Confirmar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
