import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Search, User, Phone, Mail, FileText, Trash2, Car, Calendar, CreditCard } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { FleetEngine } from '../lib/fleet-engine';
import { useToast } from './ToastProvider';
import { Driver, Contract, Vehicle } from '../types';
import { cn } from '../lib/utils';

interface DriversProps {
  onSelectDriver?: (id: string) => void;
  onSelectVehicle?: (id: string) => void;
}

export function Drivers({ onSelectDriver, onSelectVehicle }: DriversProps) {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRenting, setIsRenting] = useState(false);
  
  const initialFormData = {
    name: '', cnh: '', cnhExpiry: '', cpf: '', contact: '', email: '', status: 'active' as Driver['status'],
    depositBalance: 0,
    documents: {
      cnhUrl: '',
      residenceProofUrl: ''
    },
    // Contract fields
    vehicleId: '',
    startDate: new Date().toISOString().split('T')[0],
    pricePerWeek: 0,
    initialKm: 0,
    securityDeposit: 0
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (!auth.currentUser) return;
    const ownerId = auth.currentUser.uid;
    
    const unsubD = onSnapshot(query(collection(db, 'drivers'), where('ownerId', '==', ownerId)), (s) => setDrivers(s.docs.map(d => ({ id: d.id, ...d.data() } as Driver))));
    const unsubC = onSnapshot(query(collection(db, 'contracts'), where('ownerId', '==', ownerId), where('status', '==', 'active')), (s) => setContracts(s.docs.map(d => ({ id: d.id, ...d.data() } as Contract))));
    const unsubV = onSnapshot(query(collection(db, 'vehicles'), where('ownerId', '==', ownerId)), (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));
    
    return () => { unsubD(); unsubC(); unsubV(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      // 1. Create Driver
      const driverRef = await addDoc(collection(db, 'drivers'), { 
        name: formData.name,
        cnh: formData.cnh,
        cnhExpiry: formData.cnhExpiry,
        cpf: formData.cpf,
        contact: formData.contact,
        email: formData.email,
        status: formData.status,
        depositBalance: isRenting ? formData.securityDeposit : formData.depositBalance,
        documents: formData.documents,
        ownerId: auth.currentUser.uid 
      });

      // 2. If renting, create contract and update vehicle
      if (isRenting && formData.vehicleId) {
        // Create Contract
        const contractRef = await addDoc(collection(db, 'contracts'), {
          driverId: driverRef.id,
          vehicleId: formData.vehicleId,
          startDate: formData.startDate,
          pricePerWeek: formData.pricePerWeek,
          securityDeposit: formData.securityDeposit,
          initialKm: formData.initialKm,
          status: 'active',
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });

        // Update Vehicle Status
        await updateDoc(doc(db, 'vehicles', formData.vehicleId), {
          status: 'rented'
        });

        // Create Payment record for the deposit
        await addDoc(collection(db, 'payments'), {
          driverId: driverRef.id,
          contractId: contractRef.id,
          amount: formData.securityDeposit,
          type: 'deposit',
          date: new Date().toISOString(),
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      }

      setShowModal(false);
      setIsRenting(false);
      setFormData(initialFormData);
      showToast('Cadastro realizado com sucesso!', 'success');
    } catch (e: any) { 
      console.error(e);
      showToast('Erro ao realizar cadastro: ' + e.message, 'error');
    }
  };

  const filtered = drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.cpf.includes(searchTerm));

  const formatCurrencyLocal = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Motoristas</h2>
          <p className="text-subtle text-[14px]">Gestão de parceiros, cauções e documentos</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={16} />
          Novo Motorista
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF..." 
            className="w-full bg-surface border border-line rounded-[8px] pl-12 pr-4 py-3 text-[14px] outline-none focus:border-accent transition-colors shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Motorista</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Documentação</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">Saldo Caução</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((d) => {
              const isExpiring = d.cnhExpiry && new Date(d.cnhExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              const activeContract = contracts.find(c => c.driverId === d.id);
              const rentedVehicle = activeContract ? vehicles.find(v => v.id === activeContract.vehicleId) : null;
              
              return (
                <tr key={d.id} className="hover:bg-bg/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                        {d.name[0]}
                      </div>
                      <div 
                        className="cursor-pointer group/name"
                        onClick={() => onSelectDriver?.(d.id)}
                      >
                        <div className="font-bold text-[14px] group-hover/name:text-accent transition-colors">{d.name}</div>
                        <div className="text-[11px] text-subtle flex items-center gap-2 mt-0.5">
                          <Phone size={10} /> {d.contact}
                        </div>
                        {rentedVehicle && (
                          <div 
                            className="text-[10px] text-accent font-bold mt-1.5 flex items-center gap-1 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectVehicle?.(rentedVehicle.id);
                            }}
                          >
                            <User size={10} />
                            {rentedVehicle.plate} • {rentedVehicle.model}
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpiring && (
                      <span className="text-[10px] font-bold text-danger uppercase tracking-tighter mt-1 block ml-11">CNH Vencendo</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[13px] text-ink font-mono">{d.cpf}</div>
                    <div className="text-[11px] text-subtle flex items-center gap-2">
                       CNH: {d.cnh}
                       {d.documents?.cnhUrl && <FileText size={10} className="text-accent" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "text-[14px] font-bold",
                      (d.depositBalance || 0) < 500 ? "text-danger" : "text-emerald-600"
                    )}>
                      {formatCurrencyLocal(d.depositBalance || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-2 text-subtle hover:text-accent hover:bg-bg rounded-lg">
                          <FileText size={16} />
                       </button>
                       <button 
                         onClick={async () => { 
                           if(confirm('Excluir motorista?')) {
                             try {
                               await deleteDoc(doc(db, 'drivers', d.id));
                               showToast('Motorista removido.', 'success');
                             } catch (e: any) {
                               showToast('Erro ao remover: ' + e.message, 'error');
                             }
                           }
                         }}
                         className="p-2 text-subtle hover:text-danger hover:bg-danger/5 rounded-lg"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-[12px] shadow-xl border border-line overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h3 className="text-[18px] font-bold tracking-tight">Novo Motorista</h3>
              <button onClick={() => setShowModal(false)} className="text-subtle hover:text-ink transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Nome Completo</label>
                  <input required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">CPF</label>
                    <input required placeholder="000.000.000-00" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">WhatsApp</label>
                    <input required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">CNH</label>
                    <input required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.cnh} onChange={e => setFormData({...formData, cnh: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Venc. CNH</label>
                    <input required type="date" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.cnhExpiry} onChange={e => setFormData({...formData, cnhExpiry: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">E-mail</label>
                  <input required type="email" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="pt-4 border-t border-line">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      isRenting ? "bg-accent" : "bg-line"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        isRenting ? "left-6" : "left-1"
                      )} />
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isRenting} 
                      onChange={() => setIsRenting(!isRenting)} 
                    />
                    <span className="text-[13px] font-bold text-ink group-hover:text-accent transition-colors">Vincular veículo e contrato agora?</span>
                  </label>
                </div>

                {isRenting ? (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Veículo Disponível</label>
                        <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                          <option value="">Selecionar veículo...</option>
                          {vehicles.filter(v => v.status === 'available').map(v => (
                            <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Data Início</label>
                        <input required type="date" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Aluguel Semanal (R$)</label>
                        <input required type="number" step="0.01" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.pricePerWeek} onChange={e => setFormData({...formData, pricePerWeek: parseFloat(e.target.value)})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">KM Inicial</label>
                        <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.initialKm} onChange={e => setFormData({...formData, initialKm: parseInt(e.target.value)})} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Valor da Caução (R$)</label>
                      <input required type="number" step="0.01" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.securityDeposit} onChange={e => setFormData({...formData, securityDeposit: parseFloat(e.target.value)})} />
                      <p className="text-[10px] text-subtle italic">Isso criará automaticamente um registro financeiro de entrada.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Caução Inicial (R$)</label>
                    <input type="number" step="0.01" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.depositBalance} onChange={e => setFormData({...formData, depositBalance: parseFloat(e.target.value)})} />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-line">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[14px] font-semibold border border-line rounded-[8px] hover:bg-bg transition-all">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary py-3 text-[14px]">
                  Salvar Motorista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
