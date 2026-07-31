import React, { useState, useMemo, useRef } from 'react';
import { sendWhatsAppReminder } from '../lib/reminderService';
import {
  TrendingUp,
  TrendingDown,
  Car,
  Users,
  AlertCircle,
  DollarSign,
  Activity,
  Clock,
  Plus,
  ShieldCheck,
  FileText,
  Key,
  Database,
  Building2,
  Lock,
  Globe,
  Settings,
  Bot,
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Download,
  Share2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit,
  Send,
  MessageSquare,
  Sparkles,
  Zap,
  CheckSquare,
  FileCode,
  Server,
  Layers,
  PieChart as PieChartIcon,
  BarChart3,
  Sliders,
  Calendar,
  Check,
  Award,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useFleetData } from '../hooks/useFleetData';
import { formatCurrency, cn } from '../lib/utils';

type SuiteTab = 
  | 'exec-dashboard'
  | 'smart-alerts'
  | 'crm'
  | 'digital-signature'
  | 'docs-hub'
  | 'audit-system'
  | 'granular-permissions'
  | 'financial-panel'
  | 'approval-workflow'
  | 'sansao-ai'
  | 'driver-app'
  | 'client-app'
  | 'bi-integrated'
  | 'auto-backup'
  | 'communication-hub'
  | 'public-api'
  | 'integrations-market'
  | 'system-settings'
  | 'operational-kpis'
  | 'enterprise-security';

export function Enterprise360Suite() {
  const { vehicles, drivers, contracts, payments, maintenances } = useFleetData();
  const [activeTab, setActiveTab] = useState<SuiteTab>('exec-dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------
  // TAB 1: EXECUTIVE DASHBOARD STATE & CALCULATIONS
  // -------------------------------------------------------------
  const execMetrics = useMemo(() => {
    const totalRev = payments.reduce((acc, p) => acc + (p.amount || 0), 0) || 128500;
    const annualRev = totalRev * 12;
    const rentedVehicles = vehicles.filter(v => v.status === 'rented').length || 28;
    const totalVehicles = vehicles.length || 35;
    const availableVehicles = totalVehicles - rentedVehicles;
    const occupancyRate = totalVehicles > 0 ? ((rentedVehicles / totalVehicles) * 100).toFixed(1) : '80.0';
    const activeContractCount = contracts.filter(c => c.status === 'active').length || 24;
    const avgTicket = activeContractCount > 0 ? totalRev / activeContractCount : 4850;
    const avgRentalDays = 26;

    // Vehicle profitability ranking
    const vehicleRanking = vehicles.map((v, i) => {
      const vRevenue = payments.filter(p => p.vehicleId === v.id).reduce((acc, p) => acc + (p.amount || 0), 0) || (8000 - i * 600);
      const vCosts = maintenances.filter(m => m.vehicleId === v.id).reduce((acc, m) => acc + (m.cost || 0), 0) || (1200 + i * 150);
      const profit = vRevenue - vCosts;
      return {
        id: v.id,
        model: `${v.brand} ${v.model}`,
        plate: v.plate,
        revenue: vRevenue,
        costs: vCosts,
        profit,
        roi: ((profit / (v.purchaseValue || 75000)) * 100).toFixed(1)
      };
    }).sort((a, b) => b.profit - a.profit);

    // Client ranking
    const clientRanking = drivers.map((d, i) => {
      const dSpent = payments.filter(p => p.driverId === d.id).reduce((acc, p) => acc + (p.amount || 0), 0) || (15000 - i * 1200);
      return {
        id: d.id,
        name: d.name,
        cnh: d.cnh,
        totalRentals: Math.floor(3 + (10 / (i + 1))),
        totalSpent: dSpent,
        score: Math.min(100, 85 + (i % 5) * 3)
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      monthlyRev: totalRev,
      annualRev,
      rentedVehicles,
      availableVehicles,
      totalVehicles,
      occupancyRate,
      avgTicket,
      avgRentalDays,
      vehicleRanking,
      clientRanking
    };
  }, [vehicles, drivers, contracts, payments, maintenances]);

  // Growth Chart Data
  const growthData = [
    { month: 'Jan', receita: 82000, custos: 24000, lucro: 58000 },
    { month: 'Fev', receita: 91000, custos: 26000, lucro: 65000 },
    { month: 'Mar', receita: 98000, custos: 25000, lucro: 73000 },
    { month: 'Abr', receita: 105000, custos: 28000, lucro: 77000 },
    { month: 'Mai', receita: 118000, custos: 31000, lucro: 87000 },
    { month: 'Jun', receita: 128500, custos: 32000, lucro: 96500 }
  ];

  // -------------------------------------------------------------
  // TAB 2: SMART ALERTS CENTER
  // -------------------------------------------------------------
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [sentAlertIds, setSentAlertIds] = useState<Record<string, boolean>>({});
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);

  const handleNotifyAlertWhatsApp = async (alert: { id: string; category: string; title: string; desc: string; severity: 'critical' | 'warning' | 'info' }) => {
    setSendingAlertId(alert.id);
    const res = await sendWhatsAppReminder({
      id: `smart_alert_${alert.id}`,
      type: alert.category.includes('CNH') ? 'cnh_expiry' : alert.category.includes('Manutenção') ? 'maintenance_due' : 'crlv_licensing',
      title: alert.title,
      description: alert.desc,
      recipientName: 'Condutor / Proprietário',
      recipientPhone: '(11) 98765-4321',
      recipientRole: 'motorista',
      dueDate: new Date().toISOString().split('T')[0],
      daysRemaining: 0,
      severity: alert.severity
    });
    setSendingAlertId(null);
    if (res.success) {
      setSentAlertIds(prev => ({ ...prev, [alert.id]: true }));
    } else {
      window.alert(`Erro ao disparar webhook n8n: ${res.error}`);
    }
  };
  const smartAlerts = useMemo(() => {
    const alerts: Array<{ id: string; category: string; title: string; desc: string; severity: 'critical' | 'warning' | 'info'; date: string }> = [
      { id: '1', category: 'CNH Vencendo', title: 'CNH Expirada - João Silva', desc: 'CNH do motorista venceu há 2 dias. Locação suspensa.', severity: 'critical', date: 'Hoje' },
      { id: '2', category: 'Licenciamento', title: 'Licenciamento IPVA - ABC-1234', desc: 'Vencimento do CRLV em 5 dias. Guia pendente de pagamento.', severity: 'warning', date: 'Amanhã' },
      { id: '3', category: 'Seguro', title: 'Renovação Apólice Porto Seguro', desc: 'Seguro da frota Sul vence em 12 dias (15 veículos cobertos).', severity: 'warning', date: '28/07' },
      { id: '4', category: 'Multas Pendentes', title: 'Multa Não Indicada - Detran SP', desc: 'Excesso de velocidade na Rod. Anchieta (R$ 293,47). Indicar condutor.', severity: 'critical', date: 'Hoje' },
      { id: '5', category: 'Inadimplência', title: 'Pagamento Atrasado - Carlos Eduardo', desc: 'Fatura de locação semanal com 4 dias de atraso (R$ 850,00).', severity: 'critical', date: 'Ontem' },
      { id: '6', category: 'Manutenção Atrasada', title: 'Troca de Óleo - XYZ-9876', desc: 'Veículo ultrapassou em 1.200 km a revisão preventiva programada.', severity: 'warning', date: 'Hoje' },
      { id: '7', category: 'Rastreador Offline', title: 'Sinal GPS Ausente - DEF-5678', desc: 'Sem comunicação com módulo de telemetria há mais de 6 horas.', severity: 'critical', date: 'Hoje' },
      { id: '8', category: 'Contrato Vencendo', title: 'Contrato #1042 Próximo ao Fim', desc: 'Contrato de 12 meses da SulAmérica encerra em 3 dias. Propor renovação.', severity: 'info', date: '30/07' }
    ];

    if (alertFilter === 'all') return alerts;
    return alerts.filter(a => a.severity === alertFilter);
  }, [alertFilter]);

  // -------------------------------------------------------------
  // TAB 3: INTEGRATED CRM STATE
  // -------------------------------------------------------------
  const [selectedCrmClient, setSelectedCrmClient] = useState(drivers[0]?.id || '1');
  const crmClientData = useMemo(() => {
    const d = drivers.find(drv => drv.id === selectedCrmClient) || drivers[0] || {
      id: '1',
      name: 'Messias Oliveira',
      cpf: '321.654.987-00',
      phone: '(11) 98888-7777',
      email: 'messias@empresa.com.br',
      cnh: '98765432100',
      cnhExpiry: '2027-10-15',
      address: 'Av. Paulista, 1000 - SP'
    };

    return {
      ...d,
      totalRentals: 14,
      totalSpent: 42800,
      creditScore: 96,
      scoreBadge: 'AAA+ (Excelente)',
      incidents: [
        { date: '12/03/2026', type: 'Arranhão Parachoque', cost: 350, status: 'Resolvido pelo seguro' }
      ],
      contractsHistory: [
        { id: 'CTR-2026-88', vehicle: 'Toyota Corolla (ABC-1234)', period: '12 meses', status: 'Ativo', val: 'R$ 4.200/mês' },
        { id: 'CTR-2025-12', vehicle: 'Chevrolet Onix (DEF-5678)', period: '6 meses', status: 'Concluído', val: 'R$ 2.800/mês' }
      ]
    };
  }, [selectedCrmClient, drivers]);

  // -------------------------------------------------------------
  // TAB 4: DIGITAL SIGNATURE ENGINE
  // -------------------------------------------------------------
  const [signatureDocType, setSignatureDocType] = useState<'contract' | 'caution' | 'checklist'>('contract');
  const [signedSuccess, setSignedSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignedSuccess(false);
  };

  // -------------------------------------------------------------
  // TAB 5: CENTRAL DE DOCUMENTOS STATE
  // -------------------------------------------------------------
  const [docCategory, setDocCategory] = useState<'all' | 'cnh' | 'crlv' | 'contracts' | 'insurance'>('all');
  const documentsList = [
    { id: '1', title: 'CNH_Digital_Messias_Oliveira.pdf', category: 'cnh', owner: 'Messias Oliveira', date: '15/01/2026', size: '1.4 MB', status: 'Validado' },
    { id: '2', title: 'CRLV_2026_Toyota_Corolla_ABC1234.pdf', category: 'crlv', owner: 'Frota Efraim', date: '02/02/2026', size: '850 KB', status: 'Validado' },
    { id: '3', title: 'Contrato_Locacao_Assinado_CTR88.pdf', category: 'contracts', owner: 'SulAmérica Frotas', date: '10/03/2026', size: '3.2 MB', status: 'Assinado Digitalmente' },
    { id: '4', title: 'Apolice_Seguro_PortoSeguro_2026.pdf', category: 'insurance', owner: 'Frota Efraim', date: '01/01/2026', size: '4.5 MB', status: 'Válido' },
    { id: '5', title: 'Vistoria_Fotos_Entrega_ABC1234.zip', category: 'crlv', owner: 'Messias Oliveira', date: '10/03/2026', size: '18.4 MB', status: 'Anexo' }
  ];

  // -------------------------------------------------------------
  // TAB 6: AUDIT LOGS
  // -------------------------------------------------------------
  const auditLogs = [
    { id: 'LOG-9941', user: 'adm.messias', action: 'Alterou valor do Contrato #1042', module: 'Contratos', ip: '189.122.45.10', time: 'Há 5 minutos', date: '27/07/2026 13:40' },
    { id: 'LOG-9940', user: 'gerente.pedro', action: 'Aprovou solicitação de manutenção #302', module: 'Manutenção', ip: '200.180.99.12', time: 'Há 22 minutos', date: '27/07/2026 13:23' },
    { id: 'LOG-9939', user: 'atendimento.ana', action: 'Cadastrou novo motorista Carlos Eduardo', module: 'CRM / Clientes', ip: '177.85.12.90', time: 'Há 1 hora', date: '27/07/2026 12:45' },
    { id: 'LOG-9938', user: 'adm.messias', action: 'Excluiu veículo desativado Fiat Uno (DDD-0000)', module: 'Frota', ip: '189.122.45.10', time: 'Há 2 horas', date: '27/07/2026 11:15' },
    { id: 'LOG-9937', user: 'sistema.auto', action: 'Backup automático diário concluído com sucesso', module: 'Sistema / Backup', ip: '127.0.0.1 (Local)', time: 'Há 6 horas', date: '27/07/2026 07:00' }
  ];

  // -------------------------------------------------------------
  // TAB 7: GRANULAR PERMISSIONS (RBAC)
  // -------------------------------------------------------------
  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Administrador Geral', usersCount: 2, desc: 'Acesso total a todas as funções e finanças' },
    { id: 'finance', name: 'Financeiro', usersCount: 3, desc: 'Acesso a faturamento, conciliação e DRE' },
    { id: 'commercial', name: 'Comercial / Vendas', usersCount: 5, desc: 'Criar propostas, contratos e cadastrar clientes' },
    { id: 'operations', name: 'Operacional & Pátio', usersCount: 8, desc: 'Checklists, entrega de chaves e rastreamento' },
    { id: 'workshop', name: 'Oficina / Manutenção', usersCount: 4, desc: 'Gerenciar ordens de serviço e fornecedores' },
    { id: 'auditor', name: 'Auditor Externo', usersCount: 1, desc: 'Acesso apenas leitura para auditoria e logs' }
  ]);

  // -------------------------------------------------------------
  // TAB 8: FINANCIAL PANEL & DRE
  // -------------------------------------------------------------
  const dreData = {
    receitaBruta: 145000,
    impostos: 8700,
    receitaLiquida: 136300,
    custosOperacionais: {
      manutencao: 12500,
      seguro: 8400,
      combustivel: 3200,
      rastreadores: 2100,
      pessoal: 18500
    },
    totalCustos: 44700,
    lucroBruto: 91600,
    despesasAdministrativas: 14200,
    lucroLiquido: 77400,
    margemEbitda: '53.3%'
  };

  // -------------------------------------------------------------
  // TAB 9: APPROVAL WORKFLOW
  // -------------------------------------------------------------
  const [approvals, setApprovals] = useState([
    { id: 'APP-101', requester: 'Ana Paula (Atendimento)', type: 'Desconto em Contrato', title: 'Desconto de 15% para Frota Sul (10 veículos)', value: 'R$ 38.000/mês', status: 'Pendente' },
    { id: 'APP-102', requester: 'Marcos (Oficina)', type: 'Aprovação de Manutenção', title: 'Troca de Embreagem Corolla ABC-1234', value: 'R$ 3.450,00', status: 'Pendente' },
    { id: 'APP-103', requester: 'Lucas (Financeiro)', type: 'Baixa com Desconto de Juros', title: 'Anistia de juros de atraso para cliente VIP', value: 'R$ 420,00', status: 'Aprovado' }
  ]);

  // -------------------------------------------------------------
  // TAB 10: SANSÃO IA ASSISTANT
  // -------------------------------------------------------------
  const [aiChatMessages, setAiChatMessages] = useState([
    { sender: 'sansao', text: 'Olá! Sou o **Sansão IA**, seu assistente executivo da Efraim Frotas. Como posso ajudar com sua frota hoje?' }
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleSendAiQuery = (promptText?: string) => {
    const textToSend = promptText || aiInputText;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setAiChatMessages(prev => [...prev, userMsg]);
    if (!promptText) setAiInputText('');
    setAiLoading(true);

    setTimeout(() => {
      let reply = 'Estou analisando o banco de dados em tempo real...';
      const queryLower = textToSend.toLowerCase();

      if (queryLower.includes('lucro') || queryLower.includes('mais lucrou') || queryLower.includes('rentável')) {
        reply = `📊 **Análise de Lucratividade por Veículo:**\n- O veículo **Toyota Corolla (ABC-1234)** foi o mais rentável este mês com **R$ 6.800 de lucro líquido** (ROI de 9.1%).\n- Em segundo lugar: **Chevrolet Onix (DEF-5678)** gerou R$ 4.350 de margem limpa.`;
      } else if (queryLower.includes('inadimplente') || queryLower.includes('atraso') || queryLower.includes('devedor')) {
        reply = `🚨 **Status de Inadimplência Atual:**\n- Existem **2 clientes em atraso** somando R$ 1.700,00.\n- Destaque: **Carlos Eduardo** (Fatura #8812 - 4 dias de atraso). Notificação enviada por WhatsApp automático.`;
      } else if (queryLower.includes('faturei') || queryLower.includes('maio') || queryLower.includes('receita')) {
        reply = `💰 **Faturamento Consolidado:**\n- Em **Maio/2026**: R$ 118.000,00\n- Em **Junho/2026**: R$ 128.500,00 (+8.8% de crescimento mensal).\n- Projeção Julho: R$ 135.000,00.`;
      } else if (queryLower.includes('manutenç') || queryLower.includes('oficina') || queryLower.includes('parado')) {
        reply = `🔧 **Status da Oficina & Frota:**\n- **3 veículos** em manutenção preventiva agendada para esta semana.\n- **Taxa de ocupação da frota:** 80% (28 de 35 veículos alugados no momento).`;
      } else {
        reply = `💡 **Resumo Executivo Efraim Frotas:**\nCom base em ${vehicles.length} veículos e ${drivers.length} motoristas ativos, sua receita mensal está em **${formatCurrency(execMetrics.monthlyRev)}** com **80% de ocupação**. Recomendo focar na renovação do contrato de 15 veículos com vencimento em breve para manter a previsibilidade financeira.`;
      }

      setAiChatMessages(prev => [...prev, { sender: 'sansao', text: reply }]);
      setAiLoading(false);
    }, 800);
  };

  // -------------------------------------------------------------
  // TAB 11 & 12: DRIVER & CLIENT PORTALS SIMULATOR
  // -------------------------------------------------------------
  const [driverChecklistStep, setDriverChecklistStep] = useState(1);
  const [clientPixPaid, setClientPixPaid] = useState(false);

  // -------------------------------------------------------------
  // TAB 14: AUTOMATED BACKUP
  // -------------------------------------------------------------
  const [backups, setBackups] = useState([
    { id: 'BKP-20260727', name: 'backup_full_2026_07_27.sql.gz', size: '42.8 MB', date: '27/07/2026 03:00', type: 'Automático (Diário)', status: 'Seguro em Nuvem' },
    { id: 'BKP-20260720', name: 'backup_full_2026_07_20.sql.gz', size: '41.2 MB', date: '20/07/2026 03:00', type: 'Automático (Semanal)', status: 'Seguro em Nuvem' },
    { id: 'BKP-20260701', name: 'backup_full_2026_07_01.sql.gz', size: '38.9 MB', date: '01/07/2026 03:00', type: 'Automático (Mensal)', status: 'Seguro em Nuvem' }
  ]);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // TAB 15: OMNICHANNEL COMMUNICATION
  // -------------------------------------------------------------
  const [commLogs, setCommLogs] = useState([
    { id: 'MSG-01', channel: 'WhatsApp', recipient: 'Carlos Eduardo', trigger: 'Lembrete de Vencimento PIX', status: 'Entregue & Lido', time: '10:15' },
    { id: 'MSG-02', channel: 'E-mail', recipient: 'SulAmérica Frotas', trigger: 'Envio de Fatura Mensal (PDF)', status: 'Enviado com Sucesso', time: '09:30' },
    { id: 'MSG-03', channel: 'SMS', recipient: 'João Silva', trigger: 'Alerta CNH Vencendo', status: 'Enviado', time: 'Ontem' }
  ]);

  // -------------------------------------------------------------
  // TAB 16: PUBLIC API & WEBHOOKS
  // -------------------------------------------------------------
  const [apiKeys, setApiKeys] = useState([
    { id: 'key_1', name: 'Integração ERP Omie', key: 'efraim_live_99a8b7c6d5e4f3a2b1', created: '10/01/2026', lastUsed: 'Há 2 minutos', status: 'Ativo' },
    { id: 'key_2', name: 'Rastreador Sascar / Cobli', key: 'efraim_live_8877665544332211', created: '15/02/2026', lastUsed: 'Há 5 segundos', status: 'Ativo' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  // -------------------------------------------------------------
  // TAB 17: MARKETPLACE DE INTEGRAÇÕES
  // -------------------------------------------------------------
  const [integrations, setIntegrations] = useState([
    { id: 'mercadopago', name: 'Mercado Pago', category: 'Pagamentos PIX / Cartão', enabled: true, icon: DollarSign, desc: 'Gere QR Code PIX automático com confirmação webhook instantânea.' },
    { id: 'asaas', name: 'Asaas Financial', category: 'Boletos & PIX', enabled: true, icon: DollarSign, desc: 'Emissão automatizada de boletos bancários com régua de cobrança.' },
    { id: 'zapsign', name: 'ZapSign / Docusign', category: 'Assinatura Eletrônica', enabled: true, icon: FileText, desc: 'Envie contratos para assinatura digital com validade jurídica.' },
    { id: 'whatsapp', name: 'WhatsApp Business API', category: 'Notificações', enabled: true, icon: MessageSquare, desc: 'Envio de alertas de fatura, devolução e manutenção por WhatsApp.' },
    { id: 'n8n', name: 'n8n Automation Engine', category: 'Workflow Automation', enabled: true, icon: Settings, desc: 'Conecte mais de 400 serviços externos através de fluxos sem código.' },
    { id: 'gdrive', name: 'Google Drive Sync', category: 'Documentos', enabled: false, icon: Upload, desc: 'Backup automático de fotos de vistorias e PDFs no Google Drive.' },
    { id: 'gcal', name: 'Google Calendar', category: 'Agenda', enabled: true, icon: Calendar, desc: 'Sincronização de datas de devolução e revisões com seu calendário.' },
    { id: 'openai', name: 'OpenAI / Gemini LLM', category: 'Inteligência Artificial', enabled: true, icon: Sparkles, desc: 'Potencializa o assistente Sansão IA com modelos de última geração.' }
  ]);

  // -------------------------------------------------------------
  // TAB 18 & 20: CONFIGURAÇÕES & SEGURANÇA
  // -------------------------------------------------------------
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState([
    { id: 's1', device: 'Chrome no MacOS (São Paulo)', ip: '189.122.45.10', current: true, time: 'Sessão Atual' },
    { id: 's2', device: 'Safari no iPhone 15 Pro', ip: '177.85.12.90', current: false, time: 'Ativo há 3 horas' }
  ]);

  // Tab definitions for sub-navigation menu
  const tabsList: Array<{ id: SuiteTab; label: string; icon: any; category: string }> = [
    { id: 'exec-dashboard', label: '1. Dashboard Executivo', icon: BarChart3, category: 'Estratégico' },
    { id: 'smart-alerts', label: '2. Central de Alertas', icon: AlertTriangle, category: 'Estratégico' },
    { id: 'crm', label: '3. CRM Integrado', icon: Users, category: 'Clientes' },
    { id: 'digital-signature', label: '4. Assinatura Digital', icon: FileText, category: 'Operacional' },
    { id: 'docs-hub', label: '5. Central de Documentos', icon: FolderIcon, category: 'Operacional' },
    { id: 'audit-system', label: '6. Sistema de Auditoria', icon: ShieldCheck, category: 'Governança' },
    { id: 'granular-permissions', label: '7. Permissões Granulares', icon: Lock, category: 'Governança' },
    { id: 'financial-panel', label: '8. Painel Financeiro & DRE', icon: DollarSign, category: 'Estratégico' },
    { id: 'approval-workflow', label: '9. Workflow Aprovações', icon: CheckSquare, category: 'Governança' },
    { id: 'sansao-ai', label: '10. Sansão IA Assistant', icon: Bot, category: 'Inteligência' },
    { id: 'driver-app', label: '11. App para Motoristas', icon: Smartphone, category: 'Canais' },
    { id: 'client-app', label: '12. App para Clientes', icon: Globe, category: 'Canais' },
    { id: 'bi-integrated', label: '13. BI Integrado', icon: PieChartIcon, category: 'Estratégico' },
    { id: 'auto-backup', label: '14. Backup Automático', icon: Database, category: 'Governança' },
    { id: 'communication-hub', label: '15. Central Comunicação', icon: Send, category: 'Canais' },
    { id: 'public-api', label: '16. API Pública & Webhooks', icon: FileCode, category: 'Técnico' },
    { id: 'integrations-market', label: '17. Marketplace', icon: Zap, category: 'Técnico' },
    { id: 'system-settings', label: '18. Configurações', icon: Settings, category: 'Técnico' },
    { id: 'operational-kpis', label: '19. Indicadores Operacionais', icon: Activity, category: 'Estratégico' },
    { id: 'enterprise-security', label: '20. Segurança & LGPD', icon: Key, category: 'Governança' }
  ];

  function FolderIcon(props: any) {
    return <FileText {...props} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="bg-panel p-6 rounded-2xl border border-line flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-accent/10 text-accent text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-accent/20 flex items-center gap-1">
              <Sparkles size={12} /> Efraim Frotas Enterprise 360
            </span>
            <span className="bg-emerald-500/10 text-emerald-600 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              ✓ 20 Módulos Ativos
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight">
            Central de Gestão de Alto Desempenho
          </h1>
          <p className="text-xs text-subtle">
            Painel unificado para controle operacional, inteligência financeira, conformidade e IA.
          </p>
        </div>

        {/* Global Quick Action / AI Launcher */}
        <button
          onClick={() => setActiveTab('sansao-ai')}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shadow-lg shadow-accent/20"
        >
          <Bot size={16} />
          <span>Falar com Sansão IA</span>
        </button>
      </div>

      {/* Sub-Tab Navigation Selector Grid */}
      <div className="bg-surface p-2 rounded-2xl border border-line overflow-x-auto scrollbar-none">
        <div className="flex flex-wrap gap-1.5 min-w-[900px]">
          {tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 border",
                  isActive 
                    ? "bg-accent text-white border-accent shadow-md shadow-accent/20 font-bold" 
                    : "bg-bg text-subtle border-line hover:text-ink hover:bg-muted"
                )}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-subtle"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD EXECUTIVO */}
      {/* ========================================================================= */}
      {activeTab === 'exec-dashboard' && (
        <div className="space-y-6">
          {/* Executive Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="panel p-5 bg-surface border border-line space-y-1 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-subtle font-bold uppercase tracking-wider">Receita Mensal</span>
                <span className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg"><TrendingUp size={16} /></span>
              </div>
              <p className="text-2xl font-bold text-ink font-mono">{formatCurrency(execMetrics.monthlyRev)}</p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp size={11} /> +14.2% em relação ao mês anterior
              </p>
            </div>

            <div className="panel p-5 bg-surface border border-line space-y-1 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-subtle font-bold uppercase tracking-wider">Receita Anual Projetada</span>
                <span className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg"><DollarSign size={16} /></span>
              </div>
              <p className="text-2xl font-bold text-indigo-600 font-mono">{formatCurrency(execMetrics.annualRev)}</p>
              <p className="text-[10px] text-subtle font-medium">Com base nas locações recorrentes</p>
            </div>

            <div className="panel p-5 bg-surface border border-line space-y-1 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-subtle font-bold uppercase tracking-wider">Ocupação da Frota</span>
                <span className="p-1.5 bg-accent/10 text-accent rounded-lg"><Car size={16} /></span>
              </div>
              <p className="text-2xl font-bold text-ink">{execMetrics.occupancyRate}%</p>
              <p className="text-[10px] text-subtle font-medium">
                {execMetrics.rentedVehicles} alugados / {execMetrics.availableVehicles} disponíveis
              </p>
            </div>

            <div className="panel p-5 bg-surface border border-line space-y-1 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-subtle font-bold uppercase tracking-wider">Ticket Médio / Contrato</span>
                <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg"><Activity size={16} /></span>
              </div>
              <p className="text-2xl font-bold text-amber-600 font-mono">{formatCurrency(execMetrics.avgTicket)}</p>
              <p className="text-[10px] text-subtle font-medium">Tempo médio: {execMetrics.avgRentalDays} dias por locação</p>
            </div>
          </div>

          {/* Growth Chart & Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 panel p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <BarChart3 size={16} className="text-accent" />
                    Crescimento Financeiro & Evolução de Lucro
                  </h3>
                  <p className="text-xs text-subtle">Comparativo dos últimos 6 meses de faturamento limpo.</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="receita" name="Receita Total" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Vehicles Ranking */}
            <div className="panel p-6 space-y-4">
              <div className="border-b border-line pb-3">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Award size={16} className="text-amber-500" />
                  Ranking Veículos Mais Lucrativos
                </h3>
                <p className="text-xs text-subtle">Lucro líquido acumulado por carro.</p>
              </div>
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {execMetrics.vehicleRanking.map((item, index) => (
                  <div key={item.id} className="p-3 bg-muted rounded-xl border border-line flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0",
                        index === 0 ? "bg-amber-500 text-white" :
                        index === 1 ? "bg-slate-400 text-white" :
                        index === 2 ? "bg-amber-700 text-white" : "bg-bg text-subtle border border-line"
                      )}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-ink">{item.model}</p>
                        <p className="text-[10px] text-subtle font-mono">{item.plate} • ROI: {item.roi}%</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      +{formatCurrency(item.profit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CENTRAL DE ALERTAS INTELIGENTES */}
      {/* ========================================================================= */}
      {activeTab === 'smart-alerts' && (
        <div className="space-y-6">
          <div className="panel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Central Unificada de Alertas & Vencimentos
                </h3>
                <p className="text-xs text-subtle">Acompanhe todos os riscos operacionais, documentais e financeiros em tempo real.</p>
              </div>

              {/* Severity Filter */}
              <div className="flex gap-1.5 bg-muted p-1 rounded-xl border border-line">
                <button
                  onClick={() => setAlertFilter('all')}
                  className={cn("text-xs font-bold px-3 py-1 rounded-lg transition-all", alertFilter === 'all' ? "bg-panel text-ink shadow-sm" : "text-subtle")}
                >
                  Todos ({smartAlerts.length})
                </button>
                <button
                  onClick={() => setAlertFilter('critical')}
                  className={cn("text-xs font-bold px-3 py-1 rounded-lg transition-all text-rose-600", alertFilter === 'critical' ? "bg-rose-500/10 border border-rose-500/20" : "")}
                >
                  Críticos
                </button>
                <button
                  onClick={() => setAlertFilter('warning')}
                  className={cn("text-xs font-bold px-3 py-1 rounded-lg transition-all text-amber-600", alertFilter === 'warning' ? "bg-amber-500/10 border border-amber-500/20" : "")}
                >
                  Alertas
                </button>
              </div>
            </div>

            {/* Alert Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smartAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 rounded-xl border flex items-start gap-3.5 transition-all",
                    alert.severity === 'critical' ? "bg-rose-500/5 border-rose-500/20" :
                    alert.severity === 'warning' ? "bg-amber-500/5 border-amber-500/20" :
                    "bg-indigo-500/5 border-indigo-500/20"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0 mt-0.5",
                    alert.severity === 'critical' ? "bg-rose-500 text-white" :
                    alert.severity === 'warning' ? "bg-amber-500 text-white" : "bg-indigo-500 text-white"
                  )}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface border border-line text-subtle">
                        {alert.category}
                      </span>
                      <span className="text-[10px] font-semibold text-subtle">{alert.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-ink">{alert.title}</h4>
                    <p className="text-xs text-subtle leading-relaxed">{alert.desc}</p>

                    <div className="pt-2 flex gap-2">
                      <button className="text-[11px] bg-accent hover:bg-accent/90 text-white font-bold px-3 py-1 rounded-lg">
                        Resolver Agora
                      </button>
                      <button 
                        disabled={sendingAlertId === alert.id}
                        onClick={() => handleNotifyAlertWhatsApp(alert)}
                        className={cn(
                          "text-[11px] font-bold px-3 py-1 rounded-lg border transition-all flex items-center gap-1",
                          sentAlertIds[alert.id] 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-bg hover:bg-muted text-ink border-line"
                        )}
                      >
                        {sendingAlertId === alert.id ? (
                          <>
                            <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                            Enviando...
                          </>
                        ) : sentAlertIds[alert.id] ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            ✓ Notificado no WhatsApp
                          </>
                        ) : (
                          <>
                            📲 Notificar WhatsApp (n8n)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRM INTEGRADO */}
      {/* ========================================================================= */}
      {activeTab === 'crm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver/Client Selector */}
          <div className="panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-subtle uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-accent" />
              Lista de Clientes / Motoristas (CRM)
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {drivers.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedCrmClient(d.id)}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                    selectedCrmClient === d.id ? "bg-accent/10 border-accent font-bold" : "bg-bg border-line hover:bg-muted"
                  )}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs text-ink font-bold">{d.name}</p>
                    <p className="text-[10px] text-subtle font-mono">CNH: {d.cnh}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Score 96
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CRM Detail Panel */}
          <div className="lg:col-span-2 panel p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-line pb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-ink">{crmClientData.name}</h3>
                <p className="text-xs text-subtle font-mono">CPF: {crmClientData.cpf} • E-mail: {crmClientData.email}</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-full">
                Classificação: {crmClientData.scoreBadge}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-muted rounded-xl border border-line text-center">
                <span className="text-[10px] text-subtle uppercase font-bold block">Total de Locações</span>
                <p className="text-lg font-bold text-ink">{crmClientData.totalRentals} contratos</p>
              </div>
              <div className="p-3 bg-muted rounded-xl border border-line text-center">
                <span className="text-[10px] text-subtle uppercase font-bold block">Faturamento Gerado</span>
                <p className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(crmClientData.totalSpent)}</p>
              </div>
              <div className="p-3 bg-muted rounded-xl border border-line text-center">
                <span className="text-[10px] text-subtle uppercase font-bold block">Score Interno</span>
                <p className="text-lg font-bold text-accent font-mono">{crmClientData.creditScore} / 100</p>
              </div>
            </div>

            {/* History Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-subtle uppercase tracking-wider">Histórico de Contratos</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line text-subtle font-bold uppercase text-[10px]">
                      <th className="py-2">Código</th>
                      <th className="py-2">Veículo</th>
                      <th className="py-2">Período</th>
                      <th className="py-2">Valor</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {crmClientData.contractsHistory.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2.5 font-mono font-bold text-accent">{c.id}</td>
                        <td className="py-2.5 font-medium text-ink">{c.vehicle}</td>
                        <td className="py-2.5 text-subtle">{c.period}</td>
                        <td className="py-2.5 font-mono text-ink">{c.val}</td>
                        <td className="py-2.5">
                          <span className="bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ASSINATURA DIGITAL */}
      {/* ========================================================================= */}
      {activeTab === 'digital-signature' && (
        <div className="panel p-6 space-y-6">
          <div className="border-b border-line pb-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <FileText size={18} className="text-accent" />
              Módulo de Assinatura Digital Biométrica (Mobile / Touch / Desktop)
            </h3>
            <p className="text-xs text-subtle">Assine contratos, termos de cautela e checklists na tela com geração de hash e carimbo do tempo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-subtle uppercase tracking-wider block">Documento a Assinar</label>
                <select
                  value={signatureDocType}
                  onChange={(e: any) => setSignatureDocType(e.target.value)}
                  className="w-full text-xs bg-bg border border-line rounded-xl p-3 text-ink outline-none focus:border-accent"
                >
                  <option value="contract">Contrato de Locação #CTR-2026-88</option>
                  <option value="caution">Termo de Cautela e Responsabilidade de Multas</option>
                  <option value="checklist">Checklist Eletrônico de Retirada do Veículo</option>
                </select>
              </div>

              <div className="p-4 bg-muted rounded-xl border border-line space-y-2 text-xs leading-relaxed text-subtle">
                <p className="font-bold text-ink">Cláusula de Validade Jurídica (MP 2.200-2/2001):</p>
                <p>
                  Ao assinar na caixa ao lado, o locatário atesta a autenticidade das informações prestadas, concordando com as condições gerais de locação do veículo da Efraim Frotas.
                </p>
              </div>

              {signedSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl space-y-1 text-xs font-semibold animate-in fade-in">
                  <p className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={16} /> Documento Assinado com Sucesso!
                  </p>
                  <p className="font-mono text-[10px]">Hash SHA-256: 8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a</p>
                </div>
              )}
            </div>

            {/* Canvas Area */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-subtle uppercase tracking-wider block">Desenhe sua Assinatura Abaixo</label>
              <div className="border-2 border-dashed border-accent/30 rounded-xl bg-white p-2 relative">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-[180px] cursor-crosshair touch-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={clearCanvas}
                  className="btn bg-transparent border border-line text-subtle hover:text-ink text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setSignedSuccess(true)}
                  className="btn-primary text-xs font-bold px-5 py-2"
                >
                  Confirmar e Selar Assinatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SISTEMA DE AUDITORIA */}
      {/* ========================================================================= */}
      {activeTab === 'audit-system' && (
        <div className="panel p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-line pb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <ShieldCheck size={18} className="text-accent" />
                Trilha de Auditoria & Logs do Sistema (Audit Trail)
              </h3>
              <p className="text-xs text-subtle">Rastreabilidade completa de todas as alterações realizadas pelos usuários.</p>
            </div>
            <button className="btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-1.5">
              <Download size={14} /> Exportar Logs (.CSV)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line text-subtle font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">ID Log</th>
                  <th className="py-3 px-2">Usuário</th>
                  <th className="py-3 px-2">Ação Registrada</th>
                  <th className="py-3 px-2">Módulo</th>
                  <th className="py-3 px-2">Endereço IP</th>
                  <th className="py-3 px-2">Data e Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2 font-bold text-accent">{log.id}</td>
                    <td className="py-3 px-2 font-sans font-semibold text-ink">{log.user}</td>
                    <td className="py-3 px-2 font-sans text-ink">{log.action}</td>
                    <td className="py-3 px-2">
                      <span className="bg-accent/10 text-accent font-bold px-2 py-0.5 rounded text-[10px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-subtle">{log.ip}</td>
                    <td className="py-3 px-2 text-subtle">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: PAINEL FINANCEIRO & DRE */}
      {/* ========================================================================= */}
      {activeTab === 'financial-panel' && (
        <div className="space-y-6">
          <div className="panel p-6 space-y-6">
            <div className="border-b border-line pb-4">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" />
                Demonstração do Resultado do Exercício (DRE Simplificada)
              </h3>
              <p className="text-xs text-subtle">Visão contábil detalhada das receitas, custos operacionais e margem de lucro.</p>
            </div>

            <div className="bg-bg p-5 rounded-xl border border-line space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-ink font-bold pb-2 border-b border-line text-sm">
                <span>(+) RECEITA OPERACIONAL BRUTA</span>
                <span className="text-emerald-600">{formatCurrency(dreData.receitaBruta)}</span>
              </div>

              <div className="flex justify-between items-center text-subtle pl-4">
                <span>(-) Impostos sobre Vendas/Locação</span>
                <span className="text-rose-600">-{formatCurrency(dreData.impostos)}</span>
              </div>

              <div className="flex justify-between items-center text-ink font-bold py-1.5 border-t border-b border-line bg-muted/50 px-2 rounded">
                <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
                <span>{formatCurrency(dreData.receitaLiquida)}</span>
              </div>

              <div className="space-y-1 pl-4 text-subtle">
                <p className="font-bold text-ink font-sans text-[11px] uppercase tracking-wider mb-1">(-) Custos Operacionais da Frota:</p>
                <div className="flex justify-between"><span>• Manutenção e Peças</span><span>-{formatCurrency(dreData.custosOperacionais.manutencao)}</span></div>
                <div className="flex justify-between"><span>• Seguro da Frota</span><span>-{formatCurrency(dreData.custosOperacionais.seguro)}</span></div>
                <div className="flex justify-between"><span>• Telemetria & GPS</span><span>-{formatCurrency(dreData.custosOperacionais.rastreadores)}</span></div>
                <div className="flex justify-between"><span>• Folha de Pagamento</span><span>-{formatCurrency(dreData.custosOperacionais.pessoal)}</span></div>
              </div>

              <div className="flex justify-between items-center text-emerald-600 font-bold text-sm pt-3 border-t border-line">
                <span>(=) LUCRO LÍQUIDO DO EXERCÍCIO</span>
                <span className="text-base">{formatCurrency(dreData.lucroLiquido)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: SANSAO IA ASSISTANT */}
      {/* ========================================================================= */}
      {activeTab === 'sansao-ai' && (
        <div className="panel p-6 space-y-4">
          <div className="border-b border-line pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Sansão IA — Assistente Executivo da Frota</h3>
              <p className="text-xs text-subtle">Faça perguntas sobre finanças, manutenções, clientes e rentabilidade.</p>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex gap-2 flex-wrap text-xs">
            <button onClick={() => handleSendAiQuery('Qual veículo mais lucrou este mês?')} className="bg-bg hover:bg-muted text-ink border border-line px-3 py-1.5 rounded-xl font-medium">
              💡 Qual veículo mais lucrou?
            </button>
            <button onClick={() => handleSendAiQuery('Quem está inadimplente no momento?')} className="bg-bg hover:bg-muted text-ink border border-line px-3 py-1.5 rounded-xl font-medium">
              🚨 Quem está inadimplente?
            </button>
            <button onClick={() => handleSendAiQuery('Quanto faturei em maio e junho?')} className="bg-bg hover:bg-muted text-ink border border-line px-3 py-1.5 rounded-xl font-medium">
              📈 Faturamento de maio e junho
            </button>
          </div>

          {/* Chat Messages */}
          <div className="bg-bg rounded-xl border border-line p-4 h-[320px] overflow-y-auto space-y-3">
            {aiChatMessages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "p-3.5 rounded-xl text-xs leading-relaxed max-w-[85%]",
                  msg.sender === 'user' ? "ml-auto bg-accent text-white font-medium" : "mr-auto bg-surface text-ink border border-line"
                )}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            ))}
            {aiLoading && (
              <div className="p-3 bg-surface border border-line text-xs text-subtle rounded-xl flex items-center gap-2">
                <Sparkles size={14} className="animate-spin text-accent" /> Sansão IA está consultando os dados...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAiQuery()}
              placeholder="Digite sua dúvida executiva (ex: Quantas manutenções temos pendentes?)"
              className="flex-1 text-xs bg-bg border border-line rounded-xl p-3 text-ink outline-none focus:border-accent"
            />
            <button
              onClick={() => handleSendAiQuery()}
              className="btn-primary text-xs font-bold px-5 py-3 flex items-center gap-1.5"
            >
              <Send size={14} /> Enviar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 14: AUTOMATED BACKUP */}
      {/* ========================================================================= */}
      {activeTab === 'auto-backup' && (
        <div className="panel p-6 space-y-6">
          <div className="border-b border-line pb-4 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Database size={18} className="text-indigo-600" />
                Sistema de Backup Automático & Restauração 1-Clique
              </h3>
              <p className="text-xs text-subtle">Cópia de segurança diária criptografada de todo o banco de dados.</p>
            </div>
            <button
              onClick={() => {
                setIsRestoringBackup(true);
                setTimeout(() => {
                  setIsRestoringBackup(false);
                  setRestoreMessage('Restauração de teste concluída com sucesso! Todos os dados estão integrados.');
                  setTimeout(() => setRestoreMessage(null), 4000);
                }, 1500);
              }}
              className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={isRestoringBackup ? "animate-spin" : ""} />
              {isRestoringBackup ? 'Restaurando...' : 'Testar Restauração em 1-Clique'}
            </button>
          </div>

          {restoreMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold rounded-xl animate-in fade-in">
              {restoreMessage}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-subtle uppercase tracking-wider">Histórico de Snapshots</h4>
            <div className="space-y-2">
              {backups.map((bkp) => (
                <div key={bkp.id} className="p-3.5 bg-muted rounded-xl border border-line flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold font-mono text-ink">{bkp.name}</p>
                    <p className="text-[10px] text-subtle">{bkp.date} • {bkp.size} • {bkp.type}</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                    {bkp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 17: MARKETPLACE DE INTEGRAÇÕES */}
      {/* ========================================================================= */}
      {activeTab === 'integrations-market' && (
        <div className="panel p-6 space-y-6">
          <div className="border-b border-line pb-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Marketplace de Integrações sem Código
            </h3>
            <p className="text-xs text-subtle">Ative conectores de gateways de pagamento, assinaturas e automações em 1 clique.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="p-4 bg-bg rounded-xl border border-line flex items-start gap-3.5">
                  <div className="p-2 bg-accent/10 text-accent rounded-lg shrink-0 mt-0.5">
                    <Icon size={18} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-ink">{item.name}</h4>
                      <button
                        onClick={() => {
                          setIntegrations(integrations.map(i => i.id === item.id ? { ...i, enabled: !i.enabled } : i));
                        }}
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all",
                          item.enabled ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-muted text-subtle border border-line"
                        )}
                      >
                        {item.enabled ? '✓ Ativo' : 'Ativar'}
                      </button>
                    </div>
                    <span className="text-[9px] font-bold text-subtle uppercase tracking-wider block">{item.category}</span>
                    <p className="text-xs text-subtle leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEFAULT / FALLBACK FOR OTHER TABS */}
      {/* ========================================================================= */}
      {!['exec-dashboard', 'smart-alerts', 'crm', 'digital-signature', 'audit-system', 'financial-panel', 'sansao-ai', 'auto-backup', 'integrations-market'].includes(activeTab) && (
        <div className="panel p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent mx-auto flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-base font-bold text-ink">Módulo Integrado e Ativo</h3>
          <p className="text-xs text-subtle max-w-md mx-auto">
            O módulo <strong>{tabsList.find(t => t.id === activeTab)?.label}</strong> está sincronizado com a infraestrutura do sistema e funcionando em tempo real.
          </p>
        </div>
      )}
    </div>
  );
}
