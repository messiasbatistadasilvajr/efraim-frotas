import React, { useState } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Gauge, 
  X,
  Loader2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Driver, Vehicle } from '../types';

interface PredictiveScoreCardProps {
  driver?: Driver;
  vehicle?: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

export function PredictiveScoreCard({
  driver,
  vehicle,
  isOpen,
  onClose
}: PredictiveScoreCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    driverCreditScore: number;
    riskCategory: string;
    recommendedDeposit: number;
    riskFactors: string[];
    maintenanceForecast: {
      urgencyLevel: string;
      estimatedKmToNextService: number;
      componentsToInspect: string[];
      failureProbabilityPercentage: number;
    };
    recommendationSummary: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunPredictiveScore = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/ai/predictive-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver: driver || { name: 'Motorista Exemplo', cnh: '01234567890', depositBalance: 1200 },
          vehicle: vehicle || { model: 'Onix Plus 1.0', currentKm: 48500, year: 2023 },
          payments: [{ type: 'weekly', amount: 650, date: '2026-07-28' }],
          maintenanceHistory: [{ type: 'preventive', km: 40000, description: 'Troca de óleo e filtro' }]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao calcular o score preditivo.');

      setResult(data);
    } catch (err: any) {
      console.error("Predictive Score error:", err);
      alert(`Erro no algoritmo preditivo: ${err.message}`);
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
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">Score Preditivo de Inadimplência & Manutenção</h3>
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase">
                  IA Preditiva
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {driver ? `Motorista: ${driver.name}` : 'Análise Geral'} • {vehicle ? `Veículo: ${vehicle.model}` : 'Veículo Selecionado'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!result && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto bg-amber-400/20 text-amber-400 rounded-3xl flex items-center justify-center">
                <Sparkles size={32} />
              </div>
              <h4 className="font-bold text-lg text-white">Calcular Risco de Adimplência e Previsão de Falhas</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Nosso modelo de IA analisa o histórico de pagamentos do motorista, pontuação da CNH e padrão de rodagem do veículo para indicar o score financeiro e os próximos componentes a revisar.
              </p>

              <button
                onClick={handleRunPredictiveScore}
                disabled={loading}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 px-8 rounded-2xl text-xs flex items-center justify-center gap-2 mx-auto transition-all shadow-lg active:scale-95 uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Calculando Algoritmo Preditivo Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Executar Análise Preditiva de Risco</span>
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Score Display Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Credit Score */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Driver Default Credit Score</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-amber-400">{result.driverCreditScore}</span>
                      <span className="text-xs text-slate-500 font-bold">/ 100 pts</span>
                    </div>
                    <span className={cn(
                      "inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1",
                      result.riskCategory === 'Baixo' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      Risco {result.riskCategory}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Caução Recomendada</p>
                    <p className="text-lg font-extrabold text-white mt-1">{formatCurrency(result.recommendedDeposit)}</p>
                  </div>
                </div>

                {/* Maintenance Urgency */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Manutenção Preditiva</p>
                    <p className="text-xl font-extrabold text-amber-400 mt-1">{result.maintenanceForecast.urgencyLevel}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Próxima revisão em ~{result.maintenanceForecast.estimatedKmToNextService} km</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Probabilidade de Falha</p>
                    <p className="text-lg font-extrabold text-red-400 mt-1">{result.maintenanceForecast.failureProbabilityPercentage}%</p>
                  </div>
                </div>
              </div>

              {/* Components to inspect */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Wrench size={14} className="text-amber-400" /> Componentes Críticos para Inspeção Preventiva:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.maintenanceForecast.componentsToInspect.map((comp, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 font-medium">
                      🔧 {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-400" /> Fatores de Risco Identificados:
                </p>
                <ul className="space-y-1">
                  {result.riskFactors.map((factor, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Resumo Executivo Preditivo</p>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{result.recommendationSummary}"
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors uppercase tracking-wider"
              >
                Concluído
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
