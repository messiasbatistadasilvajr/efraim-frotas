import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, Search, MoreVertical, Fuel, Calendar, Hash, Trash2, Edit2, FileText } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Vehicle } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { useToast } from './ToastProvider';

interface FleetProps {
  onSelectVehicle?: (id: string) => void;
}

export function Fleet({ onSelectVehicle }: FleetProps) {
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    status: 'available' as Vehicle['status'],
    currentKm: 0,
    insuranceExpiry: '',
    licensingExpiry: '',
    purchaseValue: 0,
    documents: {
      crlvUrl: '',
      insurancePolicyUrl: ''
    }
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'vehicles'), where('ownerId', '==', auth.currentUser.uid));
    return onSnapshot(q, (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      if (selectedEditId) {
        await updateDoc(doc(db, 'vehicles', selectedEditId), {
          ...formData,
        });
        showToast('Veículo atualizado com sucesso!', 'success');
      } else {
        await addDoc(collection(db, 'vehicles'), {
          ...formData,
          ownerId: auth.currentUser.uid,
        });
        showToast('Veículo cadastrado com sucesso!', 'success');
      }
      handleCloseModal();
    } catch (e: any) {
      console.error(e);
      showToast('Erro ao salvar veículo: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedEditId(vehicle.id);
    setFormData({
      plate: vehicle.plate,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color || '',
      status: vehicle.status,
      currentKm: vehicle.currentKm,
      insuranceExpiry: vehicle.insuranceExpiry || '',
      licensingExpiry: vehicle.licensingExpiry || '',
      purchaseValue: vehicle.purchaseValue || 0,
      documents: {
        crlvUrl: vehicle.documents?.crlvUrl || '',
        insurancePolicyUrl: vehicle.documents?.insurancePolicyUrl || ''
      }
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEditId(null);
    setFormData({
      plate: '', model: '', year: new Date().getFullYear(), color: '',
      status: 'available', currentKm: 0, insuranceExpiry: '', licensingExpiry: '',
      purchaseValue: 0,
      documents: { crlvUrl: '', insurancePolicyUrl: '' }
    });
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExpiryStatus = (date: string) => {
    if (!date) return 'none';
    const day = 24 * 60 * 60 * 1000;
    const diff = new Date(date).getTime() - new Date().getTime();
    if (diff < 0) return 'expired';
    if (diff < 30 * day) return 'warning';
    return 'ok';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Veículos</h2>
          <p className="text-subtle text-[14px]">Gerencie os ativos e documentação da sua frota</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={16} />
          Novo Veículo
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por placa ou modelo..." 
            className="w-full bg-surface border border-line rounded-[8px] pl-12 pr-4 py-3 text-[14px] outline-none focus:border-accent transition-colors shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((v) => {
          const insStatus = getExpiryStatus(v.insuranceExpiry);
          const licStatus = getExpiryStatus(v.licensingExpiry);

          return (
            <div key={v.id} className="panel group overflow-hidden">
              {/* Status Header Strip */}
              <div className={cn(
                "h-1.5 w-full",
                v.status === 'rented' ? "bg-accent" : 
                v.status === 'available' ? "bg-success" : 
                v.status === 'maintenance' ? "bg-warning" : 
                "bg-slate-300"
              )}></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-ink uppercase tracking-wider">{v.plate}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <span className="text-[11px] font-bold text-subtle uppercase tracking-wider">{v.year}</span>
                    </div>
                    <h3 className="text-[18px] font-bold tracking-tight group-hover:text-accent transition-colors">{v.model}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn(
                      "status-badge",
                      v.status === 'available' ? "bg-emerald-100 text-emerald-700" :
                      v.status === 'rented' ? "bg-indigo-100 text-indigo-700" :
                      v.status === 'maintenance' ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {v.status === 'available' ? 'Disponível' : 
                       v.status === 'rented' ? 'Alugado' : 
                       v.status === 'maintenance' ? 'Manutenção' : 'Inativo'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[13px]">
                     <span className="text-subtle">Quilometragem</span>
                     <span className="font-medium">{v.currentKm.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                     <span className="text-subtle font-medium">Seguro</span>
                     <span className={cn(
                       "font-bold",
                       insStatus === 'expired' ? "text-danger" : insStatus === 'warning' ? "text-warning" : "text-success"
                     )}>
                       {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString() : 'N/A'}
                     </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                     <span className="text-subtle font-medium">Licenciamento</span>
                     <span className={cn(
                       "font-bold",
                       licStatus === 'expired' ? "text-danger" : licStatus === 'warning' ? "text-warning" : "text-success"
                     )}>
                       {v.licensingExpiry ? new Date(v.licensingExpiry).toLocaleDateString() : 'N/A'}
                     </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-line">
                   <div className="flex gap-2 items-center">
                     <div className={cn(
                       "w-2 h-2 rounded-full",
                       v.status === 'available' ? "bg-emerald-500" :
                       v.status === 'rented' ? "bg-indigo-500" :
                       v.status === 'maintenance' ? "bg-amber-500" : "bg-slate-400"
                     )} />
                     <span className="text-[12px] font-bold text-ink">
                        {v.status === 'available' ? 'Disponível' : 
                         v.status === 'rented' ? 'Alugado' : 
                         v.status === 'maintenance' ? 'Manutenção' : 'Inativo'}
                     </span>
                   </div>
                   <div className="flex gap-4">
                      {v.documents?.crlvUrl && (
                        <a href={v.documents.crlvUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-accent/10 rounded transition-colors" title="Ver CRLV">
                          <FileText size={14} className="text-accent" />
                        </a>
                      )}
                      {v.documents?.insurancePolicyUrl && (
                        <a href={v.documents.insurancePolicyUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-accent/10 rounded transition-colors" title="Ver Seguro">
                          <Hash size={14} className="text-accent" />
                        </a>
                      )}
                      <button 
                        onClick={() => onSelectVehicle?.(v.id)}
                        className="text-[12px] font-bold text-accent hover:underline"
                      >
                        Ver Ficha
                      </button>
                   </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-line">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-surface bg-accent/10 flex items-center justify-center text-accent text-[10px] font-bold">
                        {v.model[0]}
                      </div>
                      <div className="w-8 h-8 rounded-full border-2 border-surface bg-ink/5 flex items-center justify-center text-ink text-[10px] font-bold">
                        {v.plate.slice(-1)}
                      </div>
                   </div>
                   <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleEdit(v)}
                      className="p-2 text-subtle hover:text-accent hover:bg-accent/5 rounded-[10px] transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={async () => { 
                        if (v.status === 'rented') {
                          showToast('Não é possível excluir um veículo alugado. Encerre o contrato primeiro.', 'warning');
                          return;
                        }
                        if(confirm('Tem certeza que deseja excluir este veículo? Esta ação é irreversível.')) {
                          try {
                            await deleteDoc(doc(db, 'vehicles', v.id));
                            showToast('Veículo excluído com sucesso!', 'success');
                          } catch (e: any) {
                            showToast('Erro ao excluir: ' + e.message, 'error');
                          }
                        }
                      }}
                      className="p-2 text-subtle hover:text-danger hover:bg-danger/5 rounded-[10px] transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-xl rounded-[12px] shadow-xl border border-line overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h3 className="text-[18px] font-bold tracking-tight">
                {selectedEditId ? 'Editar Veículo' : 'Novo Veículo'}
              </h3>
              <button onClick={handleCloseModal} className="text-subtle hover:text-ink transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Placa</label>
                  <input required placeholder="ABC-1234" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Modelo</label>
                  <input required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Ano</label>
                  <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">KM Atual</label>
                  <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.currentKm} onChange={e => setFormData({...formData, currentKm: parseInt(e.target.value)})} />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Venc. Seguro</label>
                  <input type="date" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.insuranceExpiry} onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Venc. Licenciamento</label>
                  <input type="date" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.licensingExpiry} onChange={e => setFormData({...formData, licensingExpiry: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Valor Compra (R$)</label>
                  <input required type="number" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.purchaseValue} onChange={e => setFormData({...formData, purchaseValue: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Status</label>
                  <select className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value="available">Disponível</option>
                    <option value="rented">Alugado</option>
                    <option value="maintenance">Manutenção</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                    <FileText size={12} /> URL do CRLV (Digital)
                  </label>
                  <input placeholder="https://..." className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.documents.crlvUrl} onChange={e => setFormData({...formData, documents: {...formData.documents, crlvUrl: e.target.value}})} />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle flex items-center gap-2">
                    <Hash size={12} /> URL da Apólice de Seguro
                  </label>
                  <input placeholder="https://..." className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.documents.insurancePolicyUrl} onChange={e => setFormData({...formData, documents: {...formData.documents, insurancePolicyUrl: e.target.value}})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-line">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 text-[14px] font-semibold border border-line rounded-[8px] hover:bg-bg transition-all">Cancelar</button>
                <button disabled={loading} type="submit" className="flex-1 btn-primary py-3 text-[14px]">
                  {loading ? 'Salvando...' : selectedEditId ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
