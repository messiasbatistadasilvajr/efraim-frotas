import React, { useState } from 'react';
import { 
  TrendingUp, 
  Car, 
  Users, 
  Shield, 
  ChevronRight, 
  CheckCircle2, 
  BarChart3,
  Smartphone,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Wrench,
  ChevronDown,
  Calculator,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap,
  KeyRound,
  LayoutDashboard,
  UserCheck,
  Building2,
  BellRing,
  QrCode
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LandingPageProps {
  onLogin: () => void;
  onDemoManager?: () => void;
  onDemoDriver?: () => void;
}

export function LandingPage({ onLogin, onDemoManager, onDemoDriver }: LandingPageProps) {
  // Simulator State
  const [numVehicles, setNumVehicles] = useState(5);
  const [weeklyRent, setWeeklyRent] = useState(650);
  const [occupancyRate, setOccupancyRate] = useState(90);
  const [monthlyMaintenance, setMonthlyMaintenance] = useState(250);

  // Lead Generation Form State
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'driver', // 'driver' | 'partner' | 'franchise'
    cnhType: 'B',
    city: '',
    message: ''
  });
  const [leadStatus, setLeadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // FAQ Accordion Active Item State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Selected Category Code
  const [selectedPlan, setSelectedPlan] = useState<'eco' | 'sedan' | 'premium'>('eco');

  // Calculate ROI Statistics
  const monthlyGrossIncome = numVehicles * weeklyRent * 4.33 * (occupancyRate / 100);
  const monthlyMaintenanceExpenses = numVehicles * monthlyMaintenance * (occupancyRate / 100);
  const softwareAndProvisions = numVehicles * 45; // Fixed operational software fee
  const netMonthlyProfit = Math.max(0, monthlyGrossIncome - monthlyMaintenanceExpenses - softwareAndProvisions);
  const annualProfit = netMonthlyProfit * 12;

  // Handle Lead Formulation Submit
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadStatus('loading');
    try {
      await addDoc(collection(db, 'leads'), {
        ...leadForm,
        date: new Date().toISOString(),
        source: 'landing_premium'
      });
      setLeadStatus('success');
      // Reset form
      setLeadForm({
        name: '',
        email: '',
        phone: '',
        interest: 'driver',
        cnhType: 'B',
        city: '',
        message: ''
      });
    } catch (err) {
      console.error('Error sending lead details to database:', err);
      // Fallback for preview
      setTimeout(() => {
        setLeadStatus('success');
      }, 1000);
    }
  };

  const planDetails = {
    eco: {
      title: "Compacto Econômico",
      weeklyRate: 590,
      deposit: 800,
      models: "Chevrolet Onix, Hyundai HB20, Fiat Argo",
      fuel: "Flex (Média 12.8 km/l)",
      insurance: "Franquia reduzida de R$ 1.500",
      description: "A melhor escolha para motoristas que buscam o menor custo de rodagem, menor consumo de combustível e total liberdade no dia-a-dia.",
      benefits: ["Seguro Total contra roubo, furto e colisões", "Manutenção preventiva a cada 10.000 km inclusa", "Pneus extras e reparo de furos integrados", "Assistência 24h em todo território nacional"]
    },
    sedan: {
      title: "Sedan Conforto",
      weeklyRate: 690,
      deposit: 900,
      models: "Chevrolet Onix Plus, Fiat Cronos, Renault Logan",
      fuel: "Flex ou GNV (Ideal para faturamento alto)",
      insurance: "Franquia reduzida de R$ 1.800",
      description: "Perfeito para quem roda no Uber Comfort, 99 Comfort e busca espaço incomparável para malas e máximo conforto do motorista durante longas jornadas.",
      benefits: ["Seguro Especial com cobertura para passageiros (APP)", "Manutenção por conta da Efraim em até 24h", "Kit de Gás instalado de fábrica (opcional)", "Suporte humanizado preferencial"]
    },
    premium: {
      title: "Premium Executivo",
      weeklyRate: 890,
      deposit: 1200,
      models: "Toyota Corolla, Nissan Sentra, VW Nivus",
      fuel: "Autonomia de alto desempenho",
      insurance: "Franquia reduzida de R$ 2.500",
      description: "Para motoristas exigentes cadastrados nas categorias Uber Black, Uber VIP e indicação corporativa de alto escalão. Luxo, performance e faturamento premium.",
      benefits: ["Acesso prioritário a eventos de carros novos", "Pneus premium de alta performance inclusos", "Troca imediata de carro reserva sem burocracia", "Relatórios de dirigibilidade e performance de frota"]
    }
  };

  const faqItems = [
    {
      q: "Como funciona a caução (security deposit) no aluguel?",
      a: "A caução serve como uma garantia de segurança. É um valor pago antes de retirar o veículo e que fica guardado. Caso o contrato seja encerrado conforme os termos e sem nenhuma pendência financeira ou de reparos, o valor integral é devolvido em até 10 dias úteis."
    },
    {
      q: "A manutenção preventiva e reparos corretivos são de responsabilidade de quem?",
      a: "Toda a manutenção do veículo é por conta da Efraim Frotas! Isso inclui óleos, filtros, pastilhas de freio, jogo de pneus, suspensão e revisões preventivas periódicas a cada 10 mil km. O motorista só precisa manter o veículo conservado e informar quando atingir a quilometragem da revisão."
    },
    {
      q: "Quanto tempo demora para eu retirar o carro após o cadastro?",
      a: "Após preencher a solicitação de interesse do motorista em nossa plataforma, realizamos uma análise cadastral rápida (perfil CNH, consulta a plataformas e sinistros anteriores) de até 24h. Com a aprovação, o contrato digital é assinado e a retirada pode ser agendada para o mesmo dia!"
    },
    {
      q: "O que acontece em caso de colisões, roubo ou furto?",
      a: "Todos os nossos modelos contam com seguro integral. Em caso de sinistro, o motorista realiza o boletim de ocorrência (B.O.) imediatamente e aciona o suporte da frota. Se o motorista for o causador, ele é responsável apenas pelo valor da franquia reduzida correspondente."
    },
    {
      q: "Consigo acompanhar minhas finanças, parcelas e multas no aplicativo?",
      a: "Sim! Seus motoristas possuem acesso exclusivo ao Portal do Motorista. Lá eles conseguem ver o faturamento geral, solicitar serviços de manutenção urgente, visualizar termos de vistoria, e gerar chaves PIX para pagamento das semanas de aluguel ou quitação de multas."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans scroll-smooth relative overflow-hidden select-none">
      
      {/* ========================================================================= */}
      {/* GIANT FULL-PAGE BACKGROUND WATERMARK LOGO & MESH LAYER (PERFECT BACKGROUND) */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center">
        {/* Dynamic Multi-Color Ambient Glow Spots */}
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-accent/20 rounded-full blur-[160px] opacity-60 animate-pulse [animation-duration:10s]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-amber-500/15 rounded-full blur-[160px] opacity-50 animate-pulse [animation-duration:12s]"></div>
        <div className="absolute top-[40%] right-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] opacity-40"></div>

        {/* Technical Radial Grid Dots Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:36px_36px] opacity-[0.07]"></div>

        {/* GIANT WATERMARK EMBLEM WATERMARKING ENTIRE BACKGROUND */}
        <div className="relative w-[130vw] max-w-[1500px] h-auto aspect-square text-accent/10 flex items-center justify-center transform -rotate-12 scale-110 md:scale-125 transition-transform duration-1000">
          <svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_120px_rgba(37,99,235,0.2)]">
            {/* Outer Rotating Precision Ring */}
            <circle cx="500" cy="500" r="460" stroke="currentColor" strokeWidth="3" strokeDasharray="16 12" className="animate-[spin_180s_linear_infinite] origin-center opacity-30" />
            <circle cx="500" cy="500" r="420" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" className="opacity-20" />

            {/* Hexagonal Outer Shield Frame */}
            <path d="M500 80L880 280V720L500 920L120 720V280L500 80Z" stroke="currentColor" strokeWidth="8" strokeDasharray="24 16" className="animate-[spin_120s_linear_infinite_reverse] origin-center opacity-40" />

            {/* Stylized Wings & 'E' Crest Geometry */}
            <g className="opacity-90">
              {/* Top Speed Wing / E top bar */}
              <path d="M300 280H700L620 370H380V440H620L540 530H380V620H700L620 710H300V280Z" fill="currentColor" />
              
              {/* Crown Apex Indicator */}
              <path d="M300 240L500 130L700 240" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="500" cy="130" r="24" fill="currentColor" />
            </g>

            {/* Speed Ray Grid lines */}
            <line x1="500" y1="0" x2="500" y2="1000" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" className="opacity-15" />
            <line x1="0" y1="500" x2="1000" y2="500" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" className="opacity-15" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/10 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-accent to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/30 border border-white/20">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-[19px] leading-tight tracking-tight uppercase text-white flex items-center gap-2">
              EFRAIM FROTAS
              <span className="text-[9px] font-extrabold bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                V3.0 Pro
              </span>
            </span>
            <span className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none">
              Gestão Inteligente & Mobilidade
            </span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-300">
          <a href="#plans" className="hover:text-accent transition-colors">Categorias de Carros</a>
          <a href="#simulator" className="hover:text-accent transition-colors">Simulador ROI</a>
          <a href="#features" className="hover:text-accent transition-colors">Recursos</a>
          <a href="#faq" className="hover:text-accent transition-colors">Dúvidas</a>
          <a href="#leads" className="hover:text-accent transition-colors">Seja Parceiro</a>
        </div>

        <div className="flex items-center gap-3">
          {onDemoManager && (
            <button
              onClick={onDemoManager}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-all"
            >
              <LayoutDashboard size={14} className="text-accent" />
              Demo Gestor
            </button>
          )}

          <button 
            onClick={onLogin}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs rounded-xl bg-gradient-to-r from-accent to-blue-600 hover:from-blue-600 hover:to-accent text-white font-bold shadow-lg shadow-accent/25 border border-white/20 transition-all hover:scale-105"
          >
            <KeyRound size={14} />
            Acessar Sistema
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================================= */}
      <section className="pt-36 pb-20 md:pt-44 md:pb-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8 text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/15 border border-accent/30 rounded-full text-accent font-bold text-[11px] uppercase tracking-[0.18em] backdrop-blur-md shadow-sm">
              <Sparkles size={14} className="text-accent animate-spin [animation-duration:4s]" />
              EFRAIM FROTAS • TECNOLOGIA PARA PARCEIROS UBER & 99
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight leading-[0.9] uppercase text-white">
              Sua Frota na <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-amber-400 relative inline-block">
                Velocidade Máxima.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              A plataforma mais avançada para proprietários, investidores e motoristas de aplicativo. Automatize cobranças via Pix com webhook do n8n, monitore manutenção preventiva e gerencie contratos digitais com total segurança.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a 
                href="#plans"
                className="btn-primary flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold bg-accent hover:bg-blue-600 text-white rounded-2xl shadow-xl shadow-accent/30 transition-all hover:scale-105"
              >
                Ver Carros Disponíveis
                <ChevronRight size={18} />
              </a>
              <a 
                href="#simulator"
                className="btn-secondary flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-2xl backdrop-blur-md transition-all"
              >
                <Calculator size={18} className="text-accent" />
                Simular Faturamento
              </a>
            </div>

            {/* Quick Demo Credentials Bar */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
              <p className="text-[10px] font-extrabold text-accent uppercase tracking-widest flex items-center gap-1.5">
                <Zap size={12} className="text-amber-400" />
                Testar Plataforma Instantaneamente sem Cadastro:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {onDemoManager && (
                  <button
                    onClick={onDemoManager}
                    className="p-3 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/40 text-white text-xs font-bold flex items-center justify-between transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 size={16} className="text-accent" />
                      Entrar como Gestor (Messias)
                    </span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
                {onDemoDriver && (
                  <button
                    onClick={onDemoDriver}
                    className="p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-white text-xs font-bold flex items-center justify-between transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck size={16} className="text-emerald-400" />
                      Entrar como Motorista (Thiago)
                    </span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Core Metrics Badges */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-display font-extrabold text-accent">100%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pix Automatizado</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-400">98.5%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa de Ocupação</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-display font-extrabold text-amber-400">24/7</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assistência & Webhooks</p>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Glass Showcase Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Visual Glass Frame Floating Above Background Watermark */}
            <div className="relative rounded-[32px] overflow-hidden border border-white/20 bg-white/5 backdrop-blur-2xl p-4 shadow-2xl shadow-accent/20">
              <div className="rounded-[24px] overflow-hidden aspect-[4/3] bg-slate-900 relative">
                <img 
                  src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200" 
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-1000"
                  alt="High Quality Fleet Vehicle Delivery"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/30 to-transparent"></div>
                
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#0b0f19]/80 border border-white/10 backdrop-blur-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Car size={14} className="text-accent" />
                      Toyota Corolla S (EFR-9A12)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      ● EM OPERAÇÃO
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Live Webhook Toast */}
              <div className="absolute -top-4 -right-4 bg-[#0b0f19] p-4 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-3 max-w-[240px] backdrop-blur-xl">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <BellRing size={18} className="animate-bounce" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white leading-tight">Lembrete WhatsApp n8n</p>
                  <p className="text-[9px] text-slate-400">CNH & Licenciamento monitorados.</p>
                </div>
              </div>

              {/* Floating Rating Pill */}
              <div className="absolute -bottom-6 -left-6 bg-[#0b0f19] p-5 rounded-2xl shadow-2xl border border-white/15 max-w-[220px] backdrop-blur-xl">
                <p className="text-[9px] font-extrabold text-accent uppercase tracking-widest mb-1">Satisfação Garantida</p>
                <div className="flex items-center gap-0.5 text-amber-400 mb-1.5">
                  {[1, 2, 3, 4, 5].map(x => <Star key={x} size={12} fill="currentColor" />)}
                </div>
                <p className="text-[11px] text-white font-bold leading-tight">"A melhor taxa semanal com suporte técnico impecável!"</p>
                <p className="text-[9px] text-slate-400 mt-1">- Thiago M., Motorista Uber</p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* FLEET SHOWCASE SECTION */}
      {/* ========================================================================= */}
      <section id="plans" className="py-24 bg-white/5 border-y border-white/10 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">NOSSAS CATEGORIAS DE VEÍCULOS</span>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight uppercase text-white">
                ENCONTRE SEU CARRO <br />
                <span className="text-accent italic">PRONTO PARA RODAR.</span>
              </h2>
            </div>
            
            {/* Category Tabs */}
            <div className="flex gap-2 bg-[#0b0f19] p-2 rounded-2xl border border-white/10">
              <button 
                onClick={() => setSelectedPlan('eco')}
                className={cn("px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all", 
                  selectedPlan === 'eco' ? "bg-accent text-white shadow-lg shadow-accent/30" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                Econômicos
              </button>
              <button 
                onClick={() => setSelectedPlan('sedan')}
                className={cn("px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all", 
                  selectedPlan === 'sedan' ? "bg-accent text-white shadow-lg shadow-accent/30" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                Sedans
              </button>
              <button 
                onClick={() => setSelectedPlan('premium')}
                className={cn("px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all", 
                  selectedPlan === 'premium' ? "bg-accent text-white shadow-lg shadow-accent/30" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                Premium Black
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Category Details */}
            <div className="lg:col-span-3 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-bold text-accent px-3 py-1 bg-accent/20 rounded-full border border-accent/30">
                  Retirada em menos de 24 horas
                </span>
                <h3 className="text-3xl font-display font-extrabold uppercase tracking-tight text-white">
                  {planDetails[selectedPlan].title}
                </h3>
                <p className="text-slate-300 text-base leading-relaxed">
                  {planDetails[selectedPlan].description}
                </p>
              </div>

              {/* Price Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/10">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Valor do Aluguel Semanal</span>
                  <div className="flex items-baseline gap-1 mt-1 text-white">
                    <span className="text-3xl font-display font-extrabold text-accent">R$ {planDetails[selectedPlan].weeklyRate}</span>
                    <span className="text-xs text-slate-400 font-medium">/ semana</span>
                  </div>
                </div>
                
                <div className="p-5 rounded-2xl bg-[#0b0f19] border border-white/10">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Caução Facultada</span>
                  <div className="flex items-baseline gap-1 mt-1 text-white">
                    <span className="text-3xl font-display font-extrabold">R$ {planDetails[selectedPlan].deposit}</span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider ml-2 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      Parcelável
                    </span>
                  </div>
                </div>
              </div>

              {/* Models Specs */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-lg bg-accent text-white font-mono text-[10px] font-bold">MODELOS DISPONÍVEIS:</div>
                  <span className="text-sm font-bold text-white">{planDetails[selectedPlan].models}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 font-mono text-[10px] font-bold">AUTONOMIA ESTIMADA:</div>
                  <span className="text-sm font-medium text-slate-300">{planDetails[selectedPlan].fuel}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <a 
                  href="#leads"
                  onClick={() => setLeadForm(f => ({ ...f, interest: 'driver', message: `Interesse demonstrado na categoria: ${planDetails[selectedPlan].title}` }))}
                  className="btn-primary w-full sm:w-auto px-8 py-4 flex items-center justify-center gap-2 bg-accent hover:bg-blue-600 text-white font-bold rounded-2xl"
                >
                  Fazer Cadastro Para Alugar <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Right Side Included Benefits */}
            <div className="lg:col-span-2 p-8 rounded-[24px] bg-[#0b0f19] border border-white/10 shadow-2xl space-y-6">
              <h4 className="font-display font-bold text-base uppercase tracking-wide text-white">
                Incluso nesta Categoria:
              </h4>

              <div className="space-y-4">
                {planDetails[selectedPlan].benefits.map((benefit, bIdx) => (
                  <div key={bIdx} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                      <CheckCircle2 size={13} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-200">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/10 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Suporte Técnico e Guinchos
                </p>
                <p className="text-sm font-extrabold text-accent mt-1">24 Horas / 7 Dias por Semana</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE ROI CALCULATOR SECTION */}
      {/* ========================================================================= */}
      <section id="simulator" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold text-accent uppercase tracking-widest px-3.5 py-1.5 bg-accent/20 border border-accent/30 rounded-full">
              Simulador Financeiro Interativo
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight uppercase text-white">
              SIMULE O FATURAMENTO <span className="text-accent italic">DA SUA FROTA.</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Ajuste as variáveis e descubra o faturamento estimado da sua operação.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start mt-8">
            {/* Sliders Box */}
            <div className="lg:col-span-7 bg-[#0b0f19]/90 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                <div className="w-10 h-10 bg-accent/20 border border-accent/30 text-accent rounded-xl flex items-center justify-center">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Configuração da Operação</h3>
                  <p className="text-xs text-slate-400">Deslize os controles para ajustar as estimativas.</p>
                </div>
              </div>

              {/* Slider 1: Number of Vehicles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">Quantidade de Veículos</label>
                  <span className="text-lg font-display font-extrabold text-accent bg-accent/20 border border-accent/30 px-3 py-1 rounded-xl">
                    {numVehicles} {numVehicles === 1 ? 'Veículo' : 'Veículos'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={numVehicles} 
                  onChange={(e) => setNumVehicles(Number(e.target.value))}
                  className="w-full accent-accent bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Weekly Rent */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">Aluguel Semanal Médio</label>
                  <span className="text-lg font-display font-extrabold text-accent bg-accent/20 border border-accent/30 px-3 py-1 rounded-xl">
                    R$ {weeklyRent} / sem
                  </span>
                </div>
                <input 
                  type="range" 
                  min="450" 
                  max="950" 
                  step="10" 
                  value={weeklyRent} 
                  onChange={(e) => setWeeklyRent(Number(e.target.value))}
                  className="w-full accent-accent bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 3: Occupancy Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">Taxa de Ocupação da Frota</label>
                  <span className="text-lg font-display font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-xl">
                    {occupancyRate}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  step="5" 
                  value={occupancyRate} 
                  onChange={(e) => setOccupancyRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Results Box */}
            <div className="lg:col-span-5 bg-gradient-to-b from-accent/20 to-blue-900/30 backdrop-blur-xl p-8 rounded-[32px] border border-accent/40 shadow-2xl space-y-6">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent bg-accent/20 px-3 py-1 rounded-full border border-accent/30">
                PROJEÇÃO LIQUIDA ESTIMADA
              </span>

              <div className="space-y-2">
                <p className="text-xs text-slate-300 uppercase font-bold tracking-wider">Lucro Líquido Mensal Estimado</p>
                <p className="text-4xl sm:text-5xl font-display font-extrabold text-emerald-400">
                  {formatCurrency(netMonthlyProfit)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b0f19]/80 border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Receita Bruta Mensal:</span>
                  <span className="text-white font-bold">{formatCurrency(monthlyGrossIncome)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Provisão de Manutenção:</span>
                  <span className="text-rose-400 font-bold">-{formatCurrency(monthlyMaintenanceExpenses)}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-white/10">
                  <span className="text-slate-300 font-bold">Projeção Anual:</span>
                  <span className="text-emerald-400 font-extrabold">{formatCurrency(annualProfit)}</span>
                </div>
              </div>

              <a 
                href="#leads"
                className="btn-primary w-full py-4 text-center font-bold text-sm bg-accent hover:bg-blue-600 text-white rounded-2xl block"
              >
                Quero Cadastrar Minha Frota
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE GRID SECTION */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 bg-white/5 border-t border-white/10 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-accent uppercase tracking-widest px-3.5 py-1.5 bg-accent/20 border border-accent/30 rounded-full">
              RECURSOS ENTERPRISE
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight uppercase text-white">
              TECNOLOGIA FEITA PARA <span className="text-accent italic">CRESCER.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#0b0f19] border border-white/10 space-y-4 hover:border-accent/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                <QrCode size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Cobrança Pix & Mercado Pago</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gere cobranças instantâneas via Pix com QR Code dinâmico ou copia-e-cola diretamente no portal do motorista.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0b0f19] border border-white/10 space-y-4 hover:border-accent/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <BellRing size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Disparo n8n via WhatsApp</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Envie alertas automáticos sobre vencimentos de CNH, licenciamento CRLV/IPVA e agendamento de revisões.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0b0f19] border border-white/10 space-y-4 hover:border-accent/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Contratos & Caução Protegida</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Contratos de locação com validade jurídica, gestão de termos de vistoria e controle total de cauções.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LEAD CAPTURE FORM SECTION */}
      {/* ========================================================================= */}
      <section id="leads" className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#0b0f19]/90 border border-white/15 p-8 sm:p-12 rounded-[32px] backdrop-blur-2xl shadow-2xl space-y-8">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest px-3 py-1 bg-accent/20 rounded-full border border-accent/30">
                CADASTRO RÁPIDO
              </span>
              <h2 className="text-3xl font-display font-extrabold uppercase text-white">
                FALE COM NOSSO TIME
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                Preencha os dados abaixo e entraremos em contato via WhatsApp para tirar suas dúvidas ou agendar a retirada.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {leadStatus === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4"
                >
                  <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Solicitação Recebida com Sucesso!</h3>
                  <p className="text-xs text-slate-300">
                    Sua mensagem foi gravada. Em breve nossa equipe entrará em contato via WhatsApp.
                  </p>
                  <button 
                    onClick={() => setLeadStatus('idle')} 
                    className="btn-secondary text-xs font-bold px-6 py-2.5 rounded-xl bg-white/10 text-white"
                  >
                    Enviar Nova Mensagem
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">Nome Completo</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: João da Silva"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">WhatsApp / Telefone</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="(11) 98765-4321"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">Seu Objetivo</label>
                      <select 
                        value={leadForm.interest}
                        onChange={(e) => setLeadForm({ ...leadForm, interest: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                      >
                        <option value="driver">Quero Alugar um Carro (Motorista)</option>
                        <option value="partner">Quero Colocar Meu Carro para Alugar (Investidor)</option>
                        <option value="franchise">Quero Licenciar Minha Frota (Gestor)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">Sua Cidade / Estado</label>
                      <input 
                        type="text" 
                        placeholder="Ex: São Paulo - SP"
                        value={leadForm.city}
                        onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">Mensagem Opcional</label>
                    <textarea 
                      placeholder="Conte-nos mais sobre sua necessidade..."
                      value={leadForm.message}
                      onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent min-h-[90px]"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={leadStatus === 'loading'}
                    className="btn-primary w-full py-4 text-sm font-bold bg-accent hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-2"
                  >
                    {leadStatus === 'loading' ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        Enviar Solicitação <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FAQ SECTION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 bg-white/5 border-t border-white/10 relative z-10">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">DÚVIDAS FREQUENTES</span>
            <h2 className="text-3xl font-display font-extrabold uppercase text-white">
              PERGUNTAS RECORRENTES
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, fIdx) => (
              <div 
                key={fIdx} 
                className="rounded-2xl border border-white/10 bg-[#0b0f19] overflow-hidden transition-all duration-300"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === fIdx ? null : fIdx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-display font-bold text-sm sm:text-base text-white uppercase tracking-tight">
                    {faq.q}
                  </span>
                  <div className={cn("p-1.5 rounded-full bg-white/5 text-accent border border-white/10 transition-all shrink-0", 
                    activeFaq === fIdx ? "rotate-180" : "rotate-0"
                  )}>
                    <ChevronDown size={16} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {activeFaq === fIdx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <a 
          href="https://wa.me/5511999999999?text=Gostaria%20de%20saber%20mais%20sobre%20o%20aluguel%20de%20carros%20na%20Efraim%20Frotas"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-emerald-500 text-white font-bold p-4 rounded-full shadow-2xl hover:bg-emerald-600 transition-all hover:scale-110 border border-white/20"
        >
          <MessageSquare size={22} fill="currentColor" />
        </a>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#070a11] text-white py-16 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-white font-bold">
                  E
                </div>
                <span className="font-display font-extrabold text-base tracking-tight uppercase">EFRAIM FROTAS</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Sua plataforma definitiva em gestão de mobilidade urbana e frotas de alta performance.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Navegação</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><a href="#plans" className="hover:text-white transition-colors">Opções de Carros</a></li>
                <li><a href="#simulator" className="hover:text-white transition-colors">Simulador ROI</a></li>
                <li><a href="#leads" className="hover:text-white transition-colors">Solicitar Aluguel</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Legal & Segurança</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><span className="text-slate-400">Termos e LGPD</span></li>
                <li><span className="text-slate-400">Contratos Digitais</span></li>
                <li><span className="text-slate-400">Pagamento Pix Criptografado</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Atendimento</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                São Paulo - SP, Brasil<br />
                Atendimento: comercial@efraimfrotas.com.br
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Efraim Frotas. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <span>Termos</span>
              <span>Privacidade</span>
              <span>Suporte</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
