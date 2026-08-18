import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  CreditCard, 
  FileText, 
  Clock, 
  Camera, 
  CheckCircle2, 
  DollarSign, 
  HelpCircle, 
  Info, 
  Calculator, 
  Zap, 
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Car,
  Lock
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'mechanisms' | 'sinistros' | 'fines' | 'best_practices' | 'calculator';
}

export function LegalProtectionGuideModal({ isOpen, onClose, initialTab = 'mechanisms' }: Props) {
  const [activeTab, setActiveTab] = useState<'mechanisms' | 'sinistros' | 'fines' | 'best_practices' | 'calculator'>(initialTab);

  // Interactive Calculator State
  const [fleetSize, setFleetSize] = useState<number>(5);
  const [insuranceFranchise, setInsuranceFranchise] = useState<number>(3500);
  const [dailyRentalRate, setDailyRentalRate] = useState<number>(100);
  const [estimatedRepairDays, setEstimatedRepairDays] = useState<number>(7);
  const [hasCreditCardVault, setHasCreditCardVault] = useState<boolean>(true);

  if (!isOpen) return null;

  // Calculation of Recommended Deposit
  const calculatedLossProfit = dailyRentalRate * estimatedRepairDays;
  const recommendedSecurityDeposit = hasCreditCardVault
    ? Math.round((insuranceFranchise * 0.4) + 300)
    : Math.round((insuranceFranchise * 0.5) + (dailyRentalRate * 4));

  const totalFleetProtection = recommendedSecurityDeposit * fleetSize;

  return (
    <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-4xl rounded-2xl border border-line overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-bg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              <Scale size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[18px] font-bold tracking-tight text-ink">
                  Guia Jurídico & Proteção Patrimonial
                </h3>
                <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Validade Legal (Código Civil)
                </span>
              </div>
              <p className="text-subtle text-xs">
                Como repassar custos de sinistros, batidas, lucros cessantes e multas de forma 100% legal e blindada
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg hover:bg-surface text-subtle hover:text-ink flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-line bg-surface overflow-x-auto text-xs font-bold scrollbar-none">
          {[
            { id: 'mechanisms', label: '1. Mecanismos de Cobrança', icon: FileText },
            { id: 'sinistros', label: '2. Regras de Sinistro (Batidas)', icon: AlertTriangle },
            { id: 'fines', label: '3. Regras para Multas', icon: DollarSign },
            { id: 'best_practices', label: '4. Boas Práticas & Vistoria', icon: Camera },
            { id: 'calculator', label: '5. Calculadora de Caução & Risco', icon: Calculator },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-all",
                  isActive
                    ? "border-accent text-accent bg-accent/5"
                    : "border-transparent text-subtle hover:text-ink hover:bg-bg"
                )}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface">
          
          {/* TAB 1: Mecanismos Legais de Cobrança */}
          {activeTab === 'mechanisms' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                <p className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                  <ShieldCheck size={16} /> É legal e seguro repassar os prejuízos ao motorista?
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Sim, é perfeitamente possível e legal.</strong> A lei brasileira (Código Civil, arts. 566 a 578 e responsabilidade civil) protege o patrimônio da sua locadora contra danos causados por condutores terceiros, desde que tudo esteja <strong>expressamente previsto no Contrato de Locação Comercial</strong>.
                </p>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-subtle">
                Os 3 Pilares Indispensáveis de Cobrança:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="panel p-5 bg-bg border-line space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                    <FileText size={20} />
                  </div>
                  <h5 className="font-bold text-sm text-ink">1. Contrato Comercial</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    O seu principal escudo jurídico. O texto estipula expressamente que o locatário é o <strong>único responsável</strong> por qualquer infração de trânsito ou dano material causado durante o período de posse.
                  </p>
                  <span className="inline-block text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                    Cláusula Expressa
                  </span>
                </div>

                <div className="panel p-5 bg-bg border-line space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <DollarSign size={20} />
                  </div>
                  <h5 className="font-bold text-sm text-ink">2. Caução (Garantia)</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    Exigência de depósito de segurança prévio (geralmente entre <strong>R$ 1.000 e R$ 2.000</strong>) antes da entrega da chave. Fica retido para cobrir pequenas avarias, franquia de seguro ou multas.
                  </p>
                  <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Liquidez Imediata
                  </span>
                </div>

                <div className="panel p-5 bg-bg border-line space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                    <CreditCard size={20} />
                  </div>
                  <h5 className="font-bold text-sm text-ink">3. Cartão de Garantia</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    Tokenização do cartão de crédito do motorista no sistema. Permite debitar multas residuais ou orçamentos de funilaria assim que o laudo for emitido, sem atrito.
                  </p>
                  <span className="inline-block text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Cobrança Recorrente
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Regras para Casos de Sinistro (Batidas) */}
          {activeTab === 'sinistros' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1 text-slate-800">
                <p className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                  <AlertTriangle size={16} /> Como agir quando ocorre uma colisão ou sinistro:
                </p>
                <p className="leading-relaxed">
                  Quando o motorista for o causador do acidente ou quando o terceiro fugir/não tiver seguro, a responsabilidade integral pelo restabelecimento do patrimônio recai sobre o locatário conforme as regras abaixo:
                </p>
              </div>

              <div className="space-y-3">
                <div className="panel p-4 bg-bg border-line flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    A
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-ink">Franquia do Seguro Integral</h5>
                    <p className="text-xs text-subtle mt-0.5 leading-relaxed">
                      Se o estrago justificar acionar a apólice, o motorista paga <strong>100% do valor da franquia estipulada</strong>. O valor exato da franquia deve constar no contrato (ex: R$ 3.500,00).
                    </p>
                  </div>
                </div>

                <div className="panel p-4 bg-bg border-line flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    B
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-ink">Prejuízos Abaixo da Franquia</h5>
                    <p className="text-xs text-subtle mt-0.5 leading-relaxed">
                      Se o conserto for menor que o valor da franquia (ex: R$ 800 de parachoque), não compensa acionar o seguro. O motorista arca com o <strong>valor integral das peças e mão de obra</strong>.
                    </p>
                  </div>
                </div>

                <div className="panel p-4 bg-bg border-line flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    C
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-ink">Apresentação de 2 a 3 Orçamentos Transparentes</h5>
                    <p className="text-xs text-subtle mt-0.5 leading-relaxed">
                      Para blindar sua cobrança e evitar contestações na Justiça, apresente sempre 2 ou 3 orçamentos de oficinas idôneas, optando pelo de melhor custo-benefício.
                    </p>
                  </div>
                </div>

                <div className="panel p-4 bg-bg border-line flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    D
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-ink">Cobrança de Lucros Cessantes (Dias Parados)</h5>
                    <p className="text-xs text-subtle mt-0.5 leading-relaxed">
                      Se o carro precisar ficar 10 dias parado na oficina aguardando peças por culpa do motorista, a locadora deixa de faturar. O contrato prevê o <strong>pagamento das diárias normais de locação</strong> pelo período de indisponibilidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Regras para Casos de Multas */}
          {activeTab === 'fines' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs space-y-1 text-slate-800">
                <p className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
                  <DollarSign size={16} /> Fluxo de Indicação no Detran & Cobrança de Multas:
                </p>
                <p className="leading-relaxed">
                  O trâmite para multas exige rigor com os prazos de notificação dos órgãos de trânsito (Detran CE, AMC, PRF e DER).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="panel p-4 bg-bg border-line space-y-2">
                  <div className="text-xs font-bold text-accent uppercase tracking-wider">Passo 1</div>
                  <h5 className="font-bold text-sm text-ink">Indicação do Condutor</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    Assim que a autuação chegar, faça a <strong>Indicação de Condutor Infrator</strong> no portal do Detran. Isso transfere a pontuação para a CNH do motorista e evita multa por não indicação (NIC).
                  </p>
                </div>

                <div className="panel p-4 bg-bg border-line space-y-2">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Passo 2</div>
                  <h5 className="font-bold text-sm text-ink">Cobrança Imediata</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    O valor financeiro é debitado da <strong>caução</strong>, passado no cartão cadastrado ou gerado em fatura avulsa com taxa administrativa operacional de 10% a 15%.
                  </p>
                </div>

                <div className="panel p-4 bg-bg border-line space-y-2">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Passo 3</div>
                  <h5 className="font-bold text-sm text-ink">Cláusula de Reembolso Tardio</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    Mesmo se a multa for notificada pelo Detran <strong>meses após o término do aluguel</strong>, o contrato garante o direito de cobrar o motorista retroativamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Boas Práticas & Vistoria */}
          {activeTab === 'best_practices' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="panel p-5 bg-bg border-line space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                    <Camera size={20} />
                  </div>
                  <h5 className="font-bold text-sm text-ink">Vistoria Fotográfica Detalhada</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    Utilize o módulo de <strong>Checklist com Fotos e AI Vision</strong> na entrega e na devolução. Ambas as partes assinam o laudo. Sem vistoria de saída, fica quase impossível provar danos novos na Justiça.
                  </p>
                </div>

                <div className="panel p-5 bg-bg border-line space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                    <Lock size={20} />
                  </div>
                  <h5 className="font-bold text-sm text-ink">Rastreamento com Bloqueador</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    Rastreador GPS ativo 24h com telemetria e corte remoto de ignição. Se o motorista tentar evadir-se com o veículo batido ou recusar contato, você localiza e recolhe o patrimônio imediatamente.
                  </p>
                </div>

                <div className="panel p-5 bg-bg border-line space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Scale size={20} />
                  </div>
                  <h5 className="font-bold text-sm text-ink">Validação Jurídica Profissional</h5>
                  <p className="text-xs text-subtle leading-relaxed">
                    Evite minutas genéricas. Todas as cláusulas geradas no Efraim Frotas foram desenhadas conforme as exigências da jurisprudência de tribunais estaduais para locadoras comerciais.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Calculadora de Caução & Proteção */}
          {activeTab === 'calculator' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl text-xs space-y-1">
                <p className="font-bold text-accent flex items-center gap-1.5 text-sm">
                  <Calculator size={16} /> Dimensionamento Inteligente de Garantia & Risco
                </p>
                <p className="text-subtle">
                  Ajuste os parâmetros abaixo de acordo com a sua apólice de seguro e perfil da frota para calcular o valor seguro de caução por motorista.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4 bg-bg p-5 rounded-xl border border-line">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-subtle flex justify-between">
                      <span>Tamanho da Frota Ativa</span>
                      <span className="font-mono font-bold text-ink">{fleetSize} veículos</span>
                    </label>
                    <input 
                      type="range" 
                      min={1} 
                      max={50} 
                      value={fleetSize} 
                      onChange={e => setFleetSize(parseInt(e.target.value))}
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-subtle">Valor Médio da Franquia do Seguro (R$)</label>
                    <input 
                      type="number" 
                      step={100}
                      value={insuranceFranchise} 
                      onChange={e => setInsuranceFranchise(parseFloat(e.target.value) || 0)}
                      className="w-full bg-surface border border-line rounded-lg p-2 text-xs font-bold font-mono outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-subtle">Diária Média (R$)</label>
                      <input 
                        type="number" 
                        value={dailyRentalRate} 
                        onChange={e => setDailyRentalRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-surface border border-line rounded-lg p-2 text-xs font-bold font-mono outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-subtle">Dias Médios em Oficina</label>
                      <input 
                        type="number" 
                        value={estimatedRepairDays} 
                        onChange={e => setEstimatedRepairDays(parseInt(e.target.value) || 1)}
                        className="w-full bg-surface border border-line rounded-lg p-2 text-xs font-bold font-mono outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-2 text-xs font-bold text-ink select-none">
                    <input 
                      type="checkbox" 
                      checked={hasCreditCardVault} 
                      onChange={e => setHasCreditCardVault(e.target.checked)}
                      className="rounded accent-accent cursor-pointer"
                    />
                    <span>Motorista possui Cartão de Crédito como garantia adicional</span>
                  </label>
                </div>

                {/* Results Card */}
                <div className="panel p-5 bg-gradient-to-br from-surface to-bg border-accent/30 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent block">
                      RECOMENDAÇÃO TÉCNICA DE COBERTURA
                    </span>

                    <div className="bg-surface p-4 rounded-xl border border-line space-y-1">
                      <span className="text-xs text-subtle">Caução Ideal Sugerida (por carro):</span>
                      <div className="text-2xl font-black font-mono text-emerald-600">
                        {formatCurrency(recommendedSecurityDeposit)}
                      </div>
                      <p className="text-[11px] text-subtle">
                        Cobre ~{Math.round((recommendedSecurityDeposit / insuranceFranchise) * 100)}% da franquia + pequenas avarias iniciais.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-surface p-2.5 rounded-lg border border-line">
                        <span className="text-[10px] text-subtle block">Lucros Cessantes Estimados:</span>
                        <span className="font-bold text-ink font-mono">{formatCurrency(calculatedLossProfit)}</span>
                      </div>
                      <div className="bg-surface p-2.5 rounded-lg border border-line">
                        <span className="text-[10px] text-subtle block">Proteção Global da Frota:</span>
                        <span className="font-bold text-emerald-600 font-mono">{formatCurrency(totalFleetProtection)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-subtle italic border-t border-line pt-2">
                    💡 Dica: Para motoristas de app com score alto, permita parcelar a caução em 2x (entrada + 1ª semana).
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-bg flex items-center justify-between">
          <p className="text-[11px] text-subtle">
            As diretrizes estão integradas aos modelos de contrato e termos digitais do Efraim Frotas.
          </p>
          <button
            onClick={onClose}
            className="btn-primary text-xs font-bold px-5 py-2"
          >
            Entendido & Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
