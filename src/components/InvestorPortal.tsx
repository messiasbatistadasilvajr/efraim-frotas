import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Car, 
  DollarSign, 
  FileText, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  User, 
  CreditCard, 
  Calendar, 
  PieChart, 
  ExternalLink,
  ChevronRight,
  Eye,
  Printer,
  Sparkles
} from 'lucide-react';
import { InvestorAccount } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function InvestorPortal() {
  const [investor, setInvestor] = useState<InvestorAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatement, setSelectedStatement] = useState<InvestorAccount['statements'][0] | null>(null);

  const mockInvestor: InvestorAccount = {
    id: 'inv-01',
    name: 'Messias Bernardes (Investidor)',
    email: 'messiasbjunior76@gmail.com',
    phone: '(11) 98765-4321',
    cpfCnpj: '123.456.789-00',
    vehiclesCount: 4,
    totalInvested: 320000,
    managementFeePercent: 12, // 12% taxa de gestão da frota
    bankInfo: {
      bank: 'Banco Itaú Unibanco',
      agency: '0412',
      account: '98123-4',
      pixKey: 'messiasbjunior76@gmail.com'
    },
    statements: [
      {
        id: 'rep-2026-07',
        month: '2026-07',
        grossRevenue: 11200, // 4 veículos * 2.800/mês
        maintenanceExpenses: 780,
        managementFee: 1344, // 12% do bruto
        netPayout: 9076,
        status: 'paid',
        paidAt: '2026-07-28 10:15:00'
      },
      {
        id: 'rep-2026-06',
        month: '2026-06',
        grossRevenue: 10960,
        maintenanceExpenses: 450,
        managementFee: 1315.20,
        netPayout: 9194.80,
        status: 'paid',
        paidAt: '2026-06-28 09:30:00'
      },
      {
        id: 'rep-2026-05',
        month: '2026-05',
        grossRevenue: 11200,
        maintenanceExpenses: 1200, // incluindo troca de pneus
        managementFee: 1344,
        netPayout: 8656,
        status: 'paid',
        paidAt: '2026-05-28 14:00:00'
      }
    ],
    ownerId: 'demo-manager'
  };

  const investorVehicles = [
    { plate: 'EFR-9A12', model: 'Chevrolet Onix Plus 2024', driver: 'Thiago Martins', status: 'Rented', weeklyRate: 690, netYield: 2428.80 },
    { plate: 'ABC-1234', model: 'Hyundai HB20 1.0 2023', driver: 'João Silva', status: 'Maintenance', weeklyRate: 590, netYield: 2076.00 },
    { plate: 'XYZ-5678', model: 'Fiat Cronos 1.3 2024', driver: 'Carlos Eduardo', status: 'Rented', weeklyRate: 690, netYield: 2428.80 },
    { plate: 'KLR-9090', model: 'Nissan Versa 1.6 2025', driver: 'Mariana Lima', status: 'Rented', weeklyRate: 750, netYield: 2640.00 }
  ];

  useEffect(() => {
    // Simulating fetching or using mock investor
    setInvestor(mockInvestor);
    setLoading(false);
  }, []);

  if (loading || !investor) {
    return <div className="p-12 text-center text-subtle text-xs">Carregando portal do investidor...</div>;
  }

  const latestStatement = investor.statements[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-line shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="text-accent" size={24} />
            <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Portal Transparente do Investidor & Proprietário</h1>
          </div>
          <p className="text-xs text-subtle">
            Extratos mensais automatizados de repasse de rendimentos, auditoria de despesas de manutenção e performance em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-600 text-xs font-bold flex items-center gap-2">
            <ShieldCheck size={16} />
            Repasse PIX Automatizado Ativo
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 space-y-2 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Último Repasse Líquido ({latestStatement.month})</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-emerald-600">
              {formatCurrency(latestStatement.netPayout)}
            </span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Pago via PIX no dia 28/07</span>
        </div>

        <div className="panel p-5 space-y-2 border-l-4 border-l-accent">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Faturamento Bruto Gerado</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-ink">
              {formatCurrency(latestStatement.grossRevenue)}
            </span>
            <DollarSign size={18} className="text-accent" />
          </div>
          <span className="text-[11px] text-subtle">Referente aos 4 veículos da sua frota</span>
        </div>

        <div className="panel p-5 space-y-2 border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Veículos Investidos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-blue-600">
              {investor.vehiclesCount} Veículos
            </span>
            <Car size={18} className="text-blue-500" />
          </div>
          <span className="text-[11px] text-subtle">Taxa de Ocupação: 100%</span>
        </div>

        <div className="panel p-5 space-y-2 border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Taxa de Gestão Efraim</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-purple-600">
              {investor.managementFeePercent}%
            </span>
            <PieChart size={18} className="text-purple-500" />
          </div>
          <span className="text-[11px] text-subtle">Inclui seguro, cobrança e suporte 24h</span>
        </div>
      </div>

      {/* Main Grid: Vehicles Performance + Monthly Statements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vehicles Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Car className="text-accent" size={18} />
              Veículos sob Sua Propriedade na Frota
            </h3>
            <span className="text-xs text-subtle font-medium">Monitoramento ao vivo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {investorVehicles.map((v, i) => (
              <div key={i} className="panel p-5 space-y-4 hover:border-accent/40 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-xs bg-bg px-2.5 py-1 rounded border border-line text-ink">
                      {v.plate}
                    </span>
                    <h4 className="font-bold text-sm text-ink mt-2">{v.model}</h4>
                  </div>
                  {v.status === 'Rented' ? (
                    <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Em Aluguel
                    </span>
                  ) : (
                    <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Revisão Preventiva
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-subtle pt-2 border-t border-line">
                  <User size={14} />
                  <span>Motorista: <strong className="text-ink">{v.driver}</strong></span>
                </div>

                <div className="flex justify-between items-center text-xs bg-bg p-3 rounded-xl border border-line">
                  <span className="text-subtle">Rendimento Mensal Líquido Est.</span>
                  <span className="font-bold text-emerald-600 font-mono">{formatCurrency(v.netYield)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank & Payment Info Box */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
            <CreditCard className="text-accent" size={18} />
            Dados Bancários do Repasse
          </h3>

          <div className="panel p-6 space-y-4 bg-gradient-to-br from-surface to-bg border border-line">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="p-3 bg-accent/10 rounded-xl text-accent">
                <Building2 size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-subtle uppercase">Titular Cadastrado</span>
                <p className="font-bold text-sm text-ink">{investor.name}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-line/50">
                <span className="text-subtle">Banco:</span>
                <span className="font-bold text-ink">{investor.bankInfo.bank}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/50">
                <span className="text-subtle">Agência / Conta:</span>
                <span className="font-bold font-mono text-ink">{investor.bankInfo.agency} / {investor.bankInfo.account}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/50">
                <span className="text-subtle">Chave PIX:</span>
                <span className="font-bold font-mono text-accent">{investor.bankInfo.pixKey}</span>
              </div>
            </div>

            <p className="text-[11px] text-subtle leading-relaxed bg-accent/5 p-3 rounded-xl border border-accent/10">
              💡 Os repasses são efetuados automaticamente todo dia 28 do mês corrente após a apuração das despesas comprovadas.
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Financial Statements Table */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
          <FileText className="text-accent" size={18} />
          Histórico de Extratos Mensais de Repasse (DRE do Proprietário)
        </h3>

        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-subtle font-bold uppercase text-[10px] tracking-wider border-b border-line">
                <tr>
                  <th className="px-5 py-3.5">Mês de Referência</th>
                  <th className="px-5 py-3.5">Faturamento Bruto</th>
                  <th className="px-5 py-3.5">Despesas Manutenção</th>
                  <th className="px-5 py-3.5">Taxa de Gestão (12%)</th>
                  <th className="px-5 py-3.5">Valor Líquido Repassado</th>
                  <th className="px-5 py-3.5">Status Payout</th>
                  <th className="px-5 py-3.5 text-right">Extrato PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {investor.statements.map((st) => (
                  <tr key={st.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-ink">
                      {st.month}
                    </td>

                    <td className="px-5 py-4 font-medium text-ink">
                      {formatCurrency(st.grossRevenue)}
                    </td>

                    <td className="px-5 py-4 text-rose-600 font-medium">
                      - {formatCurrency(st.maintenanceExpenses)}
                    </td>

                    <td className="px-5 py-4 text-purple-600 font-medium">
                      - {formatCurrency(st.managementFee)}
                    </td>

                    <td className="px-5 py-4 font-bold text-emerald-600 text-sm font-mono">
                      {formatCurrency(st.netPayout)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                        <CheckCircle2 size={12} /> Pago via PIX
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedStatement(st)}
                        className="btn-secondary text-xs font-bold px-3 py-1.5 inline-flex items-center gap-1.5"
                      >
                        <Eye size={14} /> Extrato DRE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DRE STATEMENT VIEW MODAL */}
      {selectedStatement && (
        <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl rounded-2xl border border-line overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-line flex items-center justify-between bg-bg">
              <span className="font-bold text-sm text-ink font-mono">Extrato DRE de Repasse - Mês {selectedStatement.month}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-secondary text-xs font-bold px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button 
                  onClick={() => setSelectedStatement(null)}
                  className="p-1.5 hover:bg-surface rounded-lg text-subtle hover:text-ink"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 bg-white text-slate-900 font-sans print:p-0">
              <div className="border-b pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">EFRAIM FROTAS - EXTRATO DE REPASSE</h2>
                  <p className="text-xs text-slate-500">Demonstrativo de Resultado do Proprietário (DRE)</p>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded border border-emerald-300">
                  REPASSE QUITADO
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700">(+) Receita Bruta de Aluguel da Frota:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedStatement.grossRevenue)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200 text-rose-700">
                  <span>(-) Manutenções & Revisões Comprovadas:</span>
                  <span className="font-bold">- {formatCurrency(selectedStatement.maintenanceExpenses)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200 text-purple-700">
                  <span>(-) Taxa de Administração Efraim (12%):</span>
                  <span className="font-bold">- {formatCurrency(selectedStatement.managementFee)}</span>
                </div>

                <div className="flex justify-between py-3 border-t-2 border-slate-900 text-sm font-extrabold bg-emerald-50 p-3 rounded-lg text-emerald-900">
                  <span>(=) VALOR LÍQUIDO CREDITADO EM CONTA:</span>
                  <span className="font-mono text-base">{formatCurrency(selectedStatement.netPayout)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 pt-4 border-t border-slate-200">
                <p>• Data da Transferência PIX: <strong>{selectedStatement.paidAt}</strong></p>
                <p>• Autenticação Bancária: <strong>PIX-EFR-2026-99081273612</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
