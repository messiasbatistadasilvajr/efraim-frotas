import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  X, 
  Layers, 
  BarChart3, 
  Zap,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface DynamicPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPricing?: (newRate: number, deposit: number) => void;
}

export function DynamicPricingModal({ isOpen, onClose, onApplyPricing }: DynamicPricingModalProps) {
  const [vehicleCategory, setVehicleCategory] = useState('Sedan Conforto (Onix Plus)');
  const [baseWeeklyRate, setBaseWeeklyRate] = useState(680);
  const [fleetOccupancyRate, setFleetOccupancyRate] = useState(92);
  const [driverRatingScore, setDriverRatingScore] = useState(88);
  const [seasonalityMonth, setSeasonalityMonth] = useState('Dezembro / Alta Temporada');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    optimalWeeklyRate: number;
    optimalDeposit: number;
    demandMultiplier: number;
    pricingStrategy: string;
    justification: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCalculatePricing = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/ai/dynamic-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleCategory,
          baseWeeklyRate,
          fleetOccupancyRate,
          driverRatingScore,
          seasonalityMonth
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao calcular precificação dinâmica.');

      setResult(data);
    } catch (err: any) {
      alert(`Erro na precificação dinâmica: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-400/40 text-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 p-5 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">Algoritmo de Precificação Dinâmica por IA</h3>
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase">
                  Dynamic Yield
                </span>
              </div>
              <p className="text-xs text-slate-400">Ajuste de semanalidades com base em demanda, ocupação da frota e rating do motorista</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Categoria de Veículo</label>
              <input
                type="text"
                value={vehicleCategory}
                onChange={(e) => setVehicleCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tarifa Base Semanal (R$)</label>
              <input
                type="number"
                value={baseWeeklyRate}
                onChange={(e) => setBaseWeeklyRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Ocupação da Frota (%)</label>
              <input
                type="number"
                value={fleetOccupancyRate}
                onChange={(e) => setFleetOccupancyRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Score do Motorista (0 a 100)</label>
              <input
                type="number"
                value={driverRatingScore}
                onChange={(e) => setDriverRatingScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleCalculatePricing}
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-lg active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Otimizando tarifa dinâmica com Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Calcular Tarifa Otimizada por IA</span>
              </>
            )}
          </button>

          {result && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Tarifa Otimizada</p>
                  <p className="text-lg font-extrabold text-amber-400 mt-1">{formatCurrency(result.optimalWeeklyRate)} / sem</p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Caução Ajustada</p>
                  <p className="text-lg font-extrabold text-white mt-1">{formatCurrency(result.optimalDeposit)}</p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Multiplicador Surge</p>
                  <p className="text-lg font-extrabold text-emerald-400 mt-1">{result.demandMultiplier}x</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-200">Estratégia Recomendada: <span className="text-amber-400">{result.pricingStrategy}</span></p>
                <p className="text-xs text-slate-400 leading-relaxed italic">"{result.justification}"</p>
              </div>

              {onApplyPricing && (
                <button
                  onClick={() => {
                    onApplyPricing(result.optimalWeeklyRate, result.optimalDeposit);
                    onClose();
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                >
                  <CheckCircle2 size={16} />
                  <span>Aplicar Esta Tarifa no Contrato/Proposta</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
