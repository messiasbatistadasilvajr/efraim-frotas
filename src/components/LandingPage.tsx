import React from 'react';
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
  Wrench
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-bg text-ink scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-line px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent/20">
            <TrendingUp size={18} />
          </div>
          <span className="font-display font-bold text-[20px] tracking-tight uppercase">Efraim Frotas</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[13px] font-bold uppercase tracking-widest text-subtle hover:text-ink transition-colors">Funcionalidades</a>
          <a href="#stats" className="text-[13px] font-bold uppercase tracking-widest text-subtle hover:text-ink transition-colors">Resultados</a>
          <a href="#about" className="text-[13px] font-bold uppercase tracking-widest text-subtle hover:text-ink transition-colors">Sobre</a>
          <button 
            onClick={onLogin}
            className="btn-primary px-6 py-2.5 text-[13px]"
          >
            Acessar Painel
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
              Plataforma v2.4.0 Live
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tighter leading-[0.85] uppercase">
              REVOLUCIONE SUA <br />
              <span className="text-accent italic">GESTÃO DE FROTA.</span>
            </h1>
            <p className="text-xl text-subtle leading-relaxed max-w-lg">
              A solução definitiva para gestores de frotas e parceiros Uber. Controle financeiro, manutenção preventiva e monitoramento em tempo real em uma única tela.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onLogin}
                className="btn-primary group flex items-center justify-center gap-3 px-8 py-4 text-[15px]"
              >
                Começar Agora
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4 px-6 py-4 rounded-xl border border-line bg-surface">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <img 
                      key={i}
                      src={`https://ui-avatars.com/api/?name=U${i}&background=random`} 
                      className="w-8 h-8 rounded-full border-2 border-surface" 
                      alt=""
                    />
                  ))}
                </div>
                <div className="text-[12px] font-bold">
                  <span className="text-emerald-600">+150 Gestores</span> ativos
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-[32px] overflow-hidden shadow-2xl shadow-ink/20">
              <img 
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200" 
                className="w-full h-full object-cover"
                alt="Fleet Management Dashboard Preview"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent"></div>
            </div>
            
            {/* Contextual Widgets */}
            <div className="absolute -top-6 -right-6 panel p-4 shadow-2xl animate-float">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-subtle uppercase">ROI Mensal</p>
                  <p className="text-xl font-bold">+24.8%</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-8 panel p-6 shadow-2xl animate-float-delayed max-w-[200px]">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-subtle">Contratos Ativos</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-accent rounded-full"></div>
                  <div className="h-2 flex-1 bg-accent rounded-full"></div>
                  <div className="h-2 w-8 bg-line rounded-full"></div>
                </div>
                <p className="text-[14px] font-bold">85% Ocupação</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight uppercase">
              Tudo o que sua <span className="text-accent italic">frota precisa.</span>
            </h2>
            <p className="text-subtle text-lg max-w-2xl mx-auto">
              Desenvolvido por quem entende as dores reais da gestão de veículos para aplicativos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "Gestão de Motoristas", desc: "Cadastro completo com alertas de vencimento de CNH e histórico de performance." },
              { icon: FileText, title: "Contratos Inteligentes", desc: "Gerencie locações, cauções e termos de uso com assinatura simplificada." },
              { icon: DollarSign, title: "Controle Financeiro", desc: "Lançamentos automáticos, fluxo de caixa e alertas de inadimplência em tempo real." },
              { icon: Wrench, title: "Manutenção Preventiva", desc: "Cronograma de revisões, histórico de reparos e alertas de pneus e óleo." },
              { icon: Calculator, title: "Checkout Pix", desc: "Gere links de pagamento via Pix diretamente pelo app para seus motoristas." },
              { icon: Smartphone, title: "Portal do Motorista", desc: "Área exclusiva para parceiros consultarem extratos, multas e solicitarem suporte." },
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="panel p-8 group hover:border-accent transition-all duration-300"
              >
                <div className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-subtle text-[15px] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-32 px-6">
        <div className="max-w-7xl mx-auto rounded-[40px] bg-ink p-12 md:p-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
          </div>
          
          <div className="relative z-10 grid md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
            {[
              { label: "Veículos Gerenciados", val: "+2.500" },
              { label: "Economia em Manutenção", val: "35%" },
              { label: "Redução de Inadimplência", val: "60%" },
              { label: "Suporte 24/7", val: "100%" },
            ].map((s, i) => (
              <div key={i} className="space-y-2">
                <p className="text-accent text-[11px] font-bold uppercase tracking-[0.2em]">{s.label}</p>
                <p className="text-5xl font-display font-bold text-white leading-tight">{s.val}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-20 pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
            <h3 className="text-2xl font-display font-medium text-white/80 max-w-lg italic">
              "A Efraim Frotas mudou a forma como lidamos com os depósitos e revisões. Simplesmente não perdemos mais prazos."
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white font-bold">Marcos Silva</p>
                <p className="text-white/40 text-[12px]">Gestor de Frota SP</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing/About - Call to Action */}
      <section id="about" className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight uppercase leading-none">
            PRONTO PARA O <br />
            <span className="text-accent italic">PRÓXIMO NÍVEL?</span>
          </h2>
          <p className="text-xl text-subtle">
            Junte-se a centenas de empreendedores que profissionalizaram sua gestão de frota com a Efraim. Comece seu período de teste hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={onLogin}
              className="btn-primary px-12 py-5 text-lg font-bold shadow-2xl shadow-accent/20"
            >
              Criar minha conta grátis
            </button>
            <button className="px-12 py-5 text-lg font-bold border border-line rounded-xl hover:bg-surface transition-all">
              Falar com Consultor
            </button>
          </div>
          
          <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
            <div className="flex items-center justify-center font-display font-bold text-2xl tracking-tighter">UBER</div>
            <div className="flex items-center justify-center font-display font-bold text-2xl tracking-tighter">99</div>
            <div className="flex items-center justify-center font-display font-bold text-2xl tracking-tighter">INDrive</div>
            <div className="flex items-center justify-center font-display font-bold text-2xl tracking-tighter">MAXIM</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white">
                  <TrendingUp size={18} />
                </div>
                <span className="font-display font-bold text-[18px] tracking-tight uppercase italic">Efraim Frotas</span>
              </div>
              <p className="text-white/40 text-[14px] leading-relaxed">
                Tecnologia de ponta para a gestão inteligente de ativos automotivos no mercado de mobilidade urbana.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Plataforma</h4>
              <ul className="space-y-4 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Monitoramento</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Contratos</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Checklist Digital</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Manutenção</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Empresa</h4>
              <ul className="space-y-4 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Blog da Frota</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Termos</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Suporte</h4>
              <ul className="space-y-4 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Tutorial de Início</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors text-[13px] font-medium tracking-wide">Contato</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-white/20">
            <p>© {new Date().getFullYear()} Efraim Frotas Gestão de Ativos. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const Calculator = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>
);
