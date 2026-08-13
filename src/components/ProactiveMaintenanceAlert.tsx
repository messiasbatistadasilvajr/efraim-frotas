import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  ChevronRight, 
  TrendingDown, 
  ShieldCheck, 
  Plus, 
  Car, 
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { Vehicle, Maintenance, Contract } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface ProactiveMaintenanceAlertProps {
  vehicles: Vehicle[];
  maintenances: Maintenance[];
  contracts: Contract[];
  onNavigateToMaintenance?: () => void;
  onOpenNewMaintenanceModal?: (vehicleId: string) => void;
}

interface VehicleMaintenancePrediction {
  vehicle: Vehicle;
  lastKm: number;
  kmSinceLastService: number;
  estimatedDailyKm: number;
  remainingKmToOilChange: number;
  estimatedDaysToService: number;
  status: 'critical' | 'warning' | 'ok';
  suggestedAction: string;
  preventiveCost: number;
  correctiveAvoidedCost: number;
}

export function ProactiveMaintenanceAlert({
  vehicles,
  maintenances,
  contracts,
  onNavigateToMaintenance,
  onOpenNewMaintenanceModal
}: ProactiveMaintenanceAlertProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate proactive predictions for each vehicle
  const predictions = useMemo(() => {
    const list: VehicleMaintenancePrediction[] = [];

    vehicles.forEach(vehicle => {
      if (vehicle.status === 'inactive') return;

      // Find last recorded maintenance for this vehicle
      const vehicleMaintenances = maintenances
        .filter(m => m.vehicleId === vehicle.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastMaint = vehicleMaintenances[0];
      const lastKm = lastMaint ? lastMaint.km : Math.max(0, vehicle.currentKm - 8200); // realistic baseline estimate if no maintenance logged yet

      const kmSinceLastService = Math.max(0, vehicle.currentKm - lastKm);
      const OIL_SERVICE_INTERVAL_KM = 10000;
      const remainingKmToOilChange = OIL_SERVICE_INTERVAL_KM - kmSinceLastService;

      // Estimate daily km usage for rideshare
      const activeContract = contracts.find(c => c.vehicleId === vehicle.id && c.status === 'active');
      let estimatedDailyKm = 140; // Default average Uber/99 daily km
      if (activeContract && activeContract.initialKm) {
        const daysActive = Math.max(1, Math.floor((new Date().getTime() - new Date(activeContract.startDate).getTime()) / (1000 * 60 * 60 * 24)));
        const kmDrivenInContract = Math.max(0, vehicle.currentKm - activeContract.initialKm);
        if (daysActive > 3 && kmDrivenInContract > 100) {
          estimatedDailyKm = Math.min(300, Math.max(80, Math.round(kmDrivenInContract / daysActive)));
        }
      }

      const estimatedDaysToService = Math.round(remainingKmToOilChange / estimatedDailyKm);

      let status: 'critical' | 'warning' | 'ok' = 'ok';
      let suggestedAction = 'Manutenção em dia';

      if (remainingKmToOilChange <= 300) {
        status = 'critical';
        suggestedAction = `URGENTE: Limite de óleo atingido (${remainingKmToOilChange < 0 ? `${Math.abs(remainingKmToOilChange)} km excedidos` : `restam apenas ${remainingKmToOilChange} km`}). Agende imediatamente.`;
      } else if (remainingKmToOilChange <= 1800 || estimatedDaysToService <= 12) {
        status = 'warning';
        suggestedAction = `Atenção: Troca de óleo e filtro recomendada em ~${Math.max(1, estimatedDaysToService)} dias (${remainingKmToOilChange} km restantes).`;
      }

      const preventiveCost = 320; // R$ 320 average oil + filter + inspection
      const correctiveAvoidedCost = 3400; // R$ 3.400 engine repair avoided

      list.push({
        vehicle,
        lastKm,
        kmSinceLastService,
        estimatedDailyKm,
        remainingKmToOilChange,
        estimatedDaysToService,
        status,
        suggestedAction,
        preventiveCost,
        correctiveAvoidedCost
      });
    });

    return list.sort((a, b) => a.remainingKmToOilChange - b.remainingKmToOilChange);
  }, [vehicles, maintenances, contracts]);

  const criticalCount = predictions.filter(p => p.status === 'critical').length;
  const warningCount = predictions.filter(p => p.status === 'warning').length;
  const totalAlerts = criticalCount + warningCount;

  // Aggregate financial metrics
  const totalAvoidedDamage = (criticalCount + warningCount) * 3400;

  if (predictions.length === 0) return null;

  return (
    <div className="bg-slate-900 border-2 border-amber-400/40 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={cn(
            "p-3 rounded-2xl shrink-0 shadow-md",
            criticalCount > 0 
              ? "bg-rose-500 text-white animate-pulse" 
              : totalAlerts > 0 
              ? "bg-amber-400 text-slate-950 font-bold" 
              : "bg-emerald-500/20 text-emerald-400"
          )}>
            <Wrench size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base sm:text-lg text-white tracking-tight">
                Notificação Preditiva de Manutenção Preventiva
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-extrabold uppercase">
                IA Telemetria & Quilometragem
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {totalAlerts > 0 ? (
                <>
                  Identificados <strong className="text-amber-400">{totalAlerts} veículos</strong> próximos ou acima da margem de segurança de km/tempo rodado. Ação preventiva economiza até <strong className="text-emerald-400">{formatCurrency(totalAvoidedDamage)}</strong> em danos graves de motor.
                </>
              ) : (
                <>
                  Toda a sua frota está com o plano de manutenção preventiva em dia! Nenhuma intervenção urgente estimada para os próximos 1.500 km.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>{showDetails ? 'Ocultar Detalhes' : 'Ver Veículos e Quilometragem'}</span>
            <ChevronRight size={14} className={cn("transition-transform", showDetails && "rotate-90")} />
          </button>

          {onNavigateToMaintenance && (
            <button
              onClick={onNavigateToMaintenance}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 uppercase tracking-wider"
            >
              <Plus size={14} />
              <span>Registrar Manutenção</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Vehicle Breakdown List */}
      {showDetails && (
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Análise Preditiva de Troca de Óleo e Revisão Geral
            </span>
            <span className="text-[11px]">
              Médias de rodagem: <strong>~140 km/dia por motorista Uber</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((p) => {
              const progressPercent = Math.min(100, Math.max(0, (p.kmSinceLastService / 10000) * 100));

              return (
                <div 
                  key={p.vehicle.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3",
                    p.status === 'critical'
                      ? "bg-rose-950/40 border-rose-500/50 text-slate-100"
                      : p.status === 'warning'
                      ? "bg-amber-950/30 border-amber-500/40 text-slate-100"
                      : "bg-slate-950/60 border-slate-800 text-slate-300"
                  )}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {p.vehicle.plate}
                        </span>
                        <span className="text-xs text-slate-300 font-semibold truncate max-w-[120px]">
                          {p.vehicle.model}
                        </span>
                      </div>

                      <span className={cn(
                        "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                        p.status === 'critical'
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : p.status === 'warning'
                          ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      )}>
                        {p.status === 'critical' ? 'Urgentíssimo' : p.status === 'warning' ? 'Atenção' : 'Em Dia'}
                      </span>
                    </div>

                    {/* Km Specs */}
                    <div className="text-xs space-y-1 my-2">
                      <div className="flex justify-between text-slate-400">
                        <span>Hodômetro Atual:</span>
                        <span className="font-bold text-white font-mono">{p.vehicle.currentKm.toLocaleString('pt-BR')} km</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Rodados desde a 1ª revisão:</span>
                        <span className="font-bold text-amber-400 font-mono">{p.kmSinceLastService.toLocaleString('pt-BR')} / 10.000 km</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Estimativa para limite:</span>
                        <span className={cn(
                          "font-bold font-mono",
                          p.remainingKmToOilChange < 0 ? "text-rose-400" : "text-emerald-400"
                        )}>
                          {p.remainingKmToOilChange < 0 
                            ? `Excedido em ${Math.abs(p.remainingKmToOilChange)} km` 
                            : `~${p.remainingKmToOilChange} km (${p.estimatedDaysToService} dias)`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-2 border border-slate-700/50">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500 rounded-full",
                          progressPercent >= 90 ? "bg-rose-500" : progressPercent >= 75 ? "bg-amber-400" : "bg-emerald-400"
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-300 italic bg-slate-900/80 p-2 rounded-xl border border-slate-800 leading-tight">
                      "{p.suggestedAction}"
                    </p>
                  </div>

                  {/* Action */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Custo Prev: <strong className="text-white">{formatCurrency(p.preventiveCost)}</strong>
                    </span>

                    {onOpenNewMaintenanceModal ? (
                      <button
                        onClick={() => onOpenNewMaintenanceModal(p.vehicle.id)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                      >
                        Agendar <ArrowUpRight size={12} />
                      </button>
                    ) : onNavigateToMaintenance ? (
                      <button
                        onClick={onNavigateToMaintenance}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                      >
                        Agendar <ArrowUpRight size={12} />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
