import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { MapPin, Navigation, Signal, Battery, Activity, Search } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Vehicle } from '../types';
import { cn } from '../lib/utils';

export function Tracking() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'vehicles'), where('ownerId', '==', auth.currentUser.uid));
    return onSnapshot(q, (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));
  }, []);

  const rentedVehicles = vehicles.filter(v => v.status === 'rented');

  return (
    <div className="space-y-8 h-[calc(100vh-160px)] flex flex-col animate-in fade-in duration-500">
      <header>
        <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Rastreamento</h2>
        <p className="text-subtle text-[14px]">Monitoramento em tempo real da frota ativa</p>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Map Area Simulation */}
        <div className="flex-1 panel relative overflow-hidden group shadow-inner bg-bg/20">
          <div className="absolute inset-0 pattern-grid opacity-10"></div>
          
          {rentedVehicles.map((v, i) => (
             <div 
               key={v.id}
               onClick={() => setSelectedVehicle(v.id)}
               style={{ 
                 top: `${20 + (i * 15) % 60}%`, 
                 left: `${20 + (i * 25) % 60}%` 
               }}
               className={cn(
                 "absolute cursor-pointer transition-all duration-500 hover:scale-110 z-10",
                 selectedVehicle === v.id ? "scale-125" : ""
               )}
             >
                <div className="relative">
                   <div className={cn(
                     "w-10 h-10 rounded-full flex items-center justify-center text-surface shadow-xl",
                     selectedVehicle === v.id ? "bg-accent ring-4 ring-bg" : "bg-blue-600"
                   )}>
                      <Car size={18} className="" />
                   </div>
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-surface px-2 py-0.5 rounded-[4px] border border-line shadow-sm whitespace-nowrap">
                      <p className="text-[9px] font-bold font-mono text-ink tracking-tight">{v.plate}</p>
                   </div>
                </div>
             </div>
          ))}

          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
             <button className="bg-surface p-2.5 rounded-[8px] border border-line shadow-sm hover:bg-bg transition-colors">
                <Signal size={18} className="text-success" />
             </button>
             <button className="bg-surface p-2.5 rounded-[8px] border border-line shadow-sm hover:bg-bg transition-colors">
                <Navigation size={18} className="text-ink" />
             </button>
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-line shadow-xl flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">GPS Conectado</span>
             </div>
             <div className="w-px h-3 bg-line"></div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-ink">{rentedVehicles.length} Em Movimento</span>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-80 flex flex-col gap-6 overflow-hidden">
           <div className="panel bg-surface flex flex-col overflow-hidden border-line">
              <div className="p-5 border-b border-line bg-bg/30">
                 <h3 className="text-[14px] font-bold tracking-tight uppercase tracking-wider text-ink">Ativos</h3>
              </div>
              
              <div className="flex-1 overflow-auto p-2 space-y-1">
                 {rentedVehicles.length === 0 && (
                   <div className="p-8 text-center">
                     <p className="text-subtle text-[12px] italic">Nenhum veículo alugado.</p>
                   </div>
                 )}
                 {rentedVehicles.map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => setSelectedVehicle(v.id)}
                      className={cn(
                        "p-4 rounded-[8px] transition-all cursor-pointer border",
                        selectedVehicle === v.id ? "bg-bg border-line" : "border-transparent hover:bg-bg/50"
                      )}
                    >
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold font-mono text-subtle">{v.plate}</span>
                          <span className="text-[9px] font-bold text-success uppercase tracking-tighter">On-line</span>
                       </div>
                       <p className="font-bold text-[13px] text-ink">{v.model}</p>
                       <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-subtle">
                             <Battery size={12} /> <span>88%</span>
                          </div>
                          <div className="text-[10px] font-bold text-accent">65 km/h</div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {selectedVehicle && (
              <div className="panel p-5 animate-in slide-in-from-right duration-300">
                 <div className="flex items-center gap-2 mb-4 border-b border-line pb-3">
                    <Activity className="text-danger" size={16} />
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-ink">Telemetria ao Vivo</h4>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[12px]">
                       <span className="text-subtle">Velocidade Média</span>
                       <span className="font-bold">42 km/h</span>
                    </div>
                    <div className="flex justify-between items-center text-[12px]">
                       <span className="text-subtle">Alertas (1h)</span>
                       <span className="font-bold text-danger">0</span>
                    </div>
                    <div className="flex justify-between items-center text-[12px]">
                       <span className="text-subtle">Est. Combustível</span>
                       <span className="font-bold">65%</span>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}

const Car = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    <path d="M5 17h10" /><path d="M9 10V8" />
  </svg>
);
