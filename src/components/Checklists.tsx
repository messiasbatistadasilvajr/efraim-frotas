import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Plus, CheckSquare, Clipboard, Camera, AlertCircle, Search, Filter, Calendar, User } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Checklist, Contract, Vehicle, Driver } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';

interface ChecklistsProps {
  onSelectReport?: (id: string) => void;
}

export function Checklists({ onSelectReport }: ChecklistsProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    contractId: '', 
    type: 'delivery' as Checklist['type'], 
    date: new Date().toISOString().slice(0, 16), 
    km: 0,
    fuelLevel: '1/2',
    additionalNotes: '',
    items: [
      { category: 'Segurança', itemName: 'Pneu Estepe', status: 'ok' as const, note: '' },
      { category: 'Segurança', itemName: 'Macaco/Chave Roda', status: 'ok' as const, note: '' },
      { category: 'Exterior', itemName: 'Pneus e Rodas', status: 'ok' as const, note: '' },
      { category: 'Exterior', itemName: 'Lataria/Pintura', status: 'ok' as const, note: '' },
      { category: 'Exterior', itemName: 'Luzes/Faróis', status: 'ok' as const, note: '' },
      { category: 'Interior', itemName: 'Estofado/Limpeza', status: 'ok' as const, note: '' },
      { category: 'Interior', itemName: 'Ar Condicionado', status: 'ok' as const, note: '' },
      { category: 'Mecânica', itemName: 'Nível Óleo/Água', status: 'ok' as const, note: '' }
    ]
  });

  const categories = Array.from(new Set(formData.items.map(i => i.category)));

  useEffect(() => {
    if (!auth.currentUser) return;
    const ownerId = auth.currentUser.uid;
    const unsubCk = onSnapshot(query(collection(db, 'checklists'), where('ownerId', '==', ownerId)), (s) => setChecklists(s.docs.map(d => ({ id: d.id, ...d.data() } as Checklist))));
    const unsubC = onSnapshot(query(collection(db, 'contracts'), where('ownerId', '==', ownerId)), (s) => setContracts(s.docs.map(d => ({ id: d.id, ...d.data() } as Contract))));
    const unsubV = onSnapshot(query(collection(db, 'vehicles'), where('ownerId', '==', ownerId)), (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));
    const unsubD = onSnapshot(query(collection(db, 'drivers'), where('ownerId', '==', ownerId)), (s) => setDrivers(s.docs.map(d => ({ id: d.id, ...d.data() } as Driver))));
    return () => { unsubCk(); unsubC(); unsubV(); unsubD(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'checklists'), { ...formData, ownerId: auth.currentUser.uid, createdAt: serverTimestamp() });
      setShowModal(false);
    } catch (e) { console.error(e); }
  };

  const getContractDetails = (id: string) => {
    const c = contracts.find(c => c.id === id);
    const v = vehicles.find(v => v.id === c?.vehicleId);
    const d = drivers.find(d => d.id === c?.driverId);
    return { 
      vehicle: v ? `${v.model} (${v.plate})` : 'N/A',
      driver: d?.name || 'N/A'
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Checklists</h2>
          <p className="text-subtle text-[14px]">Inspeções de entrega e devolução de veículos</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={16} />
          Nova Inspeção
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...checklists].sort((a,b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        }).map(ck => {
          const details = getContractDetails(ck.contractId);
          const damagesCount = (ck.items || []).filter(i => i.status !== 'ok').length;

          return (
            <div key={ck.id} className="panel p-6 space-y-4 group hover:border-accent transition-all animate-in fade-in">
              <div className="flex justify-between items-start">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  ck.type === 'delivery' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-purple-50 text-purple-600 border border-purple-100"
                )}>
                  {ck.type === 'delivery' ? 'Entrega' : 'Devolução'}
                </div>
                <div className="text-subtle text-[11px] font-bold uppercase tracking-widest bg-bg px-2 py-1 rounded">
                  {formatDate(ck.date)}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[16px] text-ink">{details.vehicle}</h4>
                <p className="text-[13px] text-subtle flex items-center gap-1.5 mt-0.5">
                  <User size={12} className="text-accent" />
                  {details.driver}
                </p>
              </div>

              <div className="flex items-center gap-6 py-4 border-y border-line">
                 <div className="text-center flex-1">
                   <p className="text-[9px] text-subtle uppercase tracking-widest font-black mb-1">Odômetro</p>
                   <p className="font-bold text-[15px]">{ck.km.toLocaleString()} KM</p>
                 </div>
                 <div className="w-px h-8 bg-line" />
                 <div className="text-center flex-1">
                   <p className="text-[9px] text-subtle uppercase tracking-widest font-black mb-1">Status Geral</p>
                   <p className={cn("font-bold text-[15px]", damagesCount > 0 ? "text-danger" : "text-emerald-600")}>
                     {damagesCount > 0 ? `${damagesCount} Avarias` : 'Impecável'}
                   </p>
                 </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-subtle">
                  <span>Itens Marcados</span>
                  {(ck as any).fuelLevel && <span className="text-accent">Tanque: {(ck as any).fuelLevel}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(ck.items || []).slice(0, 3).map((item, idx) => (
                    <span key={idx} className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                      item.status === 'ok' ? "bg-bg text-subtle" : "bg-danger/5 text-danger border-danger/20"
                    )}>
                      {item.itemName}
                    </span>
                  ))}
                  {(ck.items || []).length > 3 && <span className="text-[10px] text-subtle">+{(ck.items || []).length - 3}</span>}
                </div>
              </div>

              <button 
                onClick={() => onSelectReport?.(ck.id)}
                className="w-full py-2 text-[12px] font-bold text-accent uppercase tracking-widest border border-line rounded-[6px] hover:bg-bg transition-colors"
              >
                Ver Laudo Completo
              </button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-2xl rounded-[12px] shadow-xl border border-line overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-line flex items-center justify-between shrink-0">
              <h3 className="text-[18px] font-bold tracking-tight">Realizar Checklist</h3>
              <button onClick={() => setShowModal(false)} className="text-subtle hover:text-ink">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Contrato / Veículo Ativo</label>
                  <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.contractId} onChange={e => setFormData({...formData, contractId: e.target.value})}>
                    <option value="">Selecionar contrato...</option>
                    {contracts.filter(c => c.status === 'active').map(c => {
                      const details = getContractDetails(c.id);
                      return <option key={c.id} value={c.id}>{details.vehicle} - {details.driver}</option>;
                    })}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Tipo de Inspeção</label>
                  <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value="delivery">Entrega (Saída)</option>
                    <option value="return">Devolução (Retorno)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Data da Inspeção</label>
                  <input required type="datetime-local" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] bg-surface" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Quilometragem Atual</label>
                  <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] bg-surface" value={formData.km} onChange={e => setFormData({...formData, km: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-1.5 shrink-0">
                <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Nível de Combustível</label>
                <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.fuelLevel} onChange={e => setFormData({...formData, fuelLevel: e.target.value})}>
                  <option value="Reserva">Reserva</option>
                  <option value="1/4">1/4</option>
                  <option value="1/2">1/2</option>
                  <option value="3/4">3/4</option>
                  <option value="Cheio">Cheio</option>
                </select>
              </div>

              <div className="space-y-6">
                 {categories.map(cat => (
                   <div key={cat} className="space-y-3">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                        <span className="w-1 h-3 bg-accent rounded-full"></span>
                        {cat}
                     </h4>
                     <div className="grid grid-cols-1 gap-3">
                       {formData.items.filter(i => i.category === cat).map((item, idx) => {
                         const globalIdx = formData.items.findIndex(gi => gi.itemName === item.itemName);
                         return (
                           <div key={idx} className="p-4 border border-line rounded-[10px] bg-bg/30 space-y-3">
                             <div className="flex justify-between items-center">
                               <span className="text-[13px] font-bold">{item.itemName}</span>
                               <div className="flex gap-1 bg-surface p-1 rounded-lg border border-line">
                                 <button 
                                   type="button"
                                   onClick={() => {
                                     const newItems = [...formData.items];
                                     newItems[globalIdx].status = 'ok';
                                     setFormData({...formData, items: newItems});
                                   }}
                                   className={cn("px-3 py-1 rounded-md text-[10px] font-bold transition-all", item.status === 'ok' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-subtle hover:bg-bg")}
                                 >OK</button>
                                 <button 
                                   type="button"
                                   onClick={() => {
                                     const newItems = [...formData.items];
                                     newItems[globalIdx].status = 'damage';
                                     setFormData({...formData, items: newItems});
                                   }}
                                   className={cn("px-3 py-1 rounded-md text-[10px] font-bold transition-all", item.status === 'damage' ? "bg-danger text-white shadow-md shadow-danger/20" : "text-subtle hover:bg-bg")}
                                 >AVARIA</button>
                               </div>
                             </div>
                             {item.status !== 'ok' && (
                               <input 
                                 type="text" 
                                 placeholder="Descreva a avaria encontrada..." 
                                 className="w-full text-[12px] bg-bg border border-line outline-none p-2 rounded-lg animate-in slide-in-from-top-1" 
                                 value={item.note} 
                                 onChange={e => {
                                   const newItems = [...formData.items];
                                   newItems[globalIdx].note = e.target.value;
                                   setFormData({...formData, items: newItems});
                                 }}
                               />
                             )}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 ))}
              </div>

              <div className="space-y-1.5 shrink-0">
                <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Observações Finais</label>
                <textarea rows={3} className="w-full border border-line rounded-[8px] p-2.5 text-[14px] bg-surface resize-none" value={formData.additionalNotes} onChange={e => setFormData({...formData, additionalNotes: e.target.value})} placeholder="Algo a ressaltar sobre esta inspeção?" />
              </div>

              <div className="flex gap-4 pt-4 border-t border-line shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[13px] font-semibold border border-line rounded-[8px] hover:bg-bg transition-all">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary py-3 text-[13px]">
                  Gerar Laudo e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
