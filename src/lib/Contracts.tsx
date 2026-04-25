import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Plus, Car, User, Calendar, CreditCard, CheckCircle2, XCircle, Search } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Contract, Vehicle, Driver } from '../types';
import { cn, formatCurrency, formatDate } from '../lib/utils';

import { ContractChecklist } from './ContractChecklist';

interface ContractsProps {
  initialDriverId?: string | null;
  onSelectVehicle?: (id: string) => void;
}

export function Contracts({ initialDriverId, onSelectVehicle }: ContractsProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [checklistData, setChecklistData] = useState<{ id: string, type: 'delivery' | 'return' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormData = {
    driverId: initialDriverId || '', 
    vehicleId: '', 
    startDate: new Date().toISOString().split('T')[0], 
    pricePerWeek: 0, 
    securityDeposit: 0, 
    initialKm: 0,
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (editingContract) {
      setFormData({
        driverId: editingContract.driverId,
        vehicleId: editingContract.vehicleId,
        startDate: editingContract.startDate,
        pricePerWeek: editingContract.pricePerWeek,
        securityDeposit: editingContract.securityDeposit,
        initialKm: editingContract.initialKm,
      });
      setShowModal(true);
    }
  }, [editingContract]);

  useEffect(() => {
    if (!showModal) {
      setEditingContract(null);
      setFormData(initialFormData);
    }
  }, [showModal]);

  useEffect(() => {
    if (initialDriverId && drivers.length > 0) {
      const driver = drivers.find(d => d.id === initialDriverId);
      if (driver) {
        setSearchTerm(driver.name);
      }
    }
  }, [initialDriverId, drivers]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const ownerId = auth.currentUser.uid;
    
    const unsubC = onSnapshot(query(collection(db, 'contracts'), where('ownerId', '==', ownerId)), (s) => setContracts(s.docs.map(d => ({ id: d.id, ...d.data() } as Contract))));
    const unsubV = onSnapshot(query(collection(db, 'vehicles'), where('ownerId', '==', ownerId)), (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));
    const unsubD = onSnapshot(query(collection(db, 'drivers'), where('ownerId', '==', ownerId)), (s) => setDrivers(s.docs.map(d => ({ id: d.id, ...d.data() } as Driver))));
    
    return () => { unsubC(); unsubV(); unsubD(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      if (editingContract) {
        // Find if vehicle changed
        if (editingContract.vehicleId !== formData.vehicleId) {
          // Set old vehicle to available
          await updateDoc(doc(db, 'vehicles', editingContract.vehicleId), { status: 'available' });
          // Set new vehicle to rented
          await updateDoc(doc(db, 'vehicles', formData.vehicleId), { status: 'rented' });
        }

        await updateDoc(doc(db, 'contracts', editingContract.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'contracts'), {
          ...formData,
          status: 'active',
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        await updateDoc(doc(db, 'vehicles', formData.vehicleId), {
          status: 'rented'
        });
      }
      
      setShowModal(false);
    } catch (e) { console.error(e); }
  };

  const handleCloseContract = async (contract: Contract) => {
    try {
      await updateDoc(doc(db, 'contracts', contract.id), {
        status: 'closed',
        endDate: new Date().toISOString()
      });
      await updateDoc(doc(db, 'vehicles', contract.vehicleId), {
        status: 'available'
      });
    } catch (e) {
      console.error("Error closing contract:", e);
    }
  };

  const getVehicle = (id: string) => vehicles.find(v => v.id === id) || { model: 'N/A', plate: 'N/A' };
  const getDriver = (id: string) => drivers.find(d => d.id === id) || { name: 'Desconhecido' };

  const filteredContracts = contracts.filter(c => {
    if (!searchTerm) return true;
    const driver = getDriver(c.driverId);
    const vehicle = getVehicle(c.vehicleId);
    return driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Contratos</h2>
          <p className="text-subtle text-[14px]">Locações ativas e histórico de parcerias</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={16} />
          Novo Contrato
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por motorista, placa ou modelo..." 
            className="w-full bg-surface border border-line rounded-[8px] pl-12 pr-4 py-3 text-[14px] outline-none focus:border-accent transition-colors shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[...filteredContracts].sort((a,b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        }).map((c) => {
          const v = getVehicle(c.vehicleId);
          const d = getDriver(c.driverId);
          return (
            <div key={c.id} className="panel group overflow-hidden">
               <div className={cn(
                "h-1.5 w-full",
                c.status === 'active' ? "bg-accent" : "bg-slate-300"
              )}></div>
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      onClick={() => setEditingContract(c)}
                      className="w-10 h-10 bg-accent/10 rounded-[10px] flex items-center justify-center text-accent font-bold cursor-pointer hover:bg-accent/20 transition-colors"
                    >
                       {d?.name ? d.name[0] : '?'}
                    </div>
                    <div>
                      <h4 
                        onClick={() => setEditingContract(c)}
                        className="font-bold text-[15px] cursor-pointer hover:text-accent transition-colors"
                      >
                        {d?.name}
                      </h4>
                      <button 
                        onClick={() => onSelectVehicle?.(c.vehicleId)}
                        className="text-[11px] text-subtle uppercase tracking-wider font-medium hover:text-accent transition-colors text-left"
                      >
                        {v?.plate} • {v?.model}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-[2]">
                  <div>
                    <p className="text-[11px] font-bold text-subtle uppercase tracking-widest mb-1">Início</p>
                    <p className="text-[13px] font-medium">{formatDate(c.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-subtle uppercase tracking-widest mb-1">Semanal</p>
                    <p className="text-[13px] font-medium">{formatCurrency(c.pricePerWeek)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-subtle uppercase tracking-widest mb-1">Caução</p>
                    <p className="text-[13px] font-medium">{formatCurrency(c.securityDeposit)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1.5">
                     <button 
                       onClick={() => setChecklistData({ id: c.id, type: 'delivery' })}
                       className="text-[11px] font-bold text-ink hover:bg-bg border border-line px-3 py-1.5 rounded-[6px] transition-all"
                     > 
                       Checklist Entrega
                     </button>
                     <button 
                        onClick={() => setChecklistData({ id: c.id, type: 'return' })}
                        className="text-[11px] font-bold text-subtle hover:bg-bg border border-line px-3 py-1.5 rounded-[6px] transition-all"
                     > 
                       Checklist Devolução
                     </button>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={cn(
                      "status-badge",
                      c.status === 'active' ? "bg-accent/10 text-accent" : "bg-slate-100 text-subtle"
                    )}>
                      {c.status === 'active' ? 'Ativo' : 'Finalizado'}
                    </span>
                    {c.status === 'active' && (
                      <button 
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja finalizar este contrato? O veículo ficará disponível novamente.')) {
                            handleCloseContract(c);
                          }
                        }}
                        className="text-[12px] font-bold text-danger hover:underline"
                      >
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {contracts.length === 0 && (
          <div className="p-20 text-center border-2 border-line border-dashed rounded-[12px]">
            <p className="text-subtle text-sm italic">Nenhum contrato ativo. Comece criando um novo.</p>
          </div>
        )}
      </div>

      {checklistData && (
        <ContractChecklist 
          contractId={checklistData.id} 
          type={checklistData.type} 
          onClose={() => setChecklistData(null)} 
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-[12px] shadow-xl border border-line overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h3 className="text-[18px] font-bold tracking-tight">
                {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-subtle hover:text-ink transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Motorista</label>
                  <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})}>
                    <option value="">Selecionar...</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} {driver.status === 'inactive' ? '(Inativo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Veículo</label>
                  <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                    <option value="">Selecionar...</option>
                    {vehicles.filter(v => v.status === 'available' || v.id === editingContract?.vehicleId).map(v => (
                      <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Data Início</label>
                  <input required type="date" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Valor Semanal</label>
                  <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.pricePerWeek} onChange={e => setFormData({...formData, pricePerWeek: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Caução (Depósito)</label>
                  <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.securityDeposit} onChange={e => setFormData({...formData, securityDeposit: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">KM Inicial</label>
                  <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.initialKm} onChange={e => setFormData({...formData, initialKm: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[14px] font-semibold border border-line rounded-[8px] hover:bg-bg transition-all">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary py-3 text-[14px]">
                  {editingContract ? 'Salvar Alterações' : 'Criar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
