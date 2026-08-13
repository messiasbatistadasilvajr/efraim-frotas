import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Terminal, 
  Check, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Database, 
  Workflow, 
  FileCode, 
  Sliders, 
  Cpu as Microchip,
  BookOpen,
  Globe,
  Building2,
  CreditCard,
  Plus,
  Eye,
  Key,
  Laptop,
  Sparkles,
  CheckSquare,
  Zap,
  Play,
  DollarSign,
  TrendingUp,
  Car
} from 'lucide-react';
import { runEnterpriseUnitTests, AutomatedTestSuiteSummary, TestCaseResult } from '../enterprise/core/tests/automated-tests';
import { cn } from '../lib/utils';
import { Enterprise360Suite } from './Enterprise360Suite';

export function EnterpriseDashboard() {
  const [testSummary, setTestSummary] = useState<AutomatedTestSuiteSummary | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'suite360' | 'saas' | 'architecture' | 'tests' | 'blueprints'>('suite360');
  const [selectedBlueprint, setSelectedBlueprint] = useState<'prisma' | 'docker' | 'nestjs' | 'github'>('prisma');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SaaS Multi-Tenant State
  const [tenants, setTenants] = useState([
    { id: 'efraim-ce', name: 'Efraim Locadora CE', document: '48.204.103/0001-90', plan: 'gold', contact: 'messias@efraim.com', status: 'Ativo', mrr: 8500, color: '#4f46e5', vehiclesCount: 48, modules: { tracking: true, fines: true, checklists: true, finances: true } },
    { id: 'sulfrotas', name: 'SulFrotas Porto Alegre', document: '12.450.880/0001-12', plan: 'silver', contact: 'contato@sulfrotas.com.br', status: 'Ativo', mrr: 3850, color: '#10b981', vehiclesCount: 12, modules: { tracking: true, fines: false, checklists: true, finances: true } },
    { id: 'veloloc', name: 'VeloLoc Campinas', document: '33.910.154/0001-44', plan: 'bronze', contact: 'financeiro@veloloc.com', status: 'Ativo', mrr: 2500, color: '#f59e0b', vehiclesCount: 6, modules: { tracking: false, fines: false, checklists: true, finances: false } },
    { id: 'loc-nordeste', name: 'Locadora Sol Nordeste', document: '88.102.304/0002-88', plan: 'bronze', contact: 'sol@locnordeste.com', status: 'Suspenso', mrr: 0, color: '#ef4444', vehiclesCount: 0, modules: { tracking: false, fines: false, checklists: false, finances: false } }
  ]);

  const [selectedWhitelabelTenant, setSelectedWhitelabelTenant] = useState('efraim-ce');
  const [showNewTenantForm, setShowNewTenantForm] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantDoc, setNewTenantDoc] = useState('');
  const [newTenantContact, setNewTenantContact] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState<'bronze' | 'silver' | 'gold'>('silver');
  const [newTenantColor, setNewTenantColor] = useState('#4f46e5');
  const [simulatedInvoice, setSimulatedInvoice] = useState<any | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setTestSummary(null);
    // Simulate compilation delay for high fidelity feedback
    await new Promise(resolve => setTimeout(resolve, 1200));
    try {
      const summary = await runEnterpriseUnitTests();
      setTestSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Code snippets for copy-paste on the blueprints tab
  const blueprints = {
    prisma: `// filepath: /prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Tenant {
  id        String   @id @default(uuid())
  name      String
  document  String   @unique
  drivers   Driver[]
  vehicles  Vehicle[]
  createdAt DateTime @default(now())
}

model Driver {
  id             String    @id @default(uuid())
  tenantId       String
  tenant         Tenant    @relation(fields: [tenantId], references: [id])
  name           String
  cpf            String    @unique
  cnh            String    @unique
  cnhExpiry      DateTime
  status         String    @default("active")
  depositBalance Decimal   @default(0.00) @db.Decimal(10, 2)
}`,
    docker: `# filepath: /Dockerfile
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build && npm prune --production

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]`,
    nestjs: `// filepath: /src/enterprise/nestjs-templates/driver.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { DriverEntity } from '../core/domain/entities/driver.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDriver(tenantId: string, dto: any) {
    // Valida Regras de Negócio e Invariantes na Entidade do Domínio
    const domainEntity = new DriverEntity(
      undefined, // ID autogerado
      tenantId,
      dto.name,
      dto.cnh,
      dto.cnhExpiry,
      dto.cpf,
      dto.contact,
      dto.email,
      'active',
      0
    );

    // Consulta duplicidade concorrente
    const exists = await this.prisma.driver.findFirst({
      where: { OR: [{ cpf: domainEntity.cpf }, { cnh: domainEntity.cnh }] }
    });
    if (exists) throw new BadRequestException('Condutor já registrado.');

    return this.prisma.driver.create({
      data: {
        id: domainEntity.id,
        tenantId: domainEntity.tenantId,
        name: domainEntity.name,
        cnh: domainEntity.cnh,
        cnhExpiry: new Date(domainEntity.cnhExpiry),
        cpf: domainEntity.cpf,
        status: domainEntity.status
      }
    });
  }
}`,
    github: `# filepath: /.github/workflows/ci-cd.yml
name: Efraim Fleet Enterprise CI/CD Pipeline
on: [push, pull_request]

jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test-and-lint
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker Container
        run: docker build -t gcr.io/efraim-frotas/backend-api:latest .`
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-1">
        <div>
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] bg-accent/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <ShieldCheck size={11} className="text-accent" />
            Clean Architecture & SOLID Center
          </span>
          <h2 className="font-display text-[28px] font-bold tracking-tight mt-3 mb-1">Painel Enterprise Efraim</h2>
          <p className="text-subtle text-[14px]">Arquitetura corporativa desacoplada, multi-tenant e robusta pronta para produção.</p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex bg-muted p-1 rounded-xl border border-line flex-wrap gap-1">
          <button 
            onClick={() => setActiveSubTab('suite360')}
            className={cn(
              "text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeSubTab === 'suite360' ? "bg-accent text-white shadow-sm" : "text-subtle hover:text-ink"
            )}
          >
            <Sparkles size={13} className={activeSubTab === 'suite360' ? "text-white" : "text-accent animate-pulse"} />
            Suite Enterprise 360 (20 Módulos)
          </button>
          <button 
            onClick={() => setActiveSubTab('saas')}
            className={cn(
              "text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeSubTab === 'saas' ? "bg-panel text-ink shadow-sm" : "text-subtle hover:text-ink"
            )}
          >
            <Globe size={13} />
            Consolidação SaaS
          </button>
          <button 
            onClick={() => setActiveSubTab('architecture')}
            className={cn(
              "text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeSubTab === 'architecture' ? "bg-panel text-ink shadow-sm" : "text-subtle hover:text-ink"
            )}
          >
            <Layers size={13} />
            Arquitetura
          </button>
          <button 
            onClick={() => setActiveSubTab('tests')}
            className={cn(
              "text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeSubTab === 'tests' ? "bg-panel text-ink shadow-sm" : "text-subtle hover:text-ink"
            )}
          >
            <Terminal size={13} />
            Testes Ativos
          </button>
          <button 
            onClick={() => setActiveSubTab('blueprints')}
            className={cn(
              "text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeSubTab === 'blueprints' ? "bg-panel text-ink shadow-sm" : "text-subtle hover:text-ink"
            )}
          >
            <BookOpen size={13} />
            Gabaritos (Blueprints)
          </button>
        </div>
      </header>

      {/* RENDER TAB 0: ENTERPRISE 360 SUITE (20 MODULES) */}
      {activeSubTab === 'suite360' && (
        <Enterprise360Suite />
      )}

      {/* RENDER TAB 0: SAAS MULTI-TENANT CONSOLE */}
      {activeSubTab === 'saas' && (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
          {/* SaaS Global Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="panel p-5 space-y-1 bg-surface border border-line relative overflow-hidden">
              <div className="absolute top-2 right-2 p-1.5 bg-accent/10 text-accent rounded-lg">
                <DollarSign size={16} />
              </div>
              <span className="text-[10px] text-subtle font-bold uppercase tracking-wider">MRR Global da Plataforma</span>
              <p className="text-2xl font-bold text-ink">
                R$ {tenants.reduce((acc, t) => acc + t.mrr, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-success font-semibold flex items-center gap-1">
                <TrendingUp size={11} /> +12.4% este mês
              </p>
            </div>

            <div className="panel p-5 space-y-1 bg-surface border border-line relative overflow-hidden">
              <div className="absolute top-2 right-2 p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <Building2 size={16} />
              </div>
              <span className="text-[10px] text-subtle font-bold uppercase tracking-wider">Clientes Ativos (Tenants)</span>
              <p className="text-2xl font-bold text-indigo-600">
                {tenants.filter(t => t.status === 'Ativo').length} <span className="text-xs font-normal text-subtle">/ {tenants.length} cadastrados</span>
              </p>
              <p className="text-[10px] text-subtle font-medium">Isolamento Multi-Tenant Garantido</p>
            </div>

            <div className="panel p-5 space-y-1 bg-surface border border-line relative overflow-hidden">
              <div className="absolute top-2 right-2 p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Car size={16} />
              </div>
              <span className="text-[10px] text-subtle font-bold uppercase tracking-wider">Total de Veículos Gerenciados</span>
              <p className="text-2xl font-bold text-emerald-600">
                {tenants.reduce((acc, t) => acc + t.vehiclesCount, 0)}
              </p>
              <p className="text-[10px] text-subtle font-medium">Média de {(tenants.reduce((acc, t) => acc + t.vehiclesCount, 0) / tenants.length).toFixed(1)} carros por empresa</p>
            </div>

            <div className="panel p-5 space-y-1 bg-surface border border-line relative overflow-hidden">
              <div className="absolute top-2 right-2 p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                <Zap size={16} />
              </div>
              <span className="text-[10px] text-subtle font-bold uppercase tracking-wider">Ticket Médio (ARPU)</span>
              <p className="text-2xl font-bold text-amber-600">
                R$ {(tenants.reduce((acc, t) => acc + t.mrr, 0) / tenants.filter(t => t.mrr > 0).length || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-success font-semibold">Churn Rate de 0%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Columns - SaaS clients, client addition & invoice generation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tenants list card */}
              <div className="panel p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-line pb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-md font-bold flex items-center gap-2 text-ink">
                      <Building2 size={18} className="text-accent" />
                      Inquilinos SaaS Registrados (Multi-Tenant Hub)
                    </h3>
                    <p className="text-xs text-subtle mt-0.5">Veja as empresas que assinam sua plataforma e gerencie suas credenciais.</p>
                  </div>

                  <button
                    onClick={() => setShowNewTenantForm(!showNewTenantForm)}
                    className="btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-1.5"
                  >
                    {showNewTenantForm ? 'Fechar Formulário' : (
                      <>
                        <Plus size={14} /> Cadastrar Cliente
                      </>
                    )}
                  </button>
                </div>

                {/* Inline Add Tenant Form */}
                {showNewTenantForm && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTenantName || !newTenantDoc || !newTenantContact) return;
                    const calculatedMrr = newTenantPlan === 'gold' ? 8500 : (newTenantPlan === 'silver' ? 3850 : 2500);
                    const newId = newTenantName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const newTenantObj = {
                      id: newId,
                      name: newTenantName,
                      document: newTenantDoc,
                      plan: newTenantPlan,
                      contact: newTenantContact,
                      status: 'Ativo',
                      mrr: calculatedMrr,
                      color: newTenantColor,
                      vehiclesCount: newTenantColor === '#4f46e5' ? 15 : 5,
                      modules: {
                        tracking: newTenantPlan !== 'bronze',
                        fines: newTenantPlan === 'gold',
                        checklists: true,
                        finances: newTenantPlan !== 'bronze'
                      }
                    };
                    setTenants([...tenants, newTenantObj]);
                    setSelectedWhitelabelTenant(newId);
                    setNewTenantName('');
                    setNewTenantDoc('');
                    setNewTenantContact('');
                    setShowNewTenantForm(false);
                  }} className="bg-muted p-5 rounded-xl border border-line space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <Plus size={14} className="text-accent" />
                      Novo Cliente SaaS (Locadora / Franqueado)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Nome da Empresa / Locadora</label>
                        <input
                          type="text"
                          required
                          value={newTenantName}
                          onChange={(e) => setNewTenantName(e.target.value)}
                          placeholder="Ex: Rio Car Aluguel"
                          className="w-full text-xs bg-bg border border-line rounded-lg p-2.5 text-ink outline-none focus:border-accent"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">CNPJ / CPF do Inquilino</label>
                        <input
                          type="text"
                          required
                          value={newTenantDoc}
                          onChange={(e) => setNewTenantDoc(e.target.value)}
                          placeholder="Ex: 00.000.000/0001-00"
                          className="w-full text-xs bg-bg border border-line rounded-lg p-2.5 text-ink outline-none focus:border-accent"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">E-mail Administrativo</label>
                        <input
                          type="email"
                          required
                          value={newTenantContact}
                          onChange={(e) => setNewTenantContact(e.target.value)}
                          placeholder="Ex: contato@empresa.com"
                          className="w-full text-xs bg-bg border border-line rounded-lg p-2.5 text-ink outline-none focus:border-accent"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Plano de Assinatura</label>
                        <select
                          value={newTenantPlan}
                          onChange={(e: any) => setNewTenantPlan(e.target.value)}
                          className="w-full text-xs bg-bg border border-line rounded-lg p-2.5 text-ink outline-none focus:border-accent"
                        >
                          <option value="bronze">Bronze (Econômico) - R$ 2.500/mês</option>
                          <option value="silver">Prata (Conforto) - R$ 3.850/mês</option>
                          <option value="gold">Ouro (Completo) - R$ 8.500/mês</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Cor Identidade do Cliente (Whitelabel)</label>
                        <div className="flex items-center gap-2 pt-1">
                          {['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#ef4444'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewTenantColor(c)}
                              className={cn(
                                "w-6 h-6 rounded-full border transition-transform",
                                newTenantColor === c ? "scale-125 border-ink" : "border-transparent"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-line">
                      <button
                        type="button"
                        onClick={() => setShowNewTenantForm(false)}
                        className="btn bg-transparent border border-line text-subtle hover:text-ink hover:bg-muted text-xs font-bold px-4 py-2 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-primary text-xs font-bold px-5 py-2"
                      >
                        Salvar e Criar Inquilino (SaaS)
                      </button>
                    </div>
                  </form>
                )}

                {/* Tenants Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line text-subtle font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2">Empresa SaaS</th>
                        <th className="py-3 px-2">Documento</th>
                        <th className="py-3 px-2">Plano</th>
                        <th className="py-3 px-2">Faturamento SaaS</th>
                        <th className="py-3 px-2 text-center">Carros</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {tenants.map((t) => (
                        <tr 
                          key={t.id} 
                          className={cn(
                            "hover:bg-muted/50 transition-colors cursor-pointer",
                            selectedWhitelabelTenant === t.id ? "bg-accent/5 font-semibold" : ""
                          )}
                          onClick={() => setSelectedWhitelabelTenant(t.id)}
                        >
                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                              <div className="flex flex-col">
                                <span className="text-ink text-xs font-bold">{t.name}</span>
                                <span className="text-[10px] text-subtle">{t.contact}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 font-mono text-[10px] text-subtle">{t.document}</td>
                          <td className="py-3.5 px-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                              t.plan === 'gold' ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                              t.plan === 'silver' ? "bg-slate-500/10 text-slate-600 border border-slate-500/20" :
                              "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                            )}>
                              {t.plan === 'gold' ? 'Ouro (Gold)' : t.plan === 'silver' ? 'Prata' : 'Bronze'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 font-mono text-ink">
                            {t.mrr > 0 ? `R$ ${t.mrr.toLocaleString('pt-BR')}/mês` : 'R$ 0,00'}
                          </td>
                          <td className="py-3.5 px-2 font-mono text-ink text-center">{t.vehiclesCount}</td>
                          <td className="py-3.5 px-2 text-center">
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                              t.status === 'Ativo' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            )}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSimulatedInvoice({
                                  tenantName: t.name,
                                  plan: t.plan,
                                  contact: t.contact,
                                  value: t.plan === 'gold' ? 8500 : (t.plan === 'silver' ? 3850 : 2500),
                                  document: t.document,
                                  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
                                });
                              }}
                              className="text-[11px] bg-accent/10 hover:bg-accent hover:text-white text-accent font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1 ml-auto"
                            >
                              <CreditCard size={11} />
                              Fatura
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Automated Billings & Stripe details simulator */}
              {simulatedInvoice && (
                <div className="panel p-6 bg-surface border border-line animate-in slide-in-from-bottom-4 duration-300 relative space-y-4">
                  <button 
                    onClick={() => setSimulatedInvoice(null)} 
                    className="absolute top-4 right-4 text-subtle hover:text-ink text-sm font-bold"
                  >
                    ✖
                  </button>
                  <h3 className="text-md font-bold flex items-center gap-1.5 text-indigo-600">
                    <CreditCard size={18} />
                    Fatura Recorrente Automatizada do Cliente SaaS
                  </h3>
                  <p className="text-xs text-subtle">
                    Para um SaaS de verdade, conectamos o sistema a gateways como <strong>Stripe</strong> ou <strong>Asaas</strong>. Aqui está a fatura simulada de assinatura:
                  </p>

                  <div className="p-5 bg-muted rounded-xl border border-line grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-xs text-subtle">
                      <p><strong>Destinatário:</strong> <span className="text-ink font-bold">{simulatedInvoice.tenantName}</span></p>
                      <p><strong>CNPJ/CPF:</strong> <span className="text-ink font-mono">{simulatedInvoice.document}</span></p>
                      <p><strong>E-mail:</strong> <span className="text-ink">{simulatedInvoice.contact}</span></p>
                    </div>
                    <div className="space-y-1.5 text-xs text-subtle md:text-right">
                      <p><strong>Vencimento:</strong> <span className="text-ink font-bold">{simulatedInvoice.dueDate}</span></p>
                      <p><strong>Valor Recorrência:</strong> <span className="text-success text-sm font-bold font-mono">R$ {simulatedInvoice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                      <p><strong>Status:</strong> <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Aguardando PIX</span></p>
                    </div>
                  </div>

                  {/* PIX simulation code */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Simular QR Code de Cobrança PIX Automático (Stripe/Asaas Flow)</label>
                    <div className="flex gap-4 items-center bg-bg p-4 rounded-xl border border-line flex-wrap md:flex-nowrap">
                      {/* Fake QR code representation */}
                      <div className="w-20 h-20 bg-white p-2 border border-line rounded flex items-center justify-center shrink-0">
                        <div className="w-16 h-16 bg-[linear-gradient(45deg,#000_25%,transparent_25%),linear-gradient(-45deg,#000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#000_75%),linear-gradient(-45deg,transparent_75%,#000_75%)] bg-[length:8px_8px] opacity-80" />
                      </div>

                      <div className="space-y-2 flex-1">
                        <p className="text-xs text-subtle leading-relaxed">
                          Sua API de produção NestJS/Node.js escuta o webhook de pagamento do Stripe/Asaas. Assim que o cliente paga o PIX, a API libera instantaneamente o acesso ou desbloqueia o inquilino.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`00020101021126580014br.gov.pix0136${simulatedInvoice.document.replace(/\D/g,'')}5204000053039865407${simulatedInvoice.value}.005802BR5913EfraimFrotas6009SaoPaulo62070503***6304`);
                              setCopiedInvoice(true);
                              setTimeout(() => setCopiedInvoice(false), 2000);
                            }}
                            className="bg-bg hover:bg-muted text-ink border border-line font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1.5"
                          >
                            {copiedInvoice ? '✓ Copiado!' : 'Copiar Linha Digitável PIX'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = tenants.map(t => {
                                if (t.name === simulatedInvoice.tenantName) {
                                  return { ...t, status: 'Ativo', mrr: t.plan === 'gold' ? 8500 : (t.plan === 'silver' ? 3850 : 2500) };
                                }
                                return t;
                              });
                              setTenants(updated);
                              setSimulatedInvoice(null);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5"
                          >
                            <Check size={13} /> Simular Webhook de Aprovação
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Brand Customization & Whitelabel Simulator */}
            <div className="space-y-6 text-left">
              <div className="panel p-6 space-y-4">
                <div className="border-b border-line pb-3">
                  <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
                    <Laptop size={14} />
                    Personalizador Whitelabel
                  </h4>
                  <p className="text-[11px] text-subtle mt-0.5">Veja como o software se adapta à marca de cada cliente de forma isolada.</p>
                </div>

                {/* Simulated variables */}
                {(() => {
                  const currentTenantObj = tenants.find(t => t.id === selectedWhitelabelTenant) || tenants[0];
                  return (
                    <div className="space-y-4">
                      {/* Interactive form variables */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Inquilino sob Customização</label>
                          <p className="text-xs font-bold text-ink bg-muted p-2 rounded-lg border border-line font-mono">{currentTenantObj.name}</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Nome Whitelabel do Sistema</label>
                          <input
                            type="text"
                            value={currentTenantObj.name}
                            onChange={(e) => {
                              const updated = tenants.map(t => t.id === selectedWhitelabelTenant ? { ...t, name: e.target.value } : t);
                              setTenants(updated);
                            }}
                            className="w-full text-xs bg-bg border border-line rounded-lg p-2 text-ink outline-none focus:border-accent"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Modificar Cor Primária da Marca</label>
                          <div className="flex gap-2 items-center pt-1">
                            {['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#ef4444'].map((c) => (
                              <button
                                key={c}
                                onClick={() => {
                                  const updated = tenants.map(t => t.id === selectedWhitelabelTenant ? { ...t, color: c } : t);
                                  setTenants(updated);
                                }}
                                className={cn(
                                  "w-6 h-6 rounded-full border transition-transform",
                                  currentTenantObj.color === c ? "scale-125 border-ink" : "border-transparent"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-1">
                          <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Modulos Ativos Conforme o Plano</label>
                          <div className="space-y-1.5 bg-muted p-3 rounded-lg border border-line">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-subtle font-medium">Multas</span>
                              <span className={cn("font-bold text-[10px] uppercase", currentTenantObj.modules.fines ? "text-success" : "text-subtle")}>
                                {currentTenantObj.modules.fines ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-subtle font-medium">Rastreamento Real</span>
                              <span className={cn("font-bold text-[10px] uppercase", currentTenantObj.modules.tracking ? "text-success" : "text-subtle")}>
                                {currentTenantObj.modules.tracking ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-subtle font-medium">Finanças</span>
                              <span className={cn("font-bold text-[10px] uppercase", currentTenantObj.modules.finances ? "text-success" : "text-subtle")}>
                                {currentTenantObj.modules.finances ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Whitelabel Visual mockup box */}
                      <div className="space-y-2 pt-2 border-t border-line">
                        <label className="text-[10px] font-bold text-subtle uppercase tracking-wider block">Simulador Visual do Portal do Cliente</label>
                        <div className="bg-bg rounded-xl border border-line p-4 space-y-3 relative overflow-hidden shadow-inner">
                          {/* Mini Header mock */}
                          <div className="flex justify-between items-center pb-2 border-b border-line text-[10px]">
                            <div className="flex items-center gap-1.5 font-bold">
                              <div className="w-4 h-4 rounded flex items-center justify-center text-white" style={{ backgroundColor: currentTenantObj.color }}>
                                <TrendingUp size={8} />
                              </div>
                              <span className="text-ink font-display uppercase tracking-tight">{currentTenantObj.name}</span>
                            </div>
                            <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold text-white" style={{ backgroundColor: currentTenantObj.color }}>
                              Portal Gestor
                            </span>
                          </div>

                          {/* Mini Grid mock */}
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="p-2 bg-muted rounded border border-line space-y-0.5">
                              <span className="text-subtle text-[8px] uppercase font-bold">Veículos</span>
                              <p className="font-bold text-ink">{currentTenantObj.vehiclesCount} carros</p>
                            </div>
                            <div className="p-2 bg-muted rounded border border-line space-y-0.5">
                              <span className="text-subtle text-[8px] uppercase font-bold">Status Fatura</span>
                              <p className={cn("font-bold text-[9px]", currentTenantObj.status === 'Ativo' ? "text-success" : "text-danger")}>
                                {currentTenantObj.status === 'Ativo' ? 'Paga' : 'Inativa'}
                              </p>
                            </div>
                          </div>

                          {/* Custom visual accent simulation button */}
                          <button 
                            className="w-full text-white text-[10.5px] font-bold py-1.5 rounded transition-opacity" 
                            style={{ backgroundColor: currentTenantObj.color }}
                          >
                            Novo Motorista Isolado
                          </button>
                        </div>
                      </div>

                      {/* How mapping works code details */}
                      <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl space-y-1 text-xs text-subtle">
                        <p className="font-bold text-ink text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <Key size={12} className="text-accent" />
                          Mapeamento de Subdomínio:
                        </p>
                        <p className="text-[10px] leading-relaxed">
                          Na nuvem (SaaS real), o front-end detecta a URL acessada pelo cliente e solicita as variáveis corretas do banco:
                        </p>
                        <pre className="bg-bg text-[9px] font-mono p-2 rounded border border-line text-ink leading-normal mt-1.5">
                          {`// Detecta subdomínio no front-end\nconst host = window.location.hostname;\nconst subdomain = host.split('.')[0];\n// Ex: locadorasul.efraim.com -> locadorasul\nconst tenant = await api.getTenant(subdomain);`}
                        </pre>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 1: ARCHITECTURE DETAILS */}
      {activeSubTab === 'architecture' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 text-left">
            {/* Visual Clean Architecture layout summary */}
            <div className="panel p-6 space-y-6">
              <h3 className="text-md font-bold mb-4 flex items-center gap-2 border-b border-line pb-3">
                <Cpu size={18} className="text-accent" />
                Estrutura de Camadas (Hexagonal / Clean Architecture)
              </h3>
              
              <p className="text-xs text-subtle leading-relaxed">
                Para escalabilidade Enterprise, dividimos o Efraim Frotas em círculos concêntricos de dependência. O núcleo do sistema é totalmente isolado de bibliotecas externas, do Firebase e de frameworks de banco de dados.
              </p>

              {/* Visual ASCII Diagram */}
              <div className="bg-bg text-ink dark:text-emerald-400 font-mono text-xs p-4 rounded-xl border border-line leading-relaxed overflow-x-auto">
                {"┌─────────────────────────────────────────────────────────────┐\n"}
                {"│              INFRASTRUCTURE (Camada Externa)                │\n"}
                {"│   [Firebase Auth]  [Prisma Postgres Adapter]  [n8n Webhook] │\n"}
                {"└──────────────────────────────┬──────────────────────────────┘\n"}
                {"                               │  implements ports / triggers\n"}
                {"┌──────────────────────────────▼──────────────────────────────┐\n"}
                {"│              APPLICATION USE CASES (Interactors)            │\n"}
                {"│    - ReceivePaymentUseCase     - CreateContractUseCase      │\n"}
                {"└──────────────────────────────┬──────────────────────────────┘\n"}
                {"                               │  coordinates domain models\n"}
                {"┌──────────────────────────────▼──────────────────────────────┐\n"}
                {"│                  DOMAIN LAYER (Regras e Invariantes)         │\n"}
                {"│         [DriverEntity]               [PaymentEntity]        │\n"}
                {"│         (Validação CPF/CNH)         (Integridade de Caixa)  │\n"}
                {"└─────────────────────────────────────────────────────────────┘"}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted border border-line rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Domain Layer (Invariantes)</span>
                  <p className="text-xs text-subtle leading-relaxed">
                    Contém as regras que nunca mudam, independente de bancos ou APIs. Ex: se um CPF não bate na fórmula matemática de dígitos verificadores, o motorista não é criado, impedindo corrupção de dados.
                  </p>
                </div>
                <div className="p-4 bg-muted border border-line rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Isolation Multi-Tenant</span>
                  <p className="text-xs text-subtle leading-relaxed">
                    Cada entidade armazena o id da administradora ou franqueadora (<code className="font-mono text-[10px] bg-bg px-1 rounded">tenantId</code>). Os repositórios interceptam a busca garantindo que um administrador jamais enxergue dados de outra empresa parceira.
                  </p>
                </div>
              </div>
            </div>

            {/* S.O.L.I.D. Compliancy overview */}
            <div className="panel p-6 space-y-4">
              <h3 className="text-md font-bold mb-4 flex items-center gap-2 border-b border-line pb-3">
                <Sliders size={18} className="text-accent" />
                Como aplicamos os Princípios S.O.L.I.D.
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0">S</div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Single Responsibility Principle (SRP)</h4>
                    <p className="text-xs text-subtle leading-relaxed">A classe <code className="font-mono bg-bg px-1 rounded font-bold">DriverEntity</code> tem foco exclusivo em regras e validações matemáticas do motorista (como validação de CPF), sem saber de e-mails de disparo ou gravação em banco.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0">O</div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Open/Closed Principle (OCP)</h4>
                    <p className="text-xs text-subtle leading-relaxed">Os fluxos de automação n8n são estendidos via Webhooks cadastráveis no painel. Podemos adicionar quantos fluxos novos quisermos sem alterar as rotinas críticas de gravação de pagamentos no código-fonte.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0">L</div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Liskov Substitution Principle (LSP)</h4>
                    <p className="text-xs text-subtle leading-relaxed">Qualquer extensão ou herança de transações financeiras pode substituir a classe ancestral <code className="font-mono bg-bg px-1 rounded font-bold">PaymentEntity</code> sem quebrar o caso de uso principal <code className="font-mono bg-bg px-1 rounded font-bold">ReceivePaymentUseCase</code>.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0">I</div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Interface Segregation Principle (ISP)</h4>
                    <p className="text-xs text-subtle leading-relaxed">Definimos a persistência através da interface <code className="font-mono bg-bg px-1 rounded font-bold">IDriverRepository</code> segregada especificamente para motoristas, sem obrigá-la a ter métodos gigantescos de frotas ou multas que não utiliza.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0">D</div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Dependency Inversion Principle (DIP)</h4>
                    <p className="text-xs text-subtle leading-relaxed">O caso de uso de criação de pagamentos não sabe se o banco é Firebase Firestore ou PostgreSQL com prisma; ele depende em tempo de compilação da interface abstrata <code className="font-mono bg-bg px-1 rounded font-bold">IDriverRepository</code>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Architecture summary stats card */}
          <div className="space-y-6">
            <div className="panel p-6 space-y-4">
              <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                <Microchip size={14} />
                Status do Core de Domínio
              </h4>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-line">
                  <span className="text-subtle font-medium">Linguagem de Tipagem:</span>
                  <span className="font-bold text-ink font-mono">TypeScript 5.8</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-line">
                  <span className="text-subtle font-medium">Banco Relacional Alvo:</span>
                  <span className="font-bold text-ink font-mono">PostgreSQL 16</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-line">
                  <span className="text-subtle font-medium">Framework de Persistência:</span>
                  <span className="font-bold text-ink font-mono">Prisma ORM</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-line">
                  <span className="text-subtle font-medium">Arquitetura de Isolamento:</span>
                  <span className="font-bold text-success font-mono">Multi-Tenant Ativo</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1">
                  <span className="text-subtle font-medium">Nível de Decoplamento:</span>
                  <span className="font-bold text-accent font-mono">Clean Architecture (Hexagonal)</span>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setActiveSubTab('tests')}
                  className="btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2"
                >
                  <Terminal size={14} />
                  Ir ao Testador de Invariantes
                </button>
              </div>
            </div>

            <div className="panel p-6 bg-accent/5 border-accent/10 space-y-2 text-left">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                📦 Pronto para Next.js / NestJS
              </h4>
              <p className="text-xs text-subtle leading-relaxed">
                As classes de domínio desenvolvidas aqui são universais: elas rodam diretamente no cliente (painel web do React) e podem ser importadas de forma idêntica e sem modificações na sua API de produção construída em NestJS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: EXECUTABLE AUTOMATED TESTS */}
      {activeSubTab === 'tests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detailed results (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="panel p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4 mb-6">
                <div className="text-left">
                  <h3 className="text-md font-bold flex items-center gap-2">
                    <Terminal size={18} className="text-accent" />
                    Runner de Teste Unitário Integrado
                  </h3>
                  <p className="text-xs text-subtle mt-0.5">Rode as suítes de validação matemática de invariantes direto no navegador.</p>
                </div>

                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="btn-primary text-xs font-bold flex items-center gap-2 px-5 py-2.5 shrink-0"
                >
                  <RefreshCw size={13} className={isRunningTests ? "animate-spin" : ""} />
                  {isRunningTests ? "Compilando e Rodando..." : "Executar Testes de Domínio"}
                </button>
              </div>

              {isRunningTests && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-subtle">Instanciando IDriverRepository em memória, injetando Use Cases e aplicando CPFs mockados...</p>
                </div>
              )}

              {testSummary === null && !isRunningTests && (
                <div className="py-12 text-center text-subtle space-y-4">
                  <div className="p-3 bg-muted rounded-full w-fit mx-auto">
                    <Terminal size={24} className="text-subtle" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink">Bateria de testes em stand-by</p>
                    <p className="text-[11px] leading-relaxed max-w-[280px] mx-auto">Clique no botão acima para rodar o script e auditar o compliance do código com as regras SRP e isolamento Multi-tenant.</p>
                  </div>
                </div>
              )}

              {testSummary !== null && !isRunningTests && (
                <div className="space-y-6 text-left">
                  {/* Grid of test summary metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted border border-line rounded-xl">
                      <span className="text-[10px] text-subtle font-bold uppercase">Passaram</span>
                      <p className="text-lg font-bold text-success">{testSummary.passedCount} / {testSummary.passedCount + testSummary.failedCount}</p>
                    </div>
                    <div className="p-3 bg-muted border border-line rounded-xl">
                      <span className="text-[10px] text-subtle font-bold uppercase">Falharam</span>
                      <p className="text-lg font-bold text-danger">{testSummary.failedCount}</p>
                    </div>
                    <div className="p-3 bg-muted border border-line rounded-xl">
                      <span className="text-[10px] text-subtle font-bold uppercase">Latência</span>
                      <p className="text-lg font-bold text-ink font-mono">{testSummary.totalDurationMs} ms</p>
                    </div>
                    <div className="p-3 bg-muted border border-line rounded-xl">
                      <span className="text-[10px] text-subtle font-bold uppercase">Cobertura</span>
                      <p className="text-lg font-bold text-accent font-mono">{testSummary.coveragePercent}%</p>
                    </div>
                  </div>

                  {/* Terminal list of successes / failures */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-subtle uppercase tracking-widest px-1">Resultados Detalhados</h4>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {testSummary.results.map((result, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg border border-line bg-muted flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-bold text-accent uppercase bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                                {result.category}
                              </span>
                              <span className="text-xs font-bold text-ink font-mono">{result.name}</span>
                            </div>
                            {result.error && (
                              <p className="text-[10.5px] text-rose-600 bg-rose-500/5 p-2 rounded font-mono border border-rose-500/10 mt-1">
                                <strong>Erro Invariante:</strong> {result.error}
                              </p>
                            )}
                            <p className="text-[10px] text-subtle">Duração: {result.durationMs}ms</p>
                          </div>

                          <div className="shrink-0 mt-0.5">
                            {result.status === 'passed' ? (
                              <div className="text-success flex items-center gap-1 text-[11px] font-bold">
                                <CheckCircle2 size={13} /> PASSED
                              </div>
                            ) : (
                              <div className="text-danger flex items-center gap-1 text-[11px] font-bold">
                                <XCircle size={13} /> FAILED
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column (1 column wide) explaining what's executed */}
          <div className="space-y-6 text-left">
            <div className="panel p-6 space-y-4">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1 border-b border-line pb-3">
                <Terminal size={14} className="text-accent" />
                Como rodar via Terminal Local?
              </h4>
              <p className="text-xs text-subtle leading-relaxed">
                No seu projeto NestJS de produção integrado, você poderá escrever uma rotina robusta usando o testador nativo do Node.js ou do Jest.
              </p>
              
              <div className="bg-bg p-3 rounded-lg border border-line font-mono text-[10.5px] text-ink leading-relaxed">
                {"# Instale pacotes\n"}
                <span className="text-accent">npm install --save-dev jest @types/jest ts-jest</span>
                {"\n\n# Execute a bateria\n"}
                <span className="text-accent">npm run test</span>
              </div>

              <div className="p-3 bg-muted border border-line rounded-xl space-y-1.5 text-xs text-subtle">
                <p className="font-bold text-ink text-[11px] uppercase tracking-wider">Invariantes de Teste Cobertos:</p>
                <ul className="list-disc list-inside space-y-1 font-medium">
                  <li>Validação Algorítmica de CPF</li>
                  <li>Invalidação de CPF duplicados</li>
                  <li>Reconhecimento de CNH vencida</li>
                  <li>Rejeição de Valores Negativos</li>
                  <li>Estorno de Motoristas Bloqueados</li>
                  <li>Isolance Multi-Tenant de Inquilinos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 3: COPYABLE BLUEPRINTS */}
      {activeSubTab === 'blueprints' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          {/* Blueprint Selector Sidebar */}
          <div className="md:col-span-1 space-y-3">
            <h4 className="text-[11px] font-bold text-subtle uppercase tracking-widest px-2">Artefatos Gerados</h4>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedBlueprint('prisma')}
                className={cn(
                  "w-full text-left text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-between",
                  selectedBlueprint === 'prisma' ? "bg-accent/10 border-l-4 border-accent text-accent" : "hover:bg-muted text-subtle hover:text-ink"
                )}
              >
                <span>📊 Banco (Prisma Postgres)</span>
                <Database size={13} />
              </button>
              <button
                onClick={() => setSelectedBlueprint('docker')}
                className={cn(
                  "w-full text-left text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-between",
                  selectedBlueprint === 'docker' ? "bg-accent/10 border-l-4 border-accent text-accent" : "hover:bg-muted text-subtle hover:text-ink"
                )}
              >
                <span>📦 Infra (Dockerfile Setup)</span>
                <Cpu size={13} />
              </button>
              <button
                onClick={() => setSelectedBlueprint('nestjs')}
                className={cn(
                  "w-full text-left text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-between",
                  selectedBlueprint === 'nestjs' ? "bg-accent/10 border-l-4 border-accent text-accent" : "hover:bg-muted text-subtle hover:text-ink"
                )}
              >
                <span>🔧 Backend (NestJS Service)</span>
                <FileCode size={13} />
              </button>
              <button
                onClick={() => setSelectedBlueprint('github')}
                className={cn(
                  "w-full text-left text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-between",
                  selectedBlueprint === 'github' ? "bg-accent/10 border-l-4 border-accent text-accent" : "hover:bg-muted text-subtle hover:text-ink"
                )}
              >
                <span>⚡ CI/CD (GitHub Actions)</span>
                <Workflow size={13} />
              </button>
            </div>

            <div className="p-4 bg-muted border border-line rounded-xl text-left space-y-1.5 mt-6">
              <h5 className="text-[10px] font-bold text-ink uppercase tracking-wider">Qualidade Enterprise</h5>
              <p className="text-[11px] text-subtle leading-relaxed">
                Estes modelos são baseados de forma fidedigna nos arquivos físicos criados no seu workspace Efraim. Você pode copiá-los prontamente para carregar no seu repositório de produção oficial do GitHub.
              </p>
            </div>
          </div>

          {/* Code display terminal (3 Columns wide) */}
          <div className="md:col-span-3 space-y-4">
            <div className="panel p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-line pb-4 flex-wrap gap-4">
                <div>
                  <h3 className="text-md font-bold text-ink">
                    {selectedBlueprint === 'prisma' && 'Modelagem de Tabelas no Prisma ORM (Postgres)'}
                    {selectedBlueprint === 'docker' && 'Infraestrutura de Microsserviço com Docker'}
                    {selectedBlueprint === 'nestjs' && 'Inscrição de Motoristas com Invariantes no NestJS'}
                    {selectedBlueprint === 'github' && 'Esteira Automatizada de Deploy com GitHub Actions'}
                  </h3>
                  <p className="text-xs text-subtle mt-0.5">
                    {selectedBlueprint === 'prisma' && 'Definições relacionais com isolamento multi-tenant.'}
                    {selectedBlueprint === 'docker' && 'Multistage Builds otimizados para menor carregamento de cache em Cloud Run.'}
                    {selectedBlueprint === 'nestjs' && 'Aplicação pura de SOLID agregando regras estritas de CNH/CPF.'}
                    {selectedBlueprint === 'github' && 'Checkouts de integridade, lints automáticos e push de imagens.'}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyCode(blueprints[selectedBlueprint], selectedBlueprint)}
                  className="btn-primary text-xs font-bold flex items-center gap-1.5 px-4 py-2"
                >
                  {copiedId === selectedBlueprint ? (
                    <>✓ Copiado!</>
                  ) : (
                    <>
                      <Copy size={13} />
                      Copiar Gabarito
                    </>
                  )}
                </button>
              </div>

              {/* Code display block */}
              <pre className="p-4 rounded-xl border border-line font-mono text-[11px] text-ink bg-bg overflow-x-auto leading-relaxed max-h-[480px]">
                {blueprints[selectedBlueprint]}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default EnterpriseDashboard;
