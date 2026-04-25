import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Plus, Wrench, Calendar, MapPin, Search, AlertCircle, TrendingUp, Activity, Car, Settings, Gauge, DollarSign, FileText, Clipboard } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Maintenance, Vehicle } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export function MaintenanceList() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'preventive' | 'corrective'>('all');
  const [activeSection, setActiveSection] = useState<'history' | 'alerts' | 'performance'>('history');
  
  const [formData, setFormData] = useState({
    vehicleId: '', type: 'preventive' as Maintenance['type'], date: new Date().toISOString().split('T')[0], km: 0, cost: 0, description: '', workshopName: '', parts: [] as string[]
  });
  const [currentPart, setCurrentPart] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const ownerId = auth.currentUser.uid;
    const unsubM = onSnapshot(query(collection(db, 'maintenances'), where('ownerId', '==', ownerId)), (s) => setMaintenances(s.docs.map(d => ({ id: d.id, ...d.data() } as Maintenance))));
    const unsubV = onSnapshot(query(collection(db, 'vehicles'), where('ownerId', '==', ownerId)), (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));
    return () => { unsubM(); unsubV(); };
  }, []);

  const openAddMaintenance = (vehicleId?: string) => {
    if (vehicleId) {
      setFormData(prev => ({ ...prev, vehicleId }));
    } else {
      setFormData({
        vehicleId: '', type: 'preventive' as Maintenance['type'], date: new Date().toISOString().split('T')[0], km: 0, cost: 0, description: '', workshopName: '', parts: [] as string[]
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'maintenances'), { ...formData, ownerId: auth.currentUser.uid });
      // Update vehicle KM
      const v = vehicles.find(v => v.id === formData.vehicleId);
      if (v && formData.km > v.currentKm) {
        await updateDoc(doc(db, 'vehicles', v.id), { currentKm: formData.km });
      }
      setShowModal(false);
      setFormData({ vehicleId: '', type: 'preventive', date: new Date().toISOString().split('T')[0], km: 0, cost: 0, description: '', workshopName: '', parts: [] });
    } catch (e) { console.error(e); }
  };

  const addPart = () => {
    if (!currentPart.trim()) return;
    setFormData({ ...formData, parts: [...(formData.parts || []), currentPart.trim()] });
    setCurrentPart('');
  };

  const getVehicle = (id: string) => vehicles.find(v => v.id === id) || { model: 'N/A', plate: 'N/A' };

  const stats = useMemo(() => {
    const totalSpent = maintenances.reduce((acc, m) => acc + (m.cost || 0), 0);
    const thisMonth = maintenances.filter(m => {
      const d = new Date(m.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((acc, m) => acc + (m.cost || 0), 0);
    const preventiveCount = maintenances.filter(m => m.type === 'preventive').length;
    const correctiveCount = maintenances.filter(m => m.type === 'corrective').length;
    const healthRate = maintenances.length > 0 
      ? Math.round((preventiveCount / maintenances.length) * 100)
      : 100;
    
    return { totalSpent, thisMonth, preventiveCount, correctiveCount, healthRate };
  }, [maintenances]);

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter(m => {
      const v = getVehicle(m.vehicleId);
      const matchesSearch = v.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.workshopName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || m.type === filterType;
      return matchesSearch && matchesType;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenances, searchTerm, filterType, vehicles]);

  const topExpenses = useMemo(() => {
    return vehicles.map(v => {
      const vMaint = maintenances.filter(m => m.vehicleId === v.id);
      const total = vMaint.reduce((a, b) => a + (b.cost || 0), 0);
      return { ...v, totalExpense: total, count: vMaint.length };
    })
    .filter(v => v.totalExpense > 0)
    .sort((a, b) => b.totalExpense - a.totalExpense)
    .slice(0, 5);
  }, [vehicles, maintenances]);

  const upcomingMaintenances = useMemo(() => {
    return vehicles.map(v => {
      const vMaint = maintenances.filter(m => m.vehicleId === v.id).sort((a, b) => b.km - a.km);
      const lastKm = vMaint.length > 0 ? vMaint[0].km : v.currentKm - (v.currentKm % 10000);
      const nextKm = lastKm + 10000;
      const kmRemaining = nextKm - v.currentKm;
      
      return { ...v, nextKm, kmRemaining };
    }).sort((a, b) => a.kmRemaining - b.kmRemaining);
  }, [vehicles, maintenances]);

  const monthlyData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
      data[label] = 0;
    }

    maintenances.forEach(m => {
      const d = new Date(m.date);
      const label = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
      if (data[label] !== undefined) {
        data[label] += (m.cost || 0);
      }
    });

    return Object.entries(data).map(([label, cost]) => ({ label, cost }));
  }, [maintenances]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Manutenção</h2>
          <p className="text-subtle text-[14px]">Gestão técnica, histórico de peças e preventivas</p>
        </div>
        <div className="flex gap-4">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-subtle uppercase tracking-widest">Gasto Total</p>
              <p className="text-[20px] font-bold text-ink">{formatCurrency(stats.totalSpent)}</p>
           </div>
           <button 
            onClick={() => openAddMaintenance()}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Nova Manutenção
          </button>
        </div>
      </header>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="panel p-5 bg-surface border-line">
           <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Este Mês</p>
           <p className="text-[18px] font-bold text-ink">{formatCurrency(stats.thisMonth)}</p>
           <div className="flex items-center gap-1 mt-1 text-[10px] text-accent font-bold">
              <TrendingUp size={12} /> Gasto mensal
           </div>
        </div>
        <div className="panel p-5 bg-surface border-line">
           <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Preventivas</p>
           <p className="text-[18px] font-bold text-emerald-600">{stats.preventiveCount}</p>
           <p className="text-[10px] text-subtle mt-1 italic">Vidas salvas</p>
        </div>
        <div className="panel p-5 bg-surface border-line">
           <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Corretivas</p>
           <p className="text-[18px] font-bold text-danger">{stats.correctiveCount}</p>
           <p className="text-[10px] text-subtle mt-1 italic">Intervenções</p>
        </div>
        <div className="panel p-5 bg-accent text-white border-none shadow-lg shadow-accent/20">
           <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Taxa de Saúde</p>
           <p className="text-[18px] font-bold">{stats.healthRate}%</p>
           <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${stats.healthRate}%` }}></div>
           </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-line pb-px overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveSection('history')}
          className={cn(
            "px-6 py-3 text-[12px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
            activeSection === 'history' ? "border-accent text-accent bg-accent/5" : "border-transparent text-subtle hover:text-ink"
          )}
        >
          Histórico Geral
        </button>
        <button 
          onClick={() => setActiveSection('alerts')}
          className={cn(
            "px-6 py-3 text-[12px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
            activeSection === 'alerts' ? "border-accent text-accent bg-accent/5" : "border-transparent text-subtle hover:text-ink"
          )}
        >
          Alertas de Revisão
        </button>
        <button 
          onClick={() => setActiveSection('performance')}
          className={cn(
            "px-6 py-3 text-[12px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
            activeSection === 'performance' ? "border-accent text-accent bg-accent/5" : "border-transparent text-subtle hover:text-ink"
          )}
        >
          Análise de Desempenho
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
        {activeSection === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* List Filters */}
              <div className="flex items-center gap-4 bg-bg p-2 rounded-xl border border-line">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar por veículo, oficina ou descrição..." 
                    className="w-full bg-transparent pl-10 pr-4 py-2 text-[13px] outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex bg-surface rounded-lg p-1 border border-line shadow-sm">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={cn("px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all", filterType === 'all' ? "bg-accent text-white" : "text-subtle hover:text-ink")}
                  >Tudo</button>
                  <button 
                    onClick={() => setFilterType('preventive')}
                    className={cn("px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all", filterType === 'preventive' ? "bg-emerald-500 text-white" : "text-subtle hover:text-ink")}
                  >Prev.</button>
                  <button 
                    onClick={() => setFilterType('corrective')}
                    className={cn("px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all", filterType === 'corrective' ? "bg-danger text-white" : "text-subtle hover:text-ink")}
                  >Corr.</button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredMaintenances.length === 0 ? (
                  <div className="panel p-20 text-center space-y-4">
                    <Wrench size={48} className="mx-auto text-line" />
                    <p className="text-subtle font-medium">Nenhuma manutenção encontrada.</p>
                  </div>
                ) : (
                  filteredMaintenances.map(m => {
                    const v = getVehicle(m.vehicleId);
                    return (
                      <div key={m.id} className="panel hover:border-accent transition-all duration-300 overflow-hidden group">
                        <div className={cn(
                          "h-1 w-full",
                          m.type === 'preventive' ? "bg-emerald-500" : "bg-danger"
                        )}></div>
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-6">
                             <div className="flex items-center gap-4">
                               <div className={cn(
                                 "w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 border", 
                                 m.type === 'preventive' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-danger/5 border-danger/10 text-danger"
                               )}>
                                  <Wrench size={20} />
                               </div>
                               <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                     <span className="text-[10px] font-bold text-accent uppercase tracking-widest py-0.5 px-1.5 bg-accent/5 rounded">{v.plate}</span>
                                     <span className="text-subtle text-[14px]">/</span>
                                     <span className="font-bold text-[16px] text-ink">{v.model}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <MapPin size={12} className="text-subtle" />
                                     <span className="text-[12px] text-subtle font-medium">{m.workshopName || 'Oficina Geral'}</span>
                                  </div>
                               </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[18px] font-bold text-ink">{formatCurrency(m.cost)}</p>
                                <p className="text-[11px] text-subtle font-mono">{formatDate(m.date)}</p>
                             </div>
                          </div>

                          <div className="bg-bg/40 p-4 rounded-[10px] mb-6 border border-line/50">
                             <p className="text-[13px] text-ink leading-relaxed font-medium italic">"{m.description}"</p>
                          </div>
                          
                          {m.parts && m.parts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                              {m.parts.map((p, i) => (
                                <span key={i} className="text-[10px] px-2.5 py-1 bg-surface text-ink rounded-md font-bold uppercase tracking-widest border border-line shadow-sm">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-5 border-t border-line">
                             <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Quilometragem</span>
                                   <span className="text-[13px] font-bold text-ink flex items-center gap-1.5">
                                      <TrendingUp size={12} className="text-success" /> {m.km.toLocaleString()} KM
                                   </span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">Tipo de Serviço</span>
                                   <span className={cn(
                                     "text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter w-fit",
                                     m.type === 'preventive' ? "bg-emerald-500 text-white" : "bg-danger text-white"
                                   )}>
                                     {m.type === 'preventive' ? 'Preventiva' : 'Corretiva'}
                                   </span>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-6">
               <div className="panel overflow-hidden">
                  <div className="p-5 border-b border-line bg-ink/5">
                    <h3 className="text-[14px] font-bold uppercase tracking-widest flex items-center gap-2 italic">
                      <Activity size={16} className="text-accent" /> Maiores Despesas
                    </h3>
                  </div>
                  <div className="divide-y divide-line">
                     {topExpenses.map(v => (
                        <div key={v.id} className="p-4 hover:bg-bg/50 transition-colors flex items-center justify-between">
                           <div>
                              <p className="font-bold text-[13px]">{v.model}</p>
                              <p className="text-[11px] text-subtle uppercase tracking-widest">{v.plate}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-[14px] text-danger">{formatCurrency(v.totalExpense)}</p>
                              <p className="text-[10px] text-subtle">{v.count} ordens</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeSection === 'alerts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMaintenances.map(v => (
              <div key={v.id} className="panel p-6 space-y-6 hover:border-accent transition-all group relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all",
                  v.kmRemaining < 1000 ? "text-danger" : "text-accent"
                )}>
                  <Wrench size={128} />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h4 className="font-bold text-[18px] text-ink">{v.model}</h4>
                    <p className="text-[12px] font-mono font-bold text-accent uppercase tracking-widest">{v.plate}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    v.kmRemaining < 1000 ? "bg-danger/10 text-danger border border-danger/20" : "bg-warning/10 text-warning border border-warning/20"
                  )}>
                    {v.kmRemaining < 1000 ? 'Urgente' : 'Planejado'}
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-subtle uppercase tracking-widest font-mono">Faltam</span>
                    <span className={cn(
                      "text-[24px] font-black",
                      v.kmRemaining < 1000 ? "text-danger" : "text-ink"
                    )}>
                      {v.kmRemaining.toLocaleString()} <span className="text-[12px] opacity-40 uppercase">KM</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        v.kmRemaining < 1000 ? "bg-danger" : "bg-accent"
                      )}
                      style={{ width: `${Math.max(10, Math.min(100, 100 - (v.kmRemaining / 10000 * 100)))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-subtle">
                    <span>Última: {v.currentKm.toLocaleString()} KM</span>
                    <span>Meta: {v.nextKm.toLocaleString()} KM</span>
                  </div>
                </div>

                <button 
                  onClick={() => openAddMaintenance(v.id)}
                  className="w-full py-3 bg-bg border border-line rounded-[10px] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-accent hover:text-white hover:border-accent transition-all relative z-10"
                >
                  Agendar Agora →
                </button>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'performance' && (
          <div className="space-y-8 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="panel p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-line pb-6">
                  <h3 className="text-[16px] font-bold uppercase tracking-widest flex items-center gap-3 italic">
                    <TrendingUp size={20} className="text-accent" /> Histórico de Gastos (6 Meses)
                  </h3>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                      <Tooltip 
                        cursor={{fill: '#f5f7f9'}} 
                        contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px'}}
                        formatter={(val: number) => formatCurrency(val)}
                      />
                      <Bar dataKey="cost" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel p-8 space-y-8 bg-ink text-surface border-none shadow-2xl">
                <div className="flex items-center justify-between border-b border-surface/10 pb-6">
                  <h3 className="text-[16px] font-bold uppercase tracking-widest flex items-center gap-3">
                    <Activity size={20} className="text-accent" /> Top Gastos por Veículo
                  </h3>
                </div>
                <div className="space-y-6">
                  {topExpenses.map(v => (
                    <div key={v.id} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[14px] font-bold">{v.model}</p>
                          <p className="text-[10px] text-surface/40 uppercase tracking-widest font-mono">{v.plate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[16px] font-bold text-accent">{formatCurrency(v.totalExpense)}</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-surface/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-1000" 
                          style={{ width: `${(v.totalExpense / (topExpenses[0]?.totalExpense || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel p-8 bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
               <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                  <div className="space-y-3 max-w-xl">
                    <h3 className="text-[20px] font-bold leading-tight">Mantenha sua frota sempre rodando com segurança.</h3>
                    <p className="text-[14px] text-subtle leading-relaxed italic opacity-80">
                      O monitoramento proativo de revisões reduz em até 40% os custos imprevistos com corretivas pesadas. Use o painel de 
                      <strong> Alertas de Revisão</strong> para antecipar paradas.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-4">
                     <div className="text-center p-6 bg-surface border border-line rounded-2xl shadow-xl shadow-accent/5 min-w-[140px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-subtle mb-1">Total Acumulado</p>
                        <p className="text-[22px] font-black text-ink">{formatCurrency(stats.totalSpent)}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-xl rounded-[12px] shadow-xl border border-line overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-line flex items-center justify-between shrink-0">
              <h3 className="text-[18px] font-bold tracking-tight">Nova Manutenção Detalhada</h3>
              <button onClick={() => setShowModal(false)} className="text-subtle hover:text-ink transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 focus-within:text-accent transition-colors">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                    <Car size={12} /> Veículo
                  </label>
                  <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface transition-all" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                    <option value="">Selecionar veículo...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-accent transition-colors">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                    <MapPin size={12} /> Oficina / Estabelecimento
                  </label>
                  <input type="text" placeholder="Nome da oficina" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface transition-all" value={formData.workshopName} onChange={e => setFormData({...formData, workshopName: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 focus-within:text-accent transition-colors">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                    <Settings size={12} /> Tipo
                  </label>
                  <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface transition-all" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value="preventive">Preventiva</option>
                    <option value="corrective">Corretiva</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-accent transition-colors">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                    <Calendar size={12} /> Data
                  </label>
                  <input required type="date" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1.5 focus-within:text-accent transition-colors">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                    <Gauge size={12} /> KM Atual
                  </label>
                  <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface transition-all" value={formData.km} onChange={e => setFormData({...formData, km: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-1.5 focus-within:text-accent transition-colors">
                 <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                   <Clipboard size={12} /> Peças Trocadas
                 </label>
                 <div className="flex gap-2">
                    <input type="text" placeholder="Ex: Filtro de Oléo" className="flex-1 border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface transition-all" value={currentPart} onChange={e => setCurrentPart(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addPart())} />
                    <button type="button" onClick={addPart} className="px-6 bg-accent text-white font-bold rounded-[8px] hover:bg-accent/90 transition-all shadow-md shadow-accent/20">Add</button>
                 </div>
                 <div className="flex flex-wrap gap-2 mt-3">
                    {formData.parts.map((p, i) => (
                      <span key={i} className="text-[10px] bg-bg flex items-center gap-2 px-3 py-1.5 rounded-full border border-line font-bold uppercase tracking-widest animate-in zoom-in duration-200">
                        {p} 
                        <button type="button" onClick={() => setFormData({...formData, parts: formData.parts.filter((_, idx)=>idx!==i)})} className="text-danger hover:scale-125 transition-transform">×</button>
                      </span>
                    ))}
                 </div>
              </div>

              <div className="space-y-1.5 focus-within:text-accent transition-colors">
                <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                  <DollarSign size={12} /> Custo Total (R$)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle font-bold text-[14px]">R$</div>
                  <input required type="number" step="0.01" className="w-full border border-line rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] outline-none focus:border-accent bg-surface transition-all font-bold" value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-1.5 focus-within:text-accent transition-colors">
                <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                  <FileText size={12} /> Relato Técnico / Observações
                </label>
                <textarea placeholder="Descreva os serviços realizados..." className="w-full border border-line rounded-[8px] p-4 text-[14px] outline-none focus:border-accent bg-surface h-28 resize-none transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="flex gap-4 pt-4 border-t border-line shrink-0 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[14px] font-bold border border-line rounded-[10px] hover:bg-bg transition-all text-subtle uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary py-3 text-[12px] uppercase tracking-widest font-bold shadow-lg shadow-accent/20">
                  Registrar Ordem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
