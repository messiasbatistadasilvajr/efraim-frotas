import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Printer, Download, Share2, ClipboardCheck, Car, User, Calendar, MapPin, Search } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { Checklist, Contract, Vehicle, Driver } from '../types';
import { formatDate, cn } from '../lib/utils';

interface CautionaryReportProps {
  checklistId: string;
  onBack: () => void;
}

export function CautionaryReport({ checklistId, onBack }: CautionaryReportProps) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!checklistId) return;
      setLoading(true);
      try {
        const ckDoc = await getDoc(doc(db, 'checklists', checklistId));
        if (ckDoc.exists()) {
          const ckData = { id: ckDoc.id, ...ckDoc.data() } as Checklist;
          setChecklist(ckData);

          // Fetch Contract
          const cDoc = await getDoc(doc(db, 'contracts', ckData.contractId));
          if (cDoc.exists()) {
            const cData = { id: cDoc.id, ...cDoc.data() } as Contract;
            setContract(cData);

            // Fetch Vehicle
            const vDoc = await getDoc(doc(db, 'vehicles', cData.vehicleId));
            if (vDoc.exists()) setVehicle({ id: vDoc.id, ...vDoc.data() } as Vehicle);

            // Fetch Driver
            const dDoc = await getDoc(doc(db, 'drivers', cData.driverId));
            if (dDoc.exists()) setDriver({ id: dDoc.id, ...dDoc.data() } as Driver);
          }
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [checklistId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-subtle font-medium">Gerando laudo técnico...</p>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="p-20 text-center space-y-6">
        <div className="w-16 h-16 bg-danger/5 text-danger rounded-full flex items-center justify-center mx-auto">
          <ClipboardCheck size={32} />
        </div>
        <div>
          <h3 className="text-[20px] font-bold">Laudo Não Encontrado</h3>
          <p className="text-subtle">Não foi possível localizar os dados deste checklist.</p>
        </div>
        <button onClick={onBack} className="btn-secondary">Voltar</button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0 no-print">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-subtle hover:text-ink transition-colors font-bold text-[13px] uppercase tracking-widest"
        >
          <ArrowLeft size={16} />
          Voltar para Lista
        </button>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={16} />
            Imprimir Laudo
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download size={16} />
            Baixar PDF
          </button>
        </div>
      </div>

      {/* The Report Document */}
      <div className="bg-white text-slate-900 shadow-2xl rounded-[4px] overflow-hidden border border-slate-200 print:shadow-none print:border-none print:m-0">
        {/* Document Header */}
        <div className="p-10 border-b-4 border-slate-900 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center text-white">
                <ClipboardCheck size={24} />
              </div>
              <h1 className="text-[24px] font-black uppercase tracking-tighter">Laudo Cautelar</h1>
            </div>
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Inspeção de Automóvel • Documento Oficial</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID do Documento</p>
            <p className="text-[14px] font-mono font-bold">#{checklist.id.substring(0, 8).toUpperCase()}</p>
            <div className={cn(
               "inline-block mt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
               checklist.type === 'delivery' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
            )}>
              {checklist.type === 'delivery' ? 'Entrega de Veículo' : 'Devolução de Veículo'}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border-b border-slate-200">
          {/* Section: Vehicle */}
          <div className="bg-white p-8 space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Car size={14} /> Dados do Veículo
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Marca/Modelo</p>
                <p className="text-[15px] font-bold">{vehicle?.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Placa</p>
                <p className="text-[15px] font-bold font-mono text-blue-700">{vehicle?.plate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cor</p>
                <p className="text-[15px] font-bold capitalize">{vehicle?.color || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quilometragem</p>
                <p className="text-[15px] font-bold">{checklist.km.toLocaleString()} KM</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nível Combustível</p>
                <p className="text-[15px] font-bold">{(checklist as any).fuelLevel || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Section: Driver */}
          <div className="bg-white p-8 space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <User size={14} /> Dados do Condutor
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome Completo</p>
                <p className="text-[15px] font-bold">{driver?.name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                  <p className="text-[13px] font-medium">{driver?.cpf || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CNH</p>
                  <p className="text-[13px] font-medium">{driver?.cnh || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Inspection Items */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <ClipboardCheck size={14} /> Checklist de Inspeção
            </h2>
            <p className="text-[12px] font-medium text-slate-500 italic">Data da Inspeção: {formatDate(checklist.date)}</p>
          </div>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-2/3">Item Inspecionado</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(checklist.items || []).map((item, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[14px] font-bold text-slate-800">{item.itemName}</p>
                      {item.note && <p className="text-[12px] text-slate-500 mt-1 italic italic">Nota: {item.note}</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        item.status === 'ok' ? "bg-emerald-100 text-emerald-700" : 
                        item.status === 'damage' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: Photos */}
        {(checklist as any).additionalNotes && (
          <div className="p-8 border-t border-slate-100 space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Observações Gerais</h2>
            <p className="text-[13px] leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
               {(checklist as any).additionalNotes}
            </p>
          </div>
        )}

        {checklist.photos && checklist.photos.length > 0 && (
          <div className="p-8 border-t border-slate-100 space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Registros Fotográficos</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {checklist.photos.map((photo, i) => (
                <div key={i} className="aspect-square bg-slate-50 border border-slate-200 rounded overflow-hidden">
                  <img src={photo} alt={`Registro ${i+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer: Signatures */}
        <div className="p-10 bg-slate-50 border-t-2 border-slate-200 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="space-y-4 pt-8 border-t border-slate-300">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Assinatura do Locador</p>
              <div className="h-4"></div>
            </div>
            <div className="space-y-4 pt-8 border-t border-slate-300">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Assinatura do Condutor</p>
              <div className="h-4"></div>
            </div>
          </div>
          <div className="mt-12 text-center space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efraim Frotas • Gerado Digitalmente em {new Date().toLocaleDateString()}</p>
            <p className="text-[9px] text-slate-400">Este documento possui validade jurídica como termo de responsabilidade de entrega de bem móvel.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
          .rounded-[4px] { border-radius: 0 !important; }
          .animate-in { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
