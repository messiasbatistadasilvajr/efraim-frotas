import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Plus, AlertCircle, FileText, User, Calendar, Search, Filter, CheckCircle, Clock, Scale, ShieldCheck, DollarSign, Info } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Fine, Vehicle, Driver, Contract } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { getWebhookConfig, triggerWebhook } from '../lib/webhooks';
import { LegalProtectionGuideModal } from './LegalProtectionGuideModal';

export function Fines() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showLegalGuide, setShowLegalGuide] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleId: '', date: new Date().toISOString().slice(0, 16), amount: 0, description: '', infractionCode: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const ownerId = auth.currentUser.uid;
    const unsubF = onSnapshot(query(collection(db, 'fines'), where('ownerId', '==', ownerId)), (s) => setFines(s.docs.map(d => ({ id: d.id, ...d.data() } as Fine))));
    const unsubV = onSnapshot(query(collection(db, 'vehicles'), where('ownerId', '==', ownerId)), (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));
    const unsubD = onSnapshot(query(collection(db, 'drivers'), where('ownerId', '==', ownerId)), (s) => setDrivers(s.docs.map(d => ({ id: d.id, ...d.data() } as Driver))));
    const unsubC = onSnapshot(query(collection(db, 'contracts'), where('ownerId', '==', ownerId)), (s) => setContracts(s.docs.map(d => ({ id: d.id, ...d.data() } as Contract))));
    return () => { unsubF(); unsubV(); unsubD(); unsubC(); };
  }, []);

  const findDriverForFine = (vehicleId: string, fineDate: string) => {
    const fineTime = new Date(fineDate).getTime();
    const relevantContract = contracts.find(c => 
      c.vehicleId === vehicleId && 
      new Date(c.startDate).getTime() <= fineTime && 
      (!c.endDate || new Date(c.endDate).getTime() >= fineTime)
    );
    return relevantContract?.driverId || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    const driverId = findDriverForFine(formData.vehicleId, formData.date);
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
    const selectedDriver = drivers.find(d => d.id === driverId);
    
    try {
      await addDoc(collection(db, 'fines'), { 
        ...formData, 
        driverId,
        status: 'pending',
        ownerId: auth.currentUser.uid, 
        createdAt: serverTimestamp() 
      });

      // n8n Google Sheets Backup Webhook
      const config = getWebhookConfig();
      if (config.sheetsUrl) {
        triggerWebhook(config.sheetsUrl, 'transaction.created', {
          id: Math.random().toString(36).substring(2, 11),
          date: formData.date ? formData.date.replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
          amount: formData.amount,
          type: 'DEBIT',
          category: 'Multa',
          description: `Infração de trânsito (Cód: ${formData.infractionCode || 'N/A'}): ${formData.description || 'Sem descrição'}`,
          driverName: selectedDriver ? selectedDriver.name : 'N/A',
          driverEmail: selectedDriver ? selectedDriver.email : 'N/A',
          driverContact: selectedDriver ? selectedDriver.contact : 'N/A',
          vehicleModel: selectedVehicle ? selectedVehicle.model : 'N/A',
          vehiclePlate: selectedVehicle ? selectedVehicle.plate : 'N/A'
        }).catch(err => console.error('Error triggering n8n sheets webhook:', err));
      }

      setShowModal(false);
      setFormData({ vehicleId: '', date: new Date().toISOString().slice(0, 16), amount: 0, description: '', infractionCode: '' });
    } catch (e) { console.error(e); }
  };

  const markAsPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, 'fines', id), { status: 'paid' });
    } catch (e) { console.error(e); }
  };

  const getVehicle = (id: string) => vehicles.find(v => v.id === id) || { model: 'N/A', plate: 'N/A' };
  const getDriver = (id: string) => drivers.find(d => d.id === id)?.name || 'N/A';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Gestão de Multas & Trâmites Detran</h2>
          <p className="text-subtle text-[14px]">Vínculo automático de infrações, indicação de condutor e desconto legal de caução</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowLegalGuide(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-surface hover:bg-bg text-ink border border-line rounded-xl transition-all"
            title="Manual Legal de Repasse de Multas e Caução"
          >
            <Scale size={16} className="text-accent" />
            <span>Regras Legais Detran</span>
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold"
          >
            <Plus size={16} />
            Registrar Multa
          </button>
        </div>
      </header>

      {/* Detran Protocol Legal Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface p-4 rounded-xl border border-line">
        <div className="flex items-start gap-3 p-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
            1
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-ink flex items-center gap-1">
              <ShieldCheck size={14} className="text-blue-600" />
              Indicação no Detran
            </h4>
            <p className="text-subtle mt-0.5 leading-relaxed">
              Transfira a pontuação para a CNH do motorista antes do prazo limite da Notificação de Autuação.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 border-t md:border-t-0 md:border-l border-line">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
            2
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-ink flex items-center gap-1">
              <DollarSign size={14} className="text-emerald-600" />
              Desconto na Caução/Cartão
            </h4>
            <p className="text-subtle mt-0.5 leading-relaxed">
              Debite o valor financeiro da caução retida ou processe cobrança direta no cartão do condutor.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 border-t md:border-t-0 md:border-l border-line">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
            3
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-ink flex items-center gap-1">
              <Scale size={14} className="text-indigo-600" />
              Reembolso Pós-Contrato
            </h4>
            <p className="text-subtle mt-0.5 leading-relaxed">
              O contrato assegura o direito de cobrança mesmo para multas notificadas meses após o fim da locação.
            </p>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between bg-bg/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={16} />
            <input type="text" placeholder="Buscar por placa ou código..." className="w-full bg-transparent border-none outline-none text-[13px] pl-10" />
          </div>
          <div className="flex gap-4">
             <button className="flex items-center gap-2 text-[11px] font-bold text-subtle hover:text-accent uppercase tracking-widest">
               <Filter size={14} /> Filtrar
             </button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Data & Hora</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Veículo</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Condutor (Auto)</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...fines].sort((a,b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return dateB - dateA;
            }).map(f => (
              <tr key={f.id} className="hover:bg-bg/50 transition-colors">
                <td className="px-6 py-4 text-[13px] text-subtle">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {formatDate(f.date)}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-[14px] font-bold">{getVehicle(f.vehicleId).model}</div>
                   <div className="text-[11px] font-mono text-subtle">{getVehicle(f.vehicleId).plate}</div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <User size={14} className="text-subtle" />
                     <span className={cn("text-[13px]", f.driverId ? "font-bold text-ink" : "italic text-danger")}>
                       {f.driverId ? getDriver(f.driverId) : 'Nenhum condutor no período'}
                     </span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "status-badge",
                    f.status === 'paid' ? "bg-emerald-50 text-emerald-600" : 
                    f.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-bg text-subtle"
                  )}> 
                    {f.status === 'paid' ? 'Paga' : f.status === 'pending' ? 'Pendente' : 'Contestada'} 
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="text-[14px] font-bold text-ink">{formatCurrency(f.amount)}</div>
                   {f.status === 'pending' && (
                     <button 
                       onClick={() => markAsPaid(f.id)}
                       className="text-[10px] text-accent font-bold hover:underline mt-1"
                     >
                       Marcar como Paga
                     </button>
                   )}
                </td>
              </tr>
            ))}
            {fines.length === 0 && (
              <tr>
                <td colSpan={5} className="p-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-subtle">
                    <CheckCircle size={32} className="opacity-20" />
                    <p className="text-[13px] italic">Nenhuma multa registrada.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-[12px] shadow-xl border border-line overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h3 className="text-[18px] font-bold tracking-tight">Registrar Nova Multa</h3>
              <button onClick={() => setShowModal(false)} className="text-subtle hover:text-ink transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Veículo</label>
                  <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                    <option value="">Selecionar veículo...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Data e Hora</label>
                    <input required type="datetime-local" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Valor (R$)</label>
                    <input required type="number" step="0.01" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Código da Infração</label>
                  <input type="text" placeholder="Ex: 501-0" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.infractionCode} onChange={e => setFormData({...formData, infractionCode: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Descrição</label>
                  <textarea className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface h-20 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-line">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[13px] font-semibold border border-line rounded-[8px] hover:bg-bg transition-all text-subtle">Descartar</button>
                <button type="submit" className="flex-1 btn-primary py-3 text-[13px]">
                  Vincular e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legal Protection Guide Modal for Fines */}
      <LegalProtectionGuideModal
        isOpen={showLegalGuide}
        initialTab="fines"
        onClose={() => setShowLegalGuide(false)}
      />
    </div>
  );
}
