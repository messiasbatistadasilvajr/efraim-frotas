import React, { useState } from 'react';
import { 
  Eye, 
  Upload, 
  Sparkles, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  ShieldCheck, 
  Camera, 
  FileSearch, 
  Gauge, 
  Wrench,
  Loader2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface AIVisionInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleModel?: string;
  checklistType?: 'delivery' | 'return';
  onAppendResults?: (results: {
    damages: string[];
    cost: number;
    opinion: string;
  }) => void;
}

export function AIVisionInspectorModal({
  isOpen,
  onClose,
  vehicleModel = 'Veículo Exemplo',
  checklistType = 'delivery',
  onAppendResults
}: AIVisionInspectorModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    overallCondition: string;
    cleanlinessGrade: string;
    damagesDetected: string[];
    estimatedRepairCost: number;
    fuelLevelPercentage?: number;
    technicalOpinion: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("A imagem selecionada deve ter no máximo 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setAnalysisResult(null);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunVisionAnalysis = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai/vision-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          checklistType,
          vehicleModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao analisar a fotografia.');
      }

      setAnalysisResult(data);
    } catch (err: any) {
      console.error("Vision AI error:", err);
      setErrorMsg(err.message || "Erro de conexão com o serviço de visão computacional.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-400/40 text-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl">
              <Eye size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">Análise de Avarias por Visão Computacional Gemini</h3>
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase">
                  IA Multi-Modal
                </span>
              </div>
              <p className="text-xs text-slate-400">Vistoria de {checklistType === 'delivery' ? 'Saída (Entrega)' : 'Retorno (Devolução)'} • {vehicleModel}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Upload Drop Zone */}
          {!selectedImage ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-950/80 group text-center">
              <div className="p-4 bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-400 rounded-2xl transition-all shadow-md mb-3">
                <Camera size={32} />
              </div>
              <p className="font-bold text-sm text-slate-200 group-hover:text-amber-300">
                Selecione ou tire a foto do veículo
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Envie fotos de arranhões, amassados, pneus ou painel. A IA do Gemini irá identificar avarias e calcular orçamentos.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Image Preview */}
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-h-72 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Foto do Veículo para Vistoria"
                    className="w-full h-full object-cover max-h-72"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-xl hover:bg-red-500 transition-colors text-xs flex items-center gap-1 font-bold"
                  >
                    <X size={14} /> Alterar Foto
                  </button>
                </div>

                {!analysisResult && (
                  <button
                    onClick={handleRunVisionAnalysis}
                    disabled={analyzing}
                    className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 uppercase tracking-wider"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Processando Visão Computacional Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Analisar Fotografia com IA</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Analysis Result Display */}
              <div className="space-y-4">
                {analyzing && (
                  <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3 min-h-60">
                    <div className="p-3 bg-amber-400/20 text-amber-400 rounded-2xl animate-spin">
                      <FileSearch size={28} />
                    </div>
                    <p className="text-sm font-bold text-amber-300">Inspecionando milimetricamente cada pixel...</p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      O Gemini está checando arranhões na lataria, desgaste dos pneus, limpeza e painel.
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {analysisResult && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Estado Geral Identificado</p>
                        <p className={cn(
                          "text-base font-extrabold mt-0.5",
                          analysisResult.overallCondition === 'Excelente' || analysisResult.overallCondition === 'Bom'
                            ? "text-emerald-400"
                            : "text-amber-400"
                        )}>
                          {analysisResult.overallCondition}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Estimativa de Avaria</p>
                        <p className="text-base font-extrabold text-amber-400">
                          {formatCurrency(analysisResult.estimatedRepairCost)}
                        </p>
                      </div>
                    </div>

                    {/* Detected Items */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                        <Wrench size={13} className="text-amber-400" /> Avarias / Apontamentos Encontrados:
                      </p>
                      {analysisResult.damagesDetected.length === 0 ? (
                        <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          ✓ Nenhum dano aparente detectado na imagem.
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {analysisResult.damagesDetected.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Technical Opinion */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                        <ShieldCheck size={13} className="text-amber-400" /> Parecer Cautelar da IA:
                      </p>
                      <p className="text-xs text-slate-400 italic bg-slate-900 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                        "{analysisResult.technicalOpinion}"
                      </p>
                    </div>

                    {/* Append Button */}
                    {onAppendResults && (
                      <button
                        onClick={() => {
                          onAppendResults({
                            damages: analysisResult.damagesDetected,
                            cost: analysisResult.estimatedRepairCost,
                            opinion: analysisResult.technicalOpinion
                          });
                          onClose();
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 uppercase tracking-wider"
                      >
                        <CheckCircle2 size={16} />
                        <span>Anexar Laudo de IA à Vistoria</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
