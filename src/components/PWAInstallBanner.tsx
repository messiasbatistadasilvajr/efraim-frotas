import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, Plus, X, Check, Apple, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if already running as installed standalone PWA
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Chrome/Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  // If already installed as app, don't show the persistent banner
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Top Floating PWA Banner */}
      {showBanner && (
        <div className="bg-slate-900 border-b border-amber-400/30 text-white px-4 py-3 shadow-lg relative z-40 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-md">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="font-bold text-sm text-white">Instalar o App Efraim Frotas no Celular</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    PWA Android & iPhone
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Acesse com 1 clique direto da sua tela inicial sem precisar da Play Store ou App Store.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 w-full sm:w-auto"
              >
                <Download size={15} />
                <span>Instalar Agora</span>
              </button>

              <button
                onClick={() => setShowBanner(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Helper Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">Como Instalar no Celular</h3>
                <p className="text-xs text-slate-400">Passo a passo rápido para fixar na tela inicial</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Apple size={16} />
                  <span>No iPhone / iPad (Safari):</span>
                </div>

                <ol className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span>No rodapé do Safari, toque no botão <strong>Compartilhar</strong> <Share size={14} className="inline text-amber-400" /></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span>Role o menu para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> <Plus size={14} className="inline text-amber-400" /></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span>Toque em <strong>"Adicionar"</strong> no canto superior direito.</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Smartphone size={16} />
                  <span>No Android (Google Chrome):</span>
                </div>

                <ol className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span>No canto superior direito do Chrome, toque nos <strong>Três Pontinhos (⋮)</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span>Confirme clicando em <strong>"Instalar"</strong>.</span>
                  </li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
