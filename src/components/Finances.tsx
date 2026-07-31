import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { Plus, DollarSign, TrendingUp, TrendingDown, Clock, Search, Filter, AlertCircle, Smartphone } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Payment, Driver, Contract } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { PixPaymentModal } from './PixPaymentModal';
import { getWebhookConfig, triggerWebhook } from '../lib/webhooks';

export function Finances() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'deposits' | 'earnings'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pixCharge, setPixCharge] = useState<{ amount: number; name: string } | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [formData, setFormData] = useState({
    driverId: '', contractId: '', amount: 0, type: 'weekly' as Payment['type'], date: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const ownerId = auth.currentUser.uid;
    const unsubP = onSnapshot(query(collection(db, 'payments'), where('ownerId', '==', ownerId)), (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() } as Payment))));
    const unsubD = onSnapshot(query(collection(db, 'drivers'), where('ownerId', '==', ownerId)), (s) => setDrivers(s.docs.map(d => ({ id: d.id, ...d.data() } as Driver))));
    const unsubC = onSnapshot(query(collection(db, 'contracts'), where('ownerId', '==', ownerId), where('status', '==', 'active')), (s) => setContracts(s.docs.map(d => ({ id: d.id, ...d.data() } as Contract))));
    return () => { unsubP(); unsubD(); unsubC(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      const paymentData = { ...formData, ownerId: auth.currentUser.uid, createdAt: new Date().toISOString() };
      await addDoc(collection(db, 'payments'), { ...formData, ownerId: auth.currentUser.uid, createdAt: serverTimestamp() });
      
      // Update Driver Deposit Balance if type is deposit
      const selectedDriver = drivers.find(d => d.id === formData.driverId);
      if (formData.type === 'deposit' && selectedDriver) {
        const currentBalance = selectedDriver.depositBalance || 0;
        await updateDoc(doc(db, 'drivers', selectedDriver.id), { depositBalance: currentBalance + formData.amount });
      }

      // n8n Webhook Trigger
      const config = getWebhookConfig();
      if (config.paymentUrl) {
        triggerWebhook(config.paymentUrl, 'payment.created', {
          ...paymentData,
          driverName: selectedDriver ? selectedDriver.name : 'N/A',
          driverEmail: selectedDriver ? selectedDriver.email : 'N/A',
          driverContact: selectedDriver ? selectedDriver.contact : 'N/A'
        }).catch(err => console.error('Error triggering n8n payment webhook:', err));
      }

      // n8n Google Sheets Backup Webhook
      if (config.sheetsUrl) {
        triggerWebhook(config.sheetsUrl, 'transaction.created', {
          id: Math.random().toString(36).substring(2, 11),
          date: formData.date ? formData.date.replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
          amount: formData.amount,
          type: 'CREDIT',
          category: formData.type === 'weekly' ? 'Aluguel Semanal' :
                    formData.type === 'deposit' ? 'Caução' :
                    formData.type === 'earnings' ? 'Ganhos Brutos' : 'Ajustes/Outros',
          description: `Recebimento registrado no financeiro para o condutor ${selectedDriver ? selectedDriver.name : 'N/A'}`,
          driverName: selectedDriver ? selectedDriver.name : 'N/A',
          driverEmail: selectedDriver ? selectedDriver.email : 'N/A',
          driverContact: selectedDriver ? selectedDriver.contact : 'N/A'
        }).catch(err => console.error('Error triggering n8n sheets webhook:', err));
      }

      setShowModal(false);
      setFormData({ driverId: '', contractId: '', amount: 0, type: 'weekly', date: new Date().toISOString().slice(0, 16) });
    } catch (e) { console.error(e); }
  };

  const getDriver = (id: string) => drivers.find(d => d.id === id)?.name || 'N/A';

  const periodPayments = payments.filter(p => {
    if (!p.date) return true;
    const pDate = new Date(p.date).getTime();
    const start = new Date(dateRange.start + 'T00:00:00').getTime();
    const end = new Date(dateRange.end + 'T23:59:59').getTime();
    return pDate >= start && pDate <= end;
  });

  const totalReceived = periodPayments.filter(p => p.type !== 'earnings').reduce((acc, p) => acc + p.amount, 0);

  const overdueAlerts = contracts.map(c => {
    const driver = drivers.find(d => d.id === c.driverId);
    if (!driver) return null;

    const contractPayments = payments.filter(p => p.contractId === c.id && p.type === 'weekly');
    const totalPaid = contractPayments.reduce((acc, p) => acc + p.amount, 0);

    const start = new Date(c.startDate).getTime();
    const now = new Date().getTime();
    const weeksPassed = Math.max(0, Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)));
    
    // Postpaid assumption: first payment due after 1 week
    const expected = weeksPassed * c.pricePerWeek;
    const balance = totalPaid - expected;

    if (balance < 0) {
      const amountDue = Math.abs(balance);
      const paidWeeks = totalPaid / c.pricePerWeek;
      const lastPaymentCoveredUntil = new Date(start + (paidWeeks * 7 * 24 * 60 * 60 * 1000));
      const daysOverdue = Math.floor((now - lastPaymentCoveredUntil.getTime()) / (24 * 60 * 60 * 1000));

      return {
        driverName: driver.name,
        amountDue,
        daysOverdue: Math.max(0, daysOverdue)
      };
    }
    return null;
  }).filter((a): a is { driverName: string; amountDue: number; daysOverdue: number } => a !== null);

  const filteredPayments = periodPayments.filter(p => {
    const matchesTab = activeTab === 'deposits' ? p.type === 'deposit' :
                     activeTab === 'earnings' ? p.type === 'earnings' :
                     p.type !== 'earnings';
    
    if (!matchesTab) return false;

    if (searchTerm) {
      const driverName = getDriver(p.driverId).toLowerCase();
      const typeLabel = (p.type === 'weekly' ? 'semanal' : 
                         p.type === 'deposit' ? 'caução' : 
                         p.type === 'earnings' ? 'ganhos brutos' : 
                         'ajuste reparo multa').toLowerCase();
      return driverName.includes(searchTerm.toLowerCase()) || 
             typeLabel.includes(searchTerm.toLowerCase()) ||
             p.amount.toString().includes(searchTerm);
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Financeiro</h2>
          <p className="text-subtle text-[14px]">Gestão de fluxo de caixa, cauções e faturamento bruto</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-end w-full md:w-auto">
          <div className="text-center sm:text-right w-full sm:w-auto">
             <span className="text-[10px] font-bold text-subtle uppercase tracking-widest block">Receita Acumulada</span>
             <span className="text-[20px] font-bold text-ink">{formatCurrency(totalReceived)}</span>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button 
              onClick={() => {
                const overdue = overdueAlerts[0];
                if (overdue) {
                  setPixCharge({ amount: overdue.amountDue, name: overdue.driverName });
                } else if (drivers.length > 0) {
                  setPixCharge({ amount: 0, name: drivers[0].name });
                }
              }}
              className="flex-1 sm:flex-none btn-secondary flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              Gerar PIX
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Novo Lançamento
            </button>
          </div>
        </div>
      </header>

      {/* Overdue Payment Alerts */}
      {overdueAlerts.length > 0 && (
        <div className="panel p-6 border-l-4 border-l-danger bg-danger/[0.02]">
           <div className="flex items-center justify-between mb-4 pb-4 border-b border-line">
            <h3 className="text-[16px] font-bold flex items-center gap-2">
              <div className="p-1.5 bg-danger/10 rounded-lg">
                <AlertCircle size={18} className="text-danger" />
              </div>
              Pagamentos Atrasados
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-widest text-danger px-2 py-1 bg-danger/10 rounded">
              {overdueAlerts.length} Pendência(s)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueAlerts.map((alert, i) => (
              <div 
                key={i} 
                className="flex flex-col p-4 bg-surface border border-line rounded-[8px] shadow-sm cursor-pointer hover:border-danger transition-all group"
                onClick={() => setPixCharge({ amount: alert.amountDue, name: alert.driverName })}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[14px] font-bold text-ink group-hover:text-danger transition-colors">{alert.driverName}</span>
                  <span className="text-[12px] font-bold text-danger">
                    {formatCurrency(alert.amountDue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-subtle" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-subtle">
                      {alert.daysOverdue} {alert.daysOverdue === 1 ? 'dia' : 'dias'} de atraso
                    </span>
                  </div>
                  <Smartphone size={14} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Semanal', type: 'weekly', color: 'text-accent', bg: 'bg-accent/[0.03]' },
          { label: 'Cauções', type: 'deposit', color: 'text-success', bg: 'bg-success/[0.03]' },
          { label: 'Ganhos Brutos', type: 'earnings', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Outros', type: 'repair', color: 'text-subtle', bg: 'bg-bg' }
        ].map(item => (
          <div key={item.type} className={cn("panel p-4 border-t-2", item.bg, item.bg.replace('bg-', 'border-t-').replace('/[0.03]', ''))}>
             <p className="text-[10px] font-bold text-subtle uppercase tracking-widest mb-1">{item.label}</p>
             <p className={cn("text-[18px] font-display font-bold", item.color)}>
               {formatCurrency(periodPayments.filter(p => p.type === item.type || (item.type === 'repair' && (p.type === 'fine' || p.type === 'repair'))).reduce((a, b) => a + b.amount, 0))}
             </p>
          </div>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col md:flex-row items-center justify-between bg-bg/30 gap-4">
           <div className="flex gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
             {['all', 'deposits', 'earnings'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={cn(
                   "text-[11px] font-bold uppercase tracking-widest pb-1 transition-all border-b-2 whitespace-nowrap",
                   activeTab === tab ? "border-accent text-ink" : "border-transparent text-subtle hover:text-ink"
                 )}
               >
                 {tab === 'all' ? 'Entradas' : tab === 'deposits' ? 'Cauções' : 'Ganhos Brutos (Uber)'}
               </button>
             ))}
           </div>
           <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-1.5">
               <Filter size={14} className="text-subtle" />
               <input 
                 type="date" 
                 value={dateRange.start}
                 onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                 className="bg-transparent border-none outline-none text-[12px] font-medium"
               />
               <span className="text-subtle text-[12px]">até</span>
               <input 
                 type="date" 
                 value={dateRange.end}
                 onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                 className="bg-transparent border-none outline-none text-[12px] font-medium"
               />
             </div>
             <div className="relative flex-1 md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={14} />
               <input 
                 type="text" 
                 placeholder="Filtrar lançamentos..." 
                 className="w-full bg-bg border border-line rounded-lg py-1.5 pl-9 pr-4 text-[12px] outline-none focus:border-accent" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
           </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Data</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Motorista</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Tipo</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[...filteredPayments].sort((a,b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return dateB - dateA;
            }).map(p => (
              <tr key={p.id} className="hover:bg-bg/50 transition-colors">
                <td className="px-6 py-4 text-[13px] text-subtle">{formatDate(p.date)}</td>
                <td className="px-6 py-4">
                  <span className="text-[14px] font-bold">{getDriver(p.driverId)}</span>
                  {p.type === 'deposit' && (
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase">Saldo Atual: {formatCurrency(drivers.find(d => d.id === p.driverId)?.depositBalance || 0)}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "status-badge",
                    p.type === 'weekly' ? "bg-ink text-surface" :
                    p.type === 'deposit' ? "bg-emerald-50 text-emerald-600" :
                    p.type === 'earnings' ? "bg-blue-50 text-blue-600" :
                    "bg-amber-50 text-amber-600"
                  )}> 
                    {p.type === 'weekly' ? 'Semanal' : p.type === 'deposit' ? 'Caução' : p.type === 'earnings' ? 'Ganhos Brutos' : 'Ajuste/Outros'} 
                  </span>
                </td>
                <td className={cn(
                  "px-6 py-4 text-right text-[14px] font-bold",
                  p.type === 'earnings' ? "text-blue-600" : "text-ink"
                )}>{formatCurrency(p.amount)}</td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-subtle text-[12px] italic">Nenhum lançamento nesta categoria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-[12px] shadow-xl border border-line overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h3 className="text-[18px] font-bold tracking-tight">Novo Registro Financeiro</h3>
              <button onClick={() => setShowModal(false)} className="text-subtle hover:text-ink transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Motorista</label>
                  <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value, contractId: contracts.find(c => c.driverId === e.target.value)?.id || ''})}>
                    <option value="">Selecionar motorista...</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Valor (R$)</label>
                    <input required type="number" step="0.01" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Tipo de Lançamento</label>
                    <select required className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                      <option value="weekly">Semanal (Aluguel)</option>
                      <option value="deposit">Caução (Segurança)</option>
                      <option value="earnings">Ganhos Brutos (Uber App)</option>
                      <option value="repair">Reparo / Ajuste</option>
                      <option value="fine">Multa</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Data e Hora</label>
                  <input type="datetime-local" className="w-full border border-line rounded-[8px] p-2.5 text-[14px] outline-none focus:border-accent bg-surface" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-line">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[13px] font-semibold border border-line rounded-[8px] hover:bg-bg transition-all">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary py-3 text-[13px]">
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pixCharge && (
        <PixPaymentModal 
          amount={pixCharge.amount}
          driverName={pixCharge.name}
          description="Cobrança Avulsa Efraim Frotas"
          onClose={() => setPixCharge(null)}
        />
      )}
    </div>
  );
}
