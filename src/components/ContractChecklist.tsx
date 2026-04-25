import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ClipboardCheck, Plus, X, Camera, Check, AlertTriangle, HelpCircle, Fuel } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { cn } from '../lib/utils';

interface Props {
  contractId: string;
  type: 'delivery' | 'return';
  onClose: () => void;
}

type ItemStatus = 'ok' | 'damage' | 'missing';

interface ChecklistItem {
  itemName: string;
  category: string;
  status: ItemStatus;
  note: string;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'status' | 'note'>[] = [
  { category: 'Documentação', itemName: 'CRLV do Veículo' },
  { category: 'Documentação', itemName: 'Manual do Proprietário' },
  { category: 'Segurança', itemName: 'Pneu Estepe' },
  { category: 'Segurança', itemName: 'Macaco e Chave de Roda' },
  { category: 'Segurança', itemName: 'Triângulo de Sinalização' },
  { category: 'Segurança', itemName: 'Extintor (se aplicável)' },
  { category: 'Exterior', itemName: 'Faróis e Lanternas' },
  { category: 'Exterior', itemName: 'Vidros e Retrovisores' },
  { category: 'Exterior', itemName: 'Lataria e Pintura' },
  { category: 'Exterior', itemName: 'Limpadores de Parabrisa' },
  { category: 'Interior', itemName: 'Limpeza Interna' },
  { category: 'Interior', itemName: 'Tapetes' },
  { category: 'Interior', itemName: 'Bancos e Estofados' },
  { category: 'Interior', itemName: 'Ar Condicionado' },
  { category: 'Interior', itemName: 'Sistema de Som / Central Multimídia' },
];

export function ContractChecklist({ contractId, type, onClose }: Props) {
  const [km, setKm] = useState(0);
  const [fuelLevel, setFuelLevel] = useState('1/2');
  const [items, setItems] = useState<ChecklistItem[]>(
    DEFAULT_ITEMS.map(i => ({ ...i, status: 'ok', note: '' }))
  );
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateItemStatus = (index: number, status: ItemStatus) => {
    const newItems = [...items];
    newItems[index].status = status;
    setItems(newItems);
  };

  const updateItemNote = (index: number, note: string) => {
    const newItems = [...items];
    newItems[index].note = note;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'checklists'), {
        contractId,
        type,
        km,
        fuelLevel,
        items,
        additionalNotes,
        date: new Date().toISOString(),
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-2xl h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 border border-line">
        {/* Header */}
        <div className="p-6 border-b border-line flex items-center justify-between bg-bg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold tracking-tight">Vistoria de Veículo</h3>
              <p className="text-[11px] font-bold text-subtle uppercase tracking-widest leading-none mt-1">
                Padrão Profissional • {type === 'delivery' ? 'Entrega' : 'Devolução'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-subtle hover:text-ink transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Quilometragem (KM)</label>
              <input 
                required 
                type="number" 
                className="w-full border border-line rounded-[12px] p-3 text-[14px] outline-none focus:border-accent transition-all bg-bg" 
                placeholder="Ex: 45000"
                value={km} 
                onChange={e => setKm(parseInt(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Nível de Combustível</label>
              <div className="relative flex items-center h-[46px] bg-bg border border-line rounded-[12px] px-3">
                <Fuel size={18} className="text-subtle mr-2" />
                <select 
                  className="bg-transparent text-[14px] w-full outline-none"
                  value={fuelLevel}
                  onChange={e => setFuelLevel(e.target.value)}
                >
                  <option value="Reserva">Reserva (Brilha Luz)</option>
                  <option value="1/4">1/4 (Um Quarto)</option>
                  <option value="1/2">1/2 (Meio Tanque)</option>
                  <option value="3/4">3/4 (Três Quartos)</option>
                  <option value="Cheio">Tanque Cheio</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Items List by Category */}
          {categories.map(cat => (
            <div key={cat} className="space-y-4">
              <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                <span className="w-1 h-4 bg-accent rounded-full"></span>
                {cat}
              </h4>
              <div className="space-y-2">
                {items.filter(i => i.category === cat).map((item, idx) => {
                  const globalIdx = items.findIndex(gi => gi.itemName === item.itemName);
                  return (
                    <div key={item.itemName} className="panel p-4 bg-bg/50 border-line hover:bg-bg transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <span className="text-[14px] font-bold text-ink">{item.itemName}</span>
                        <div className="flex gap-1 bg-surface p-1 rounded-[10px] border border-line">
                          <button
                            type="button"
                            onClick={() => updateItemStatus(globalIdx, 'ok')}
                            className={cn(
                              "flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-all",
                              item.status === 'ok' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-subtle hover:bg-bg"
                            )}
                          >
                            <Check size={14} /> OK
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemStatus(globalIdx, 'damage')}
                            className={cn(
                              "flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-all",
                              item.status === 'damage' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-subtle hover:bg-bg"
                            )}
                          >
                            <AlertTriangle size={14} /> Avaria
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemStatus(globalIdx, 'missing')}
                            className={cn(
                              "flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-all",
                              item.status === 'missing' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-subtle hover:bg-bg"
                            )}
                          >
                            <HelpCircle size={14} /> Ausente
                          </button>
                        </div>
                      </div>
                      {item.status !== 'ok' && (
                        <input
                          type="text"
                          placeholder="Descreva a avaria ou item faltante..."
                          className="mt-3 w-full bg-surface border border-line rounded-[8px] p-2 text-[12px] outline-none focus:border-accent animate-in slide-in-from-top-1 duration-200"
                          value={item.note}
                          onChange={e => updateItemNote(globalIdx, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Section 3: Additional Notes */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-subtle">Observações Adicionais</label>
            <textarea 
              rows={3}
              placeholder="Dívidas de multa, arranhões específicos, condições gerais..."
              className="w-full border border-line rounded-[12px] p-4 text-[14px] outline-none focus:border-accent bg-bg resize-none"
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
            />
          </div>

          <div className="p-4 bg-accent/5 rounded-[12px] border border-accent/20 flex items-start gap-4">
             <Camera className="text-accent mt-1" size={24} />
             <div>
               <p className="text-[13px] font-bold text-ink">Registro Fotográfico Exigido</p>
               <p className="text-[12px] text-subtle leading-relaxed">
                 Assegure-se de capturar fotos nítidas da quilometragem, nível de combustível e qualquer avaria marcada acima para validade jurídica desta vistoria.
               </p>
             </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-line bg-bg">
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 text-[14px] font-bold border border-line rounded-[16px] hover:bg-surface transition-all"
            >
              Descartar
            </button>
            <button 
              disabled={loading} 
              type="button"
              onClick={handleSubmit}
              className="flex-[2] btn-primary py-4 text-[15px] shadow-xl shadow-accent/20"
            >
              {loading ? 'Processando...' : `Finalizar Vistoria de ${type === 'delivery' ? 'Entrega' : 'Retorno'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
