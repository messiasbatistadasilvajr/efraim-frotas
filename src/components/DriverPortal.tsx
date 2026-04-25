import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { CreditCard, History, AlertTriangle, Download, ArrowRight, User, CheckCircle2, DollarSign } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Driver, Contract, Payment, Fine } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { PixPaymentModal } from './PixPaymentModal';

export function DriverPortal() {
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPixModal, setShowPixModal] = useState(false);

  useEffect(() => {
    async function loadDriverInfo() {
      if (!auth.currentUser) return;
      
      // 1. Try to find the driver by the logged-in user's email (Real Driver Access)
      let driversSnap = await getDocs(query(collection(db, 'drivers'), where('email', '==', auth.currentUser.email)));
      
      // 2. Fallback: Simulation mode for owners (Existing logic)
      if (driversSnap.empty) {
        driversSnap = await getDocs(query(collection(db, 'drivers'), where('ownerId', '==', auth.currentUser.uid)));
      }

      if (!driversSnap.empty) {
        const d = ({ id: driversSnap.docs[0].id, ...driversSnap.docs[0].data() } as Driver);
        setActiveDriver(d);
        
        // IMPORTANT: Use the ownerId from the driver record to fetch contracts/payments
        const effectiveOwnerId = d.ownerId;

        const unsubC = onSnapshot(query(collection(db, 'contracts'), where('ownerId', '==', effectiveOwnerId), where('driverId', '==', d.id), where('status', '==', 'active')), (s) => {
          if (!s.empty) setContract({ id: s.docs[0].id, ...s.docs[0].data() } as Contract);
        });

        const unsubP = onSnapshot(query(collection(db, 'payments'), where('ownerId', '==', effectiveOwnerId), where('driverId', '==', d.id)), (s) => {
          setPayments(s.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
        });

        const unsubF = onSnapshot(query(collection(db, 'fines'), where('ownerId', '==', effectiveOwnerId), where('driverId', '==', d.id)), (s) => {
          setFines(s.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fine)));
        });

        setLoading(false);
        return () => { unsubC(); unsubP(); unsubF(); };
      }
      setLoading(false);
    }
    loadDriverInfo();
  }, []);

  if (loading) return <div>Carregando portal...</div>;
  if (!activeDriver) return <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-[#E4E3E0]">Nenhum motorista disponível para simular visualização.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto py-4">
      <header className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent rounded-[10px] flex items-center justify-center text-surface text-[20px] font-bold">
               {activeDriver.name[0]}
            </div>
            <div>
               <h2 className="text-[24px] font-bold tracking-tight">Olá, {activeDriver.name.split(' ')[0]}!</h2>
               <p className="text-subtle text-[14px]">Bem-vindo ao seu portal de parceiro</p>
            </div>
         </div>
         <div>
            <span className="status-badge bg-emerald-50 text-emerald-600">ATIVO</span>
         </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Current Rent Card */}
         <div className="panel bg-ink text-surface border-none p-8 space-y-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-surface/40 text-[10px] font-bold uppercase tracking-widest mb-1">Próximo Aluguel</p>
                  <h3 className="text-[32px] font-bold tracking-tight">{formatCurrency(contract?.pricePerWeek || 0)}</h3>
               </div>
               <div className="p-3 bg-surface/10 rounded-[10px]">
                  <CreditCard size={20} />
               </div>
            </div>
            
            <div className="space-y-3 pb-4">
               <div className="flex justify-between text-[13px] border-b border-surface/10 pb-2">
                  <span className="text-surface/40">Vencimento</span>
                  <span className="font-bold">25/04/2026</span>
               </div>
               <div className="flex justify-between text-[13px]">
                  <span className="text-surface/40">Período</span>
                  <span className="font-bold">18/04 - 25/04</span>
               </div>
            </div>

            <button 
              onClick={() => setShowPixModal(true)}
              className="w-full bg-surface text-ink py-4 rounded-[10px] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-bg transition-colors"
            >
               <DollarSign size={16} /> Pagar com PIX
            </button>
         </div>

         {/* Maintenance Status */}
         <div className="panel p-8 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-line">
               <AlertTriangle className="text-warning" size={18} />
               <h3 className="text-[16px] font-bold tracking-tight">Status e Alertas</h3>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-[10px] border border-emerald-100">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  <div>
                     <p className="text-[13px] font-bold text-emerald-900">Manutenção OK</p>
                     <p className="text-[11px] text-emerald-700 font-medium">Próxima revisão em 2.450km</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 p-4 bg-bg rounded-[10px] border border-line group cursor-pointer hover:border-accent transition-all">
                  <History className="text-subtle group-hover:text-accent" size={18} />
                  <div className="flex-1">
                     <p className="text-[13px] font-bold text-ink">Histórico de Multas</p>
                     <p className="text-[11px] text-subtle font-medium">{fines.length} infrações registradas</p>
                  </div>
                  <ArrowRight size={14} className="text-subtle/40 group-hover:text-accent" />
               </div>
            </div>
         </div>
      </div>

      <div className="panel overflow-hidden">
         <div className="p-6 border-b border-line flex items-center justify-between bg-bg/30">
            <h3 className="text-[15px] font-bold tracking-tight uppercase tracking-wider text-ink">Últimos Pagamentos</h3>
            <button className="text-[11px] font-bold text-accent uppercase tracking-widest hover:underline">Ver tudo</button>
         </div>
         <div className="divide-y divide-line">
            {payments.slice(0, 3).map(p => (
               <div key={p.id} className="p-6 flex items-center justify-between hover:bg-bg/50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-[8px] flex items-center justify-center">
                        <CreditCard size={18} />
                     </div>
                     <div>
                        <p className="text-[14px] font-bold text-ink">{p.type === 'weekly' ? 'Mensalidade Efraim Frotas' : p.type}</p>
                        <p className="text-[12px] text-subtle">{formatDate(p.date)}</p>
                     </div>
                  </div>
                  <span className="text-[15px] font-bold text-success">{formatCurrency(p.amount)}</span>
               </div>
            ))}
            {payments.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-subtle text-[13px] italic">Nenhum pagamento registrado.</p>
              </div>
            )}
         </div>
      </div>

      {showPixModal && contract && (
        <PixPaymentModal 
          amount={contract.pricePerWeek}
          driverName={activeDriver.name}
          description="Aluguel Semanal Efraim Frotas"
          onClose={() => setShowPixModal(false)}
        />
      )}
    </div>
  );
}
