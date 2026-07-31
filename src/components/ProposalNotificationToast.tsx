import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  X, 
  Sparkles, 
  Car, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2,
  Play
} from 'lucide-react';
import { 
  ProposalNotificationData, 
  isSoundMuted, 
  setSoundMuted, 
  isVoiceMuted, 
  setVoiceMuted,
  simulateIncomingProposal,
  playMercadoLivreChime
} from '../lib/proposalNotificationService';
import { formatCurrency, cn } from '../lib/utils';

interface ProposalNotificationToastProps {
  onOpenProposalsView?: () => void;
}

export function ProposalNotificationToast({ onOpenProposalsView }: ProposalNotificationToastProps) {
  const [activeAlert, setActiveAlert] = useState<ProposalNotificationData | null>(null);
  const [soundMuted, setSoundMutedState] = useState<boolean>(isSoundMuted());
  const [voiceMuted, setVoiceMutedState] = useState<boolean>(isVoiceMuted());
  const [showNotificationBar, setShowNotificationBar] = useState<boolean>(true);

  useEffect(() => {
    const handleNewAlert = (e: Event) => {
      const customEv = e as CustomEvent<ProposalNotificationData>;
      if (customEv.detail) {
        setActiveAlert(customEv.detail);
      }
    };

    window.addEventListener('new-proposal-alert', handleNewAlert);
    return () => window.removeEventListener('new-proposal-alert', handleNewAlert);
  }, []);

  const toggleSound = () => {
    const newMuted = !soundMuted;
    setSoundMuted(newMuted);
    setSoundMutedState(newMuted);
    if (!newMuted) {
      playMercadoLivreChime();
    }
  };

  const toggleVoice = () => {
    const newMuted = !voiceMuted;
    setVoiceMuted(newMuted);
    setVoiceMutedState(newMuted);
  };

  const handleTestSimulation = () => {
    simulateIncomingProposal();
  };

  return (
    <>
      {/* Floating Header Notification Controls & Test Trigger Bar */}
      <div className="fixed top-3 right-4 z-40 hidden sm:flex items-center gap-2 bg-ink/90 backdrop-blur-md text-white p-1.5 px-3 rounded-full shadow-lg border border-amber-400/30 text-xs">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-400/20 text-amber-300 font-bold rounded-full text-[10px] uppercase tracking-wider">
          <Bell size={12} className="animate-bounce" />
          <span>Alertas Mercado Livre Style</span>
        </div>

        <button
          onClick={handleTestSimulation}
          className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-full font-bold text-[11px] transition-all shadow-sm active:scale-95"
          title="Simular chegada de nova proposta com som de campainha e voz"
        >
          <Play size={10} className="fill-slate-950" />
          <span>Testar Som + Voz</span>
        </button>

        <div className="h-3 w-px bg-white/20 my-auto" />

        {/* Audio Mute/Unmute toggle */}
        <button
          onClick={toggleSound}
          className={cn(
            "p-1 rounded-full transition-colors",
            soundMuted ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
          )}
          title={soundMuted ? "Som de campainha desativado" : "Som de campainha ativado"}
        >
          {soundMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>

        {/* Speech Mute/Unmute toggle */}
        <button
          onClick={toggleVoice}
          className={cn(
            "p-1 rounded-full transition-colors",
            voiceMuted ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
          )}
          title={voiceMuted ? "Voz em português desativada" : "Voz em português ativada"}
        >
          {voiceMuted ? <MicOff size={13} /> : <Mic size={13} />}
        </button>
      </div>

      {/* Mercado Livre Style Active Toast Notification Card */}
      {activeAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border-2 border-amber-400 text-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Top Yellow Banner (Mercado Livre Branding) */}
          <div className="bg-amber-400 px-4 py-2 flex items-center justify-between text-slate-950 font-bold">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-slate-950 text-amber-400 rounded-lg">
                <Bell size={16} className="animate-bounce" />
              </div>
              <span className="text-xs uppercase tracking-wider font-extrabold">
                NOVA PROPOSTA DE ALUGUEL DE VEÍCULO!
              </span>
            </div>

            <button
              onClick={() => setActiveAlert(null)}
              className="text-slate-950 hover:bg-slate-950/10 p-1 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Proposal Details Content */}
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Cliente Interessado</p>
                <h4 className="font-display font-bold text-lg text-white mt-0.5">{activeAlert.clientName}</h4>
                {activeAlert.phone && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{activeAlert.phone}</p>
                )}
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase">
                Recebido às {activeAlert.timestamp}
              </span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400/20 text-amber-400 rounded-lg">
                  <Car size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Categoria Solicitada</p>
                  <p className="text-xs font-bold text-slate-200">{activeAlert.vehicleCategory}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">Valor Semanal</p>
                <p className="text-sm font-extrabold text-amber-400">
                  {formatCurrency(activeAlert.weeklyRate)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {onOpenProposalsView && (
                <button
                  onClick={() => {
                    onOpenProposalsView();
                    setActiveAlert(null);
                  }}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 uppercase tracking-wider"
                >
                  <span>Abrir Gestor de Propostas</span>
                  <ArrowRight size={14} />
                </button>
              )}

              <button
                onClick={() => setActiveAlert(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Dispensar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
