
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Calendar, 
  Clipboard, 
  FileText, 
  History, 
  Info, 
  Settings, 
  TrendingUp, 
  Wrench,
  Car,
  DollarSign,
  Shield,
  Gauge
} from 'lucide-react';
import { db } from '../lib/firebase';
import { Vehicle, Maintenance, Contract, Payment } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

interface VehicleDetailsProps {
  vehicleId: string;
  onBack: () => void;
}

export function VehicleDetails({ vehicleId, onBack }: VehicleDetailsProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      const vDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      if (vDoc.exists()) {
        setVehicle({ id: vDoc.id, ...vDoc.data() } as Vehicle);
      }
      setLoading(false);
    };

    fetchVehicle();

    const unsubM = onSnapshot(query(collection(db, 'maintenances'), where('vehicleId', '==', vehicleId)), (s) => 
      setMaintenances(s.docs.map(d => ({ id: d.id, ...d.data() } as Maintenance)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    );
    
    const unsubC = onSnapshot(query(collection(db, 'contracts'), where('vehicleId', '==', vehicleId)), (s) => 
      setContracts(s.docs.map(d => ({ id: d.id, ...d.data() } as Contract)))
    );

    return () => {
      unsubM();
      unsubC();
    };
  }, [vehicleId]);

  // Once we have contracts, get payments
  useEffect(() => {
    if (contracts.length === 0) return;
    const contractIds = contracts.map(c => c.id);
    const unsubP = onSnapshot(query(collection(db, 'payments'), where('contractId', 'in', contractIds)), (s) => 
      setPayments(s.docs.map(d => ({ id: d.id, ...d.data() } as Payment)))
    );
    return () => unsubP();
  }, [contracts]);

  if (loading) return <div className="p-10 text-center text-subtle">Carregando dados do veículo...</div>;
  if (!vehicle) return <div className="p-10 text-center text-danger">Veículo não encontrado.</div>;

  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalMaintenance = maintenances.reduce((acc, m) => acc + (m.cost || 0), 0);
  const netProfit = totalRevenue - totalMaintenance;
  const roi = vehicle.purchaseValue > 0 ? (netProfit / vehicle.purchaseValue) * 100 : 0;

  const getExpiryStatus = (date: string) => {
    if (!date) return 'n/a';
    const day = 24 * 60 * 60 * 1000;
    const diff = new Date(date).getTime() - new Date().getTime();
    if (diff < 0) return 'expired';
    if (diff < 30 * day) return 'warning';
    return 'ok';
  };

  const maintenanceData = maintenances.slice(0, 10).reverse().map(m => ({
    date: formatDate(m.date),
    cost: m.cost
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-surface border border-line rounded-lg transition-all text-subtle hover:text-ink shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">{vehicle.model}</h2>
            <p className="text-subtle text-[14px] font-mono uppercase tracking-widest">{vehicle.plate} • {vehicle.year}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <span className={cn(
             "status-badge px-4 py-1.5",
             vehicle.status === 'rented' ? "bg-accent/10 text-accent" : "bg-success/10 text-success"
           )}>
             {vehicle.status === 'rented' ? 'Locado' : 'Disponível'}
           </span>
        </div>
      </header>

      {/* Jump to Section Nav */}
      <div className="flex flex-wrap gap-2 sticky top-[80px] z-20 bg-bg/80 backdrop-blur-md py-2 -mx-2 px-2 border-b border-line shadow-sm">
        <button 
          onClick={() => document.getElementById('technical-specs')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="px-4 py-1.5 bg-surface border border-line rounded-full text-[12px] font-bold text-subtle hover:text-accent hover:border-accent transition-all flex items-center gap-2 shadow-sm"
        >
          <Info size={14} /> Ficha Técnica
        </button>
        <button 
          onClick={() => document.getElementById('maintenance-history')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="px-4 py-1.5 bg-surface border border-line rounded-full text-[12px] font-bold text-subtle hover:text-accent hover:border-accent transition-all flex items-center gap-2 shadow-sm"
        >
          <History size={14} /> Histórico
        </button>
        <button 
          onClick={() => document.getElementById('alerts')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="px-4 py-1.5 bg-surface border border-line rounded-full text-[12px] font-bold text-subtle hover:text-accent hover:border-accent transition-all flex items-center gap-2 shadow-sm"
        >
          <Shield size={14} /> Vencimentos
        </button>
        <button 
          onClick={() => document.getElementById('roi-performance')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="px-4 py-1.5 bg-surface border border-line rounded-full text-[12px] font-bold text-subtle hover:text-accent hover:border-accent transition-all flex items-center gap-2 shadow-sm"
        >
          <TrendingUp size={14} /> Performance
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="panel p-5 border-t-4 border-t-accent bg-accent/[0.02]">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-accent/10 rounded-lg text-accent">
               <DollarSign size={18} />
             </div>
             <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Receita Bruta</span>
          </div>
          <p className="text-[20px] font-display font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        
        <div className="panel p-5 border-t-4 border-t-danger bg-danger/[0.01]">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-danger/10 rounded-lg text-danger">
               <Wrench size={18} />
             </div>
             <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Custos Totais</span>
          </div>
          <p className="text-[20px] font-display font-bold">{formatCurrency(totalMaintenance)}</p>
        </div>

        <div className="panel p-5 border-t-4 border-t-success bg-success/[0.01]">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-success/10 rounded-lg text-success">
               <TrendingUp size={18} />
             </div>
             <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Lucro Líquido</span>
          </div>
          <p className="text-[20px] font-display font-bold">{formatCurrency(netProfit)}</p>
        </div>

        <div className="panel p-5 border-t-4 border-t-indigo-500 bg-indigo-50/20">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
               <TrendingUp size={18} />
             </div>
             <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Retorno (ROI)</span>
          </div>
          <p className="text-[20px] font-display font-bold">{roi.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Technical Data */}
        <div className="lg:col-span-2 space-y-8">
          <div id="technical-specs" className="panel p-8">
            <h3 className="text-[16px] font-bold font-display flex items-center gap-3 mb-8 pb-4 border-b border-line">
              <Info size={18} className="text-accent" />
              Ficha Técnica do Veículo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Modelo / Fabricante</p>
                  <p className="font-semibold text-[15px]">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Ano / Modelo</p>
                  <p className="font-semibold text-[15px]">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Renavam</p>
                  <p className="font-semibold font-mono text-[14px]">{vehicle.renavam || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Chassi</p>
                  <p className="font-semibold font-mono text-[14px] uppercase">{vehicle.chassis || 'Não informado'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Quilometragem Atual</p>
                  <div className="flex items-center gap-2">
                    <Gauge size={14} className="text-accent" />
                    <p className="font-semibold text-[15px]">{vehicle.currentKm.toLocaleString()} KM</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Valor de Compra</p>
                  <p className="font-semibold text-[15px]">{formatCurrency(vehicle.purchaseValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Data de Aquisição</p>
                  <p className="font-semibold text-[15px]">{vehicle.purchaseDate ? formatDate(vehicle.purchaseDate) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Cor / Combustível</p>
                  <p className="font-semibold text-[15px]">Branco / Flex</p>
                </div>
              </div>
            </div>
          </div>

          <div id="maintenance-history" className="panel p-8">
            <h3 className="text-[16px] font-bold font-display flex items-center gap-3 mb-8 pb-4 border-b border-line">
              <History size={18} className="text-accent" />
              Histórico de Manutenções
            </h3>
            {maintenances.length === 0 ? (
              <div className="py-12 text-center text-subtle italic text-[14px]">Nenhuma manutenção registrada para este veículo.</div>
            ) : (
              <div className="space-y-4">
                 {maintenances.slice(0, 5).map((m, i) => (
                   <div key={m.id} className="flex items-center justify-between p-4 bg-bg/40 rounded-xl border border-line">
                     <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-10 h-10 rounded-lg flex items-center justify-center",
                         m.type === 'preventive' ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
                       )}>
                         <Wrench size={18} />
                       </div>
                       <div>
                         <p className="font-bold text-[14px]">{m.description.slice(0, 40)}{m.description.length > 40 ? '...' : ''}</p>
                         <p className="text-[11px] text-subtle uppercase tracking-wider">{formatDate(m.date)} • {m.km.toLocaleString()} KM</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-[14px] text-ink">{formatCurrency(m.cost)}</p>
                       <span className={cn(
                         "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                         m.type === 'preventive' ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
                       )}>{m.type}</span>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>

        {/* Insurance & Licensing Alerts */}
        <div className="space-y-8">
          <div id="alerts" className="panel p-6">
            <h3 className="text-[15px] font-bold font-display flex items-center gap-3 mb-6 pb-4 border-b border-line">
              <Shield size={18} className="text-accent" />
              Vencimentos & Alertas
            </h3>
            
            <div className="space-y-6">
              <div className="p-4 bg-surface border border-line rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Seguro Total</span>
                  <span className={cn(
                    "status-badge",
                    getExpiryStatus(vehicle.insuranceExpiry) === 'expired' ? "bg-danger/10 text-danger" : 
                    getExpiryStatus(vehicle.insuranceExpiry) === 'warning' ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                  )}>
                    {getExpiryStatus(vehicle.insuranceExpiry).toUpperCase()}
                  </span>
                </div>
                <p className="font-bold text-[15px]">{vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : 'N/A'}</p>
              </div>

              <div className="p-4 bg-surface border border-line rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Licenciamento</span>
                  <span className={cn(
                    "status-badge",
                    getExpiryStatus(vehicle.licensingExpiry) === 'expired' ? "bg-danger/10 text-danger" : 
                    getExpiryStatus(vehicle.licensingExpiry) === 'warning' ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                  )}>
                    {getExpiryStatus(vehicle.licensingExpiry).toUpperCase()}
                  </span>
                </div>
                <p className="font-bold text-[15px]">{vehicle.licensingExpiry ? formatDate(vehicle.licensingExpiry) : 'N/A'}</p>
              </div>

              <div className="p-4 bg-surface border border-line rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">Próxima Revisão</span>
                  <span className="bg-accent/10 text-accent status-badge">AGENDADA</span>
                </div>
                <p className="font-bold text-[15px]">{(vehicle.currentKm + 10000).toLocaleString()} KM</p>
                <p className="text-[11px] text-subtle mt-1 italic">Baseado no último registro</p>
              </div>
            </div>
          </div>

          <div id="roi-performance" className="panel p-6 bg-accent text-white border-none shadow-xl shadow-accent/20">
             <h3 className="text-[16px] font-bold mb-6 flex items-center gap-2">
               <TrendingUp size={18} /> Performance ROI
             </h3>
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between mb-2">
                      <span className="text-[12px] opacity-70">Payout / Custo</span>
                      <span className="text-[12px] font-bold">{roi.toFixed(1)}%</span>
                   </div>
                   <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-1000" 
                        style={{ width: `${Math.min(100, roi)}%` }}
                      ></div>
                   </div>
                </div>
                <p className="text-[12px] leading-relaxed opacity-80">
                  Este veículo já retornou {roi.toFixed(1)}% do seu valor de investimento inicial.
                  {roi >= 100 ? ' 🎉 O ativo já se pagou completamente!' : ' Faltam R$ ' + (vehicle.purchaseValue - netProfit).toLocaleString() + ' para o ponto de equilíbrio.'}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
