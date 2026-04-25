import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Smartphone, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface PixPaymentModalProps {
  amount: number;
  driverName: string;
  description: string;
  onClose: () => void;
}

export function PixPaymentModal({ amount, driverName, description, onClose }: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Simulated PIX Copy & Paste code
  const pixCode = "00020126330014BR.GOV.BCB.PIX0111123456789005204000053039865407" + 
                  amount.toFixed(2).replace('.', '') + 
                  "5802BR5915" + driverName.replace(/\s/g, '').slice(0, 15) + "6007SAOPAULO62070503***6304" + 
                  Math.floor(Math.random() * 9999).toString().padStart(4, '0');

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-line flex items-center justify-between bg-bg/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-[12px] flex items-center justify-center">
                <Smartphone size={20} />
             </div>
             <div>
                <h3 className="text-[16px] font-bold">Pagamento via PIX</h3>
                <p className="text-[11px] text-subtle font-mono uppercase tracking-widest">{description}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 flex flex-col items-center">
          <div className="text-center space-y-1">
             <p className="text-subtle text-[12px] font-medium">Valor a Pagar</p>
             <p className="text-[32px] font-extrabold text-ink tracking-tight">{formatCurrency(amount)}</p>
          </div>

          <div className="w-48 h-48 bg-bg border-4 border-line rounded-2xl flex items-center justify-center relative group">
             <QrCode size={120} className="text-ink/80 group-hover:scale-110 transition-transform duration-500" />
             <div className="absolute inset-0 bg-surface/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-ink text-surface px-4 py-2 rounded-full text-[12px] font-bold shadow-lg">Scanear QR</span>
             </div>
          </div>

          <div className="w-full space-y-3">
             <div className="flex justify-between items-center text-[12px] font-bold text-subtle uppercase tracking-widest px-1">
                <span>PIX Copia e Cola</span>
             </div>
             <div className="relative group">
                <div className="w-full bg-bg border border-line rounded-[12px] p-4 pr-12 text-[11px] font-mono break-all text-subtle leading-relaxed">
                   {pixCode.slice(0, 100)}...
                </div>
                <button 
                  onClick={handleCopy}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-[10px] transition-all flex items-center gap-2",
                    copied ? "bg-emerald-500 text-surface" : "bg-ink text-surface hover:bg-accent"
                  )}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
             </div>
          </div>

          <div className="bg-amber-50 rounded-[12px] p-4 border border-amber-100 flex gap-3">
             <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
             <p className="text-[11px] text-amber-800 leading-normal font-medium">
                Após o pagamento, o sistema identificará automaticamente em até 10 minutos. Caso prefira, envie o comprovante via portal.
             </p>
          </div>
        </div>

        <div className="p-6 border-t border-line bg-bg/10">
          <button 
            onClick={onClose}
            className="w-full py-4 text-[14px] font-bold bg-ink text-surface rounded-[12px] hover:bg-ink/90 transition-all shadow-lg"
          >
             Concluir e Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
