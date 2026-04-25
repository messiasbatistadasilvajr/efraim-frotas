import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Users, 
  AlertCircle,
  DollarSign,
  Activity,
  Clock,
  Plus
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
  Line
} from 'recharts';
import { useFleetData } from '../hooks/useFleetData';
import { FleetEngine } from '../lib/fleet-engine';
import { formatCurrency, cn } from '../lib/utils';

export function Dashboard({ onViewChange }: { onViewChange?: (view: any) => void }) {
  const { vehicles, drivers, contracts, payments, maintenances, loading } = useFleetData();

  // Calculations - Memoized
  const statsData = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalCosts = maintenances.reduce((acc, m) => acc + (m.cost || 0), 0);
    const netProfit = totalRevenue - totalCosts;
    
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const inMaintenance = vehicles.filter(v => v.status === 'maintenance').length;
    
    const fleetAvailabilityVal = vehicles.length > 0 
      ? ((vehicles.length - inMaintenance) / vehicles.length) * 100 
      : 0;
    const fleetAvailability = isNaN(fleetAvailabilityVal) ? 0 : fleetAvailabilityVal;

    const totalPurchaseValue = vehicles.reduce((acc, v) => acc + (v.purchaseValue || 0), 0);
    const roi = FleetEngine.calculateROI(totalRevenue, totalCosts, totalPurchaseValue);
    
    const totalKmMonth = vehicles.reduce((acc, v) => acc + (v.currentKm || 0), 0);
    const estimatedFixedCosts = totalPurchaseValue * 0.0125; 
    const costPerKm = FleetEngine.calculateCostPerKm(totalCosts + estimatedFixedCosts, totalKmMonth);

    return { 
      totalRevenue, 
      totalCosts, 
      netProfit, 
      activeContracts, 
      fleetAvailability, 
      roi, 
      costPerKm 
    };
  }, [vehicles, payments, maintenances, contracts]);

  // Alerts logic - Memoized
  const alerts = useMemo(() => {
    const activeAlerts: { title: string, desc: string, type: 'critical' | 'warning' }[] = [];
    
    vehicles.forEach(v => {
      const licStatus = FleetEngine.getExpiryStatus(v.licensingExpiry);
      if (licStatus && licStatus !== 'ok') {
         activeAlerts.push({ 
           title: 'Licenciamento próximo', 
           desc: `Veículo ${v.plate} vence em ${v.licensingExpiry}.`,
           type: licStatus === 'expired' ? 'critical' : 'warning'
         });
      }
    });

    drivers.forEach(d => {
      const cnhStatus = FleetEngine.getExpiryStatus(d.cnhExpiry);
      if (cnhStatus && cnhStatus !== 'ok') {
         activeAlerts.push({ 
           title: 'CNH vencendo', 
           desc: `Motorista ${d.name} (${cnhStatus === 'expired' ? 'EXPIRADO' : 'PRÓXIMO AO VENCIMENTO'}).`,
           type: cnhStatus === 'expired' ? 'critical' : 'warning'
         });
      }
    });

    return activeAlerts;
  }, [vehicles, drivers]);

  const stats = [
    { 
      label: 'Receita Total', 
      value: formatCurrency(statsData.totalRevenue), 
      icon: TrendingUp, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    { 
      label: 'Custos Manutenção', 
      value: formatCurrency(statsData.totalCosts), 
      icon: TrendingDown, 
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    { 
      label: 'Contratos Ativos', 
      value: statsData.activeContracts, 
      icon: Car, 
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    { 
      label: 'ROI Estimado', 
      value: `${statsData.roi.toFixed(2)}%`, 
      icon: TrendingUp, 
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    { 
      label: 'Custo por KM', 
      value: formatCurrency(statsData.costPerKm), 
      icon: Activity, 
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      label: 'Disponibilidade', 
      value: `${statsData.fleetAvailability.toFixed(1)}%`, 
      icon: Clock, 
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-subtle font-medium">Carregando painel de controle...</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Jan', receita: 4000, custos: 2400 },
    { name: 'Fev', receita: 3000, custos: 1398 },
    { name: 'Mar', receita: 2000, custos: 9800 },
    { name: 'Abr', receita: 2780, custos: 3908 },
    { name: 'Mai', receita: 1890, custos: 4800 },
    { name: 'Jun', receita: 2390, custos: 3800 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Painel de Controle</h2>
          <p className="text-subtle text-[14px]">Visão geral sua frota Uber</p>
        </div>
        <button 
          onClick={() => onViewChange?.('contracts')}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={16} />
          Nova Locação
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label uppercase tracking-[0.5px] text-[11px] font-semibold text-subtle mb-2">{stat.label}</div>
            <div className="flex items-baseline justify-between">
              <div className="stat-value text-[24px] font-bold text-ink">{stat.value}</div>
              <div className={cn("text-[12px] font-medium", stat.color)}>
                {i === 0 ? '+2.1% este mês' : i === 5 ? '12/13 Ativos' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel">
          <div className="p-4 px-5 border-b border-line flex items-center justify-between">
            <h3 className="text-[14px] font-semibold">Locações Ativas</h3>
            <button 
              onClick={() => onViewChange?.('contracts')}
              className="text-[12px] text-subtle hover:text-ink font-bold uppercase tracking-widest"
            >
              Ver todos
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase text-subtle tracking-wider">Veículo</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase text-subtle tracking-wider">Motorista</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase text-subtle tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase text-subtle tracking-wider">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contracts.filter(c => c.status === 'active').slice(0, 4).map((c, idx) => {
                  const v = vehicles.find(veh => veh.id === c.vehicleId);
                  const d = drivers.find(drv => drv.id === c.driverId);
                  return (
                    <tr key={c.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[13px]">{v?.plate || '---'}</div>
                        <div className="text-[11px] text-subtle">{v?.model}</div>
                      </td>
                      <td className="px-5 py-4 text-[13px]">{d?.name || '---'}</td>
                      <td className="px-5 py-4">
                        <span className="bg-[#EEF2FF] text-[#4338CA] px-2 py-1 rounded-[4px] text-[11px] font-bold uppercase">
                          EM DIA
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] font-medium">
                        {formatCurrency(c.pricePerWeek)}
                      </td>
                    </tr>
                  )
                })}
                {contracts.filter(c => c.status === 'active').length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-subtle text-xs italic">Nenhuma locação ativa no momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="p-4 px-5 border-b border-line">
            <h3 className="text-[14px] font-semibold">Alertas Críticos</h3>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-line">
            {alerts.length === 0 && <p className="px-5 py-10 text-center text-subtle text-xs italic">Nenhum alerta crítico para hoje.</p>}
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex gap-4 p-5 items-start">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                  alert.type === 'critical' ? 'bg-danger' : 'bg-warning'
                )} />
                <div>
                  <h4 className="text-[13px] font-semibold leading-tight">{alert.title}</h4>
                  <p className="text-[12px] text-subtle mt-1">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
