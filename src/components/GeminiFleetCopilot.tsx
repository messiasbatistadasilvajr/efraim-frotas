import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  MessageSquare, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Car, 
  Users, 
  DollarSign,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function GeminiFleetCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Olá! Sou o **Gemini Fleet Copilot**, seu assistente de inteligência artificial executivo. Como posso ajudar na gestão da sua frota hoje?\n\nVocê pode me pedir para:\n- Analisar motoristas com pagamentos em atraso e sugerir mensagens de cobrança.\n- Avaliar modelos de veículos com maior rentabilidade de aluguel.\n- Sugerir estratégias para reduzir custos de manutenção ou aumentar ocupação.\n- Tirar dúvidas sobre legislação de locação e termos de caução.',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          fleetContext: {
            activeVehicles: 28,
            rentedRate: '89%',
            weeklyGrossRevenue: 'R$ 21.450,00',
            pendingInvoices: 3,
            mainModels: ['Onix Plus 1.0', 'HB20 Sense', 'Hyundai Creta Action', 'VW Polo TSI']
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na resposta do Copilot');
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.text || 'Não consegui obter uma resposta adequada no momento.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Copilot error:", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `⚠️ **Ops! Houve uma falha ao conectar com a inteligência artificial:** ${err.message || 'Verifique sua chave GEMINI_API_KEY no painel.'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const presetPrompts = [
    { label: '📊 Análise de Adimplência', prompt: 'Análise o perfil dos motoristas em atraso e sugira uma régua de cobrança via WhatsApp.' },
    { label: '🏎️ Rentabilidade por Modelo', prompt: 'Qual categoria de veículo (Hatch, Sedan, SUV) apresenta melhor retorno sobre o investimento de compra em 12 meses?' },
    { label: '💬 Mensagem de Lembrete', prompt: 'Crie uma mensagem amigável para enviar pelo WhatsApp lembrando o motorista do vencimento da semanalidade amanhã.' },
    { label: '🔧 Plano Preventivo de Óleo', prompt: 'Como posso otimizar o agendamento de trocas de óleo para evitar que veículos fiquem parados no final de semana?' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Top Header */}
      <div className="bg-slate-950 border-b border-slate-800 p-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 rounded-2xl shadow-md shadow-amber-500/20">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Gemini Fleet Copilot</h2>
              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-extrabold uppercase">
                AI Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400">Consultoria de frota, finanças e automação operada por Inteligência Artificial</p>
          </div>
        </div>

        <button
          onClick={() => setMessages(messages.slice(0, 1))}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1"
          title="Limpar histórico da conversa"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Reiniciar Chat</span>
        </button>
      </div>

      {/* Preset Quick Actions */}
      <div className="bg-slate-900/60 p-3 px-6 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-amber-400/80 flex items-center gap-1 uppercase tracking-wider shrink-0 mr-1">
          <Zap size={13} /> Sugestões:
        </span>
        {presetPrompts.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(preset.prompt)}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 rounded-full text-xs font-medium transition-all shrink-0 hover:border-amber-400/40 active:scale-95 disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Messages Chat Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-3xl",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-md",
              msg.sender === 'user' 
                ? "bg-amber-400 text-slate-950 font-extrabold" 
                : "bg-slate-800 text-amber-400 border border-slate-700"
            )}>
              {msg.sender === 'user' ? 'VC' : <Bot size={18} />}
            </div>

            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed border relative group shadow-lg",
              msg.sender === 'user'
                ? "bg-amber-400 text-slate-950 border-amber-300 rounded-tr-xs font-medium"
                : "bg-slate-800/90 text-slate-100 border-slate-700 rounded-tl-xs"
            )}>
              {/* Message Header */}
              <div className="flex items-center justify-between gap-4 mb-1.5 border-b border-black/10 dark:border-white/10 pb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                  {msg.sender === 'user' ? 'Você' : 'Gemini Fleet Copilot'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                  {msg.sender === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded text-slate-300"
                      title="Copiar resposta"
                    >
                      {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="whitespace-pre-wrap space-y-2">
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 max-w-xl bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <Bot size={18} className="animate-spin" />
            </div>
            <div className="text-xs text-amber-300 font-medium">
              Analisando dados da frota e consultando IA Gemini...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 max-w-5xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte qualquer coisa sobre sua frota, receitas, motoristas ou minutas..."
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 p-3.5 px-6 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:scale-100"
          >
            <span>Enviar</span>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
