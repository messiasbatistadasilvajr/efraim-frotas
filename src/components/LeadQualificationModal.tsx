import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  Send, 
  X, 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageSquare, 
  Car, 
  DollarSign,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface LeadQualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeadQualificationModal({ isOpen, onClose }: LeadQualificationModalProps) {
  const [formData, setFormData] = useState({
    name: 'Carlos Eduardo Silva',
    phone: '(11) 98112-9988',
    cnhAgeYears: 5,
    appsUsed: 'Uber Black e 99 Comfort',
    cnhPoints: 0,
    preferredVehicleTier: 'Sedan Conforto'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    qualificationStatus: string;
    suggestedVehicleCategory: string;
    recommendedWeeklyRate: number;
    whatsappAutoReply: string;
    internalNotes: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleQualifyLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ai/qualify-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadData: formData })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha na qualificação de lead');

      setResult(data);
    } catch (err: any) {
      alert(`Erro na qualificação via Gemini: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMsg = () => {
    if (result?.whatsappAutoReply) {
      navigator.clipboard.writeText(result.whatsappAutoReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-400/40 text-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 p-5 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">Qualificação Inteligente de Lead WhatsApp</h3>
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase">
                  Bot Gemini n8n
                </span>
              </div>
              <p className="text-xs text-slate-400">Atendimento autônomo, triagem de perfil e resposta comercial persuasiva</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {!result ? (
            <form onSubmit={handleQualifyLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome do Candidato</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Telefone WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tempo de CNH (Anos)</label>
                  <input
                    type="number"
                    value={formData.cnhAgeYears}
                    onChange={(e) => setFormData({ ...formData, cnhAgeYears: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pontos na Carteira (CNH)</label>
                  <input
                    type="number"
                    value={formData.cnhPoints}
                    onChange={(e) => setFormData({ ...formData, cnhPoints: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Aplicativos em Uso</label>
                  <input
                    type="text"
                    value={formData.appsUsed}
                    onChange={(e) => setFormData({ ...formData, appsUsed: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoria de Interesse</label>
                  <select
                    value={formData.preferredVehicleTier}
                    onChange={(e) => setFormData({ ...formData, preferredVehicleTier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="Hatch Econômico">Hatch Econômico (HB20 / Gol)</option>
                    <option value="Sedan Conforto">Sedan Conforto (Onix Plus / Cronos)</option>
                    <option value="SUV Intermediário">SUV Intermediário (Creta / Tracker)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-lg active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analisando e gerando resposta via Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Qualificar Lead & Gerar Resposta de WhatsApp</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Status de Qualificação</p>
                  <p className="text-lg font-extrabold text-emerald-400 mt-0.5">{result.qualificationStatus}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tarifa Recomendada</p>
                  <p className="text-lg font-extrabold text-amber-400 mt-0.5">{formatCurrency(result.recommendedWeeklyRate)} / sem</p>
                </div>
              </div>

              {/* Generated WhatsApp Script */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-emerald-400" /> Script Personalizado para Envio no WhatsApp:
                  </p>
                  <button
                    onClick={handleCopyMsg}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 font-bold border border-slate-700"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                  {result.whatsappAutoReply}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-400">
                <span className="font-bold text-slate-200">Nota Interna do Sistema:</span> {result.internalNotes}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Qualificar Outro Lead
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors uppercase tracking-wider"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
