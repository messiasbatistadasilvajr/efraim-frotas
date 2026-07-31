/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  BarChart3, 
  Car, 
  Users, 
  FileText, 
  Wrench, 
  AlertCircle, 
  DollarSign, 
  LogOut, 
  Menu,
  ChevronRight,
  TrendingUp,
  Clock,
  LayoutDashboard,
  ClipboardCheck,
  MapPin,
  Smartphone,
  Download,
  Settings,
  ShieldCheck,
  Kanban,
  Building2
} from 'lucide-react';
import { auth, signInWithGoogle, logout, db } from './lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { cn } from './lib/utils';
import { Dashboard } from './components/Dashboard';
import { Fleet } from './components/Fleet';
import { Drivers } from './components/Drivers';
import { Contracts } from './lib/Contracts';
import { Finances } from './components/Finances';
import { MaintenanceList } from './components/Maintenance';
import { Tracking } from './components/Tracking';
import { DriverPortal } from './components/DriverPortal';
import { Fines } from './components/Fines';
import { Checklists } from './components/Checklists';
import { Analytics } from './components/Analytics';
import { CautionaryReport } from './components/CautionaryReport';
import { VehicleDetails } from './components/VehicleDetails';
import { LandingPage } from './components/LandingPage';
import { Issues } from './components/Issues';
import { N8nSettings } from './components/N8nSettings';
import { EnterpriseDashboard } from './components/EnterpriseDashboard';
import { ProposalsManager } from './components/ProposalsManager';
import { OperationsKanban } from './components/OperationsKanban';
import { InvestorPortal } from './components/InvestorPortal';
import { ProposalNotificationToast } from './components/ProposalNotificationToast';

type View = 'dashboard' | 'fleet' | 'drivers' | 'contracts' | 'finances' | 'fines' | 'checklists' | 'maintenance' | 'analytics' | 'tracking' | 'driver-portal' | 'cautionary-report' | 'vehicle-details' | 'issues' | 'n8n' | 'enterprise' | 'proposals' | 'kanban-ops' | 'investor-portal';

export default function App() {
  const [user, setUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'manager' | 'driver' | 'user'>('user');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activeTabInstall, setActiveTabInstall] = useState<'android' | 'ios'>('android');
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) main.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    const isDemo = localStorage.getItem('efraim_demo_session') === 'true';
    const demoRole = localStorage.getItem('efraim_demo_role') as 'manager' | 'driver' || 'manager';

    if (isDemo) {
      setUser({
        uid: demoRole === 'manager' ? 'demo-manager' : 'demo-driver',
        email: demoRole === 'manager' ? 'messiasbjunior76@gmail.com' : 'motorista_demo@efraim.com',
        displayName: demoRole === 'manager' ? 'Messias Bernardes (Gestor)' : 'Thiago Martins (Motorista)',
        photoURL: null,
      } as any);
      setRole(demoRole);
      setCurrentView(demoRole === 'manager' ? 'dashboard' : 'driver-portal');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          // 1. Check if user is a manager (Hardcoded super-admin or in collection)
          const managersSnap = await getDocs(query(collection(db, 'managers'), where('email', '==', user.email)));
          const isSuperAdmin = user.email === 'messiasbjunior76@gmail.com';

          if (!managersSnap.empty || isSuperAdmin) {
            setRole('manager');
            if (currentView === 'driver-portal') setCurrentView('dashboard');
          } else {
            // 2. Check if user is a driver
            const driversSnap = await getDocs(query(collection(db, 'drivers'), where('email', '==', user.email)));
            if (!driversSnap.empty) {
              setRole('driver');
              setCurrentView('driver-portal');
            } else {
              // 3. Regular owner/New user
              setRole('user');
              setCurrentView('dashboard');
            }
          }
        } catch (e) {
          console.error("Error check role:", e);
          setRole('user');
        }
      } else {
        setRole('user');
      }
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const enterAsDemoManager = () => {
    localStorage.setItem('efraim_demo_session', 'true');
    localStorage.setItem('efraim_demo_role', 'manager');
    setUser({
      uid: 'demo-manager',
      email: 'messiasbjunior76@gmail.com',
      displayName: 'Messias Bernardes (Gestor)',
      photoURL: null,
    } as any);
    setRole('manager');
    setCurrentView('dashboard');
  };

  const enterAsDemoDriver = () => {
    localStorage.setItem('efraim_demo_session', 'true');
    localStorage.setItem('efraim_demo_role', 'driver');
    setUser({
      uid: 'demo-driver',
      email: 'motorista_demo@efraim.com',
      displayName: 'Thiago Martins (Motorista)',
      photoURL: null,
    } as any);
    setRole('driver');
    setCurrentView('driver-portal');
  };

  const handleLogout = async () => {
    localStorage.removeItem('efraim_demo_session');
    localStorage.removeItem('efraim_demo_role');
    await logout();
    setUser(null);
    setRole('user');
    setShowLandingPage(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 bg-accent rounded-2xl animate-spin [animation-duration:3s]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-display font-bold text-xl tracking-tight text-ink">Efraim Frotas</h2>
            <p className="text-subtle text-sm animate-pulse">Sincronizando sua frota...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && showLandingPage) {
    return (
      <LandingPage 
        onLogin={() => setShowLandingPage(false)} 
        onDemoManager={enterAsDemoManager}
        onDemoDriver={enterAsDemoDriver}
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex flex-col md:flex-row overflow-hidden italic-headings">
        {/* Left Side: Branding & Visuals */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-ink relative items-center justify-center p-12 overflow-hidden">
          <button 
            onClick={() => setShowLandingPage(true)}
            className="absolute top-8 left-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest z-20"
          >
            ← Voltar para Início
          </button>
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2000" 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay grayscale"
              alt="Fleet management"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-ink via-ink/80 to-transparent"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-xl space-y-12">
            <div className="space-y-4">
              <div className="h-1 w-20 bg-accent rounded-full"></div>
              <h1 className="text-6xl lg:text-8xl font-display font-extrabold text-white tracking-tighter leading-[0.85] uppercase">
                Domine sua <br />
                <span className="text-accent italic">Passarela.</span>
              </h1>
            </div>
            
            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-12">
              <div className="space-y-2">
                <p className="text-accent text-xs font-bold uppercase tracking-[0.2em]">01. Lucratividade</p>
                <p className="text-white/60 text-sm leading-relaxed">ROI em tempo real para cada veículo da sua frota.</p>
              </div>
              <div className="space-y-2">
                <p className="text-accent text-xs font-bold uppercase tracking-[0.2em]">02. Segurança</p>
                <p className="text-white/60 text-sm leading-relaxed">Alertas inteligentes de documentação e revisão.</p>
              </div>
              <div className="space-y-2">
                <p className="text-accent text-xs font-bold uppercase tracking-[0.2em]">03. Performance</p>
                <p className="text-white/60 text-sm leading-relaxed">Rankings de motoristas baseados em dados reais.</p>
              </div>
              <div className="space-y-2">
                <p className="text-accent text-xs font-bold uppercase tracking-[0.2em]">04. Controle</p>
                <p className="text-white/60 text-sm leading-relaxed">Gestão financeira completa com checkout via Pix.</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 left-12 flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <span>© {new Date().getFullYear()} Efraim Frotas</span>
            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
            <span>Tecnologia para Parceiros Uber</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-24 bg-surface">
          <div className="w-full max-w-sm space-y-12">
            <div className="space-y-3">
              <div className="md:hidden flex items-center gap-2 mb-8">
                <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold">E</div>
                <span className="font-display font-bold text-xl uppercase tracking-tight text-ink">Efraim Frotas</span>
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-ink">Bem-vindo à Gestão Profissional.</h2>
              <p className="text-subtle text-[15px]">Faça login para acessar o painel de controle da sua frota.</p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <button
                  onClick={signInWithGoogle}
                  className="w-full flex items-center justify-center gap-4 bg-ink text-white py-4 px-6 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-ink/10 group animate-in fade-in"
                >
                  <div className="bg-white p-1 rounded-md group-hover:scale-110 transition-transform">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
                  </div>
                  <span>Acessar via Google</span>
                </button>

                <button
                  onClick={enterAsDemoManager}
                  className="w-full flex items-center justify-center gap-2 bg-accent text-white py-3.5 px-6 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg shadow-accent/20 text-sm"
                >
                  <span>Entrar como Gestor (Demonstração)</span>
                </button>

                <button
                  onClick={enterAsDemoDriver}
                  className="w-full flex items-center justify-center gap-2 bg-surface text-ink border border-line py-3 px-6 rounded-xl font-bold hover:bg-bg transition-all text-xs"
                >
                  <span>Entrar como Motorista (Exemplo)</span>
                </button>
              </div>

              <div className="relative py-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
                </div>
                <span className="relative px-4 bg-surface text-[10px] font-bold uppercase tracking-[0.2em] text-subtle">Acesso Restrito</span>
              </div>

              <div className="p-4 bg-muted rounded-xl border border-line">
                <div className="flex gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg h-fit text-accent">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ink mb-1">Pronto para escalar?</p>
                    <p className="text-[12px] text-subtle leading-relaxed">
                      Gerencie múltiplos motoristas e veículos de forma automatizada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <footer className="pt-12 text-center md:text-left">
              <p className="text-[11px] text-subtle leading-relaxed">
                Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade de dados da frota.
              </p>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Monitoramento', icon: LayoutDashboard },
    { id: 'analytics', label: 'Performance', icon: TrendingUp },
    { id: 'fleet', label: 'Frota', icon: Car },
    { id: 'drivers', label: 'Motoristas', icon: Users },
    { id: 'contracts', label: 'Contratos', icon: FileText },
    { id: 'proposals', label: 'Propostas & Orçamentos', icon: FileText },
    { id: 'kanban-ops', label: 'Kanban Operacional', icon: Kanban },
    { id: 'investor-portal', label: 'Portal do Investidor', icon: Building2 },
    { id: 'finances', label: 'Financeiro', icon: DollarSign },
    { id: 'fines', label: 'Multas', icon: AlertCircle },
    { id: 'checklists', label: 'Checklists', icon: ClipboardCheck },
    { id: 'maintenance', label: 'Manutenção', icon: Wrench },
    { id: 'issues', label: 'Ocorrências', icon: AlertCircle },
    { id: 'tracking', label: 'Rastreamento', icon: MapPin },
    { id: 'n8n', label: 'Automações n8n', icon: Settings },
    { id: 'enterprise', label: 'Painel Enterprise', icon: ShieldCheck },
    { id: 'driver-portal', label: 'Portal do Motorista', icon: Users },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (role === 'driver') {
      return ['driver-portal', 'tracking'].includes(item.id);
    }
    if (role === 'manager') {
      return true; // Manager sees everything
    }
    // Regular owners see everything except the portal (unless manually opened)
    return item.id !== 'driver-portal';
  });

  return (
    <div className="flex min-h-screen bg-bg text-ink font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-surface border-r border-line transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-[240px]" : "w-20"
        )}
      >
        <div className="p-8 flex items-center gap-3">
          <div className="min-w-[24px] h-6 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-accent/20">
            <TrendingUp size={14} />
          </div>
          {sidebarOpen && <span className="font-display font-bold text-[18px] tracking-tight uppercase text-ink">Efraim Frotas</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as View);
                if (item.id === 'contracts') setSelectedDriverId(null);
                if (item.id === 'fleet') setSelectedVehicleId(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all text-[14px] font-medium",
                currentView === item.id 
                  ? "bg-bg text-ink" 
                  : "text-subtle hover:text-ink"
              )}
            >
              <item.icon size={18} className={currentView === item.id ? "text-accent" : "text-subtle"} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-line space-y-4">
          <button
            onClick={() => setShowInstallModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-accent/10 hover:bg-accent/25 text-accent transition-all text-[13px] font-bold"
          >
            <Smartphone size={16} />
            {sidebarOpen && <span>Baixar no Celular</span>}
          </button>

          {sidebarOpen && (
            <div>
              <p className="text-[11px] font-bold text-subtle uppercase tracking-widest mb-1">v2.4.0 • Licença Ativa</p>
              <p className="text-[12px] font-medium text-subtle truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-danger hover:bg-danger/5 transition-all text-[14px] font-medium"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-20 bg-surface border-b border-line flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-bg rounded-lg transition-colors text-subtle"
            >
              <Menu size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-[11px] font-bold text-subtle bg-bg px-3 py-1 rounded-full uppercase tracking-wider">
              <Clock size={12} />
              <span>Online</span>
            </div>
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-8 h-8 rounded-full border border-line" 
              alt={user.displayName || 'User'} 
            />
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 min-h-[calc(100vh-80px)]">
          {/* Mercado Livre Style Sound & Voice Notification Toast */}
          <ProposalNotificationToast onOpenProposalsView={() => setCurrentView('proposals')} />

          {currentView === 'dashboard' && <Dashboard onViewChange={setCurrentView} />}
          {currentView === 'analytics' && <Analytics />}
          {currentView === 'fleet' && (
            <Fleet onSelectVehicle={(id) => {
              setSelectedVehicleId(id);
              setCurrentView('vehicle-details');
            }} />
          )}
          {currentView === 'vehicle-details' && (
            selectedVehicleId ? (
              <VehicleDetails 
                vehicleId={selectedVehicleId} 
                onBack={() => setCurrentView('fleet')} 
              />
            ) : (
              <Fleet onSelectVehicle={(id) => {
                setSelectedVehicleId(id);
                setCurrentView('vehicle-details');
              }} />
            )
          )}
          {currentView === 'drivers' && (
            <Drivers 
              onSelectDriver={(id) => {
                setSelectedDriverId(id);
                setCurrentView('contracts');
              }} 
              onSelectVehicle={(id) => {
                setSelectedVehicleId(id);
                setCurrentView('vehicle-details');
              }}
            />
          )}
          {currentView === 'contracts' && (
            <Contracts 
              initialDriverId={selectedDriverId} 
              onSelectVehicle={(id) => {
                setSelectedVehicleId(id);
                setCurrentView('vehicle-details');
              }}
            />
          )}
          {currentView === 'proposals' && <ProposalsManager />}
          {currentView === 'kanban-ops' && <OperationsKanban />}
          {currentView === 'investor-portal' && <InvestorPortal />}
          {currentView === 'finances' && <Finances />}
          {currentView === 'fines' && <Fines />}
          {currentView === 'checklists' && (
            <Checklists onSelectReport={(id) => {
              setSelectedChecklistId(id);
              setCurrentView('cautionary-report');
            }} />
          )}
          {currentView === 'maintenance' && <MaintenanceList />}
          {currentView === 'issues' && <Issues />}
          {currentView === 'tracking' && <Tracking />}
          {currentView === 'n8n' && <N8nSettings />}
          {currentView === 'enterprise' && <EnterpriseDashboard />}
          {currentView === 'driver-portal' && <DriverPortal />}
          {currentView === 'cautionary-report' && (
            selectedChecklistId ? (
              <CautionaryReport 
                checklistId={selectedChecklistId} 
                onBack={() => setCurrentView('checklists')} 
              />
            ) : (
              <Checklists onSelectReport={(id) => {
                setSelectedChecklistId(id);
                setCurrentView('cautionary-report');
              }} />
            )
          )}
        </div>
      </main>

      {/* Modern PWA Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-lg rounded-2xl border border-line overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-line flex items-center justify-between bg-bg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl text-accent">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink">Efraim Frotas no Celular</h3>
                  <p className="text-xs text-subtle">Instale sem passar pelas lojas oficiais</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstallModal(false)}
                className="p-2 hover:bg-bg rounded-lg text-subtle hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Inner Content */}
            <div className="p-6 space-y-6 flex-1">
              <p className="text-sm text-subtle leading-relaxed">
                Este sistema foi desenvolvido como uma tecnologia <strong>Progressive Web App (PWA)</strong>. Você pode "instalá-lo" diretamente no seu celular em menos de 10 segundos, no tamanho correto de tela e sem ocupar a memória do aparelho!
              </p>

              {/* Tabs selector */}
              <div className="flex bg-bg rounded-lg p-1 border border-line">
                <button
                  onClick={() => setActiveTabInstall('android')}
                  className={cn(
                    "flex-1 py-2 rounded-md font-bold text-xs transition-all uppercase tracking-wider",
                    activeTabInstall === 'android' ? "bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-accent" : "text-subtle hover:text-ink"
                  )}
                >
                  Android (Chrome)
                </button>
                <button
                  onClick={() => setActiveTabInstall('ios')}
                  className={cn(
                    "flex-1 py-2 rounded-md font-bold text-xs transition-all uppercase tracking-wider",
                    activeTabInstall === 'ios' ? "bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-accent" : "text-subtle hover:text-ink"
                  )}
                >
                  iOS / iPhone (Safari)
                </button>
              </div>

              {/* Tab: Android */}
              {activeTabInstall === 'android' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                    <p className="text-sm text-ink font-medium">Abra o site <strong>Efraim Frotas</strong> no navegador Chrome do seu celular.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                    <p className="text-sm text-ink font-medium">Toque nos <strong>três pontinhos</strong> <span className="font-bold text-subtle bg-bg px-2 py-0.5 rounded border border-line">⋮</span> no canto superior direito.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                    <p className="text-sm text-ink font-medium">Procure e toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-2">
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                      🚀 <strong>Pronto!</strong> Um ícone oficial do <strong>Efraim Frotas</strong> surgirá na tela inicial e gaveta de aplicativos do seu celular, rodando offline e em tela cheia de forma instantânea!
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: iOS */}
              {activeTabInstall === 'ios' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                    <p className="text-sm text-ink font-medium">Abra o site <strong>Efraim Frotas</strong> no navegador <strong>Safari</strong> do seu iPhone.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                    <p className="text-sm text-ink font-medium">Toque no botão de <strong>Compartilhar</strong> (ícone de um quadrado com uma flecha apontando para cima) na barra inferior.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                    <p className="text-sm text-ink font-medium">Role o menu para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-2">
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                      ✨ <strong>Pronto!</strong> O aplicativo será adicionado à sua tela inicial do iPhone, rodando em tela cheia com a melhor performance nativa da Apple!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-muted border-t border-line flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 bg-ink hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

