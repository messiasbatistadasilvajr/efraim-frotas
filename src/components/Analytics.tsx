import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart2, Award, AlertCircle, PieChart, Activity, DollarSign, Car, Wrench, X, TrendingDown } from 'lucide-react';
import { useFleetData } from '../hooks/useFleetData';
import { FleetEngine } from '../lib/fleet-engine';
import { formatCurrency, cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart as RePieChart, Pie, LabelList
} from 'recharts';

export function Analytics() {
  const { vehicles, drivers, payments, maintenances, contracts, loading } = useFleetData();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // ROI per Vehicle - Memoized
  const vehicleStats = useMemo(() => {
    return vehicles.map(v => {
      const vPayments = payments.filter(p => {
          const c = contracts.find(contract => contract.id === p.contractId);
          return c?.vehicleId === v.id;
      });
      const vMaintenances = maintenances.filter(m => m.vehicleId === v.id);
      
      const revenue = vPayments.reduce((acc, p) => acc + p.amount, 0);
      const costs = vMaintenances.reduce((acc, m) => acc + m.cost, 0);
      const profit = revenue - costs;
      const roi = FleetEngine.calculateROI(revenue, costs, v.purchaseValue);

      return {
        plate: v.plate,
        model: v.model,
        revenue,
        costs,
        profit,
        roi
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [vehicles, payments, maintenances, contracts]);

  // Driver Ranking - Memoized
  const driverStats = useMemo(() => {
    return drivers.map(d => {
      const dPayments = payments.filter(p => p.driverId === d.id && p.type === 'weekly');
      const dTotalPaid = dPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const scoreVal = Math.min(100, (dTotalPaid / 5000) * 100); 
      const score = isNaN(scoreVal) ? 0 : scoreVal;

      return {
        name: d.name,
        totalPaid: dTotalPaid,
        score: score.toFixed(1),
        scoreNum: score
      };
    }).sort((a, b) => b.scoreNum - a.scoreNum);
  }, [drivers, payments]);

  // Document Alerts Logic - Memoized
  const docAlerts = useMemo(() => {
    return [
      ...vehicles.flatMap(v => {
        const insStatus = FleetEngine.getExpiryStatus(v.insuranceExpiry);
        const licStatus = FleetEngine.getExpiryStatus(v.licensingExpiry);
        const alerts = [];
        if (insStatus && insStatus !== 'ok') alerts.push({ target: v.model, detail: v.plate, doc: 'Seguro', date: v.insuranceExpiry, status: insStatus });
        if (licStatus && licStatus !== 'ok') alerts.push({ target: v.model, detail: v.plate, doc: 'Licenciamento', date: v.licensingExpiry, status: licStatus });
        return alerts;
      }),
      ...drivers.flatMap(d => {
        const cnhStatus = FleetEngine.getExpiryStatus(d.cnhExpiry);
        if (cnhStatus && cnhStatus !== 'ok') return [{ target: d.name, detail: 'Motorista', doc: 'CNH', date: d.cnhExpiry, status: cnhStatus }];
        return [];
      }),
      ...contracts.filter(c => c.status === 'active' && c.endDate).flatMap(c => {
        const status = FleetEngine.getExpiryStatus(c.endDate!);
        if (status && status !== 'ok') {
          const driver = drivers.find(d => d.id === c.driverId);
          const vehicle = vehicles.find(v => v.id === c.vehicleId);
          return [{ 
            target: driver?.name || 'Motorista', 
            detail: vehicle?.plate || 'Contrato', 
            doc: 'Contrato', 
            date: c.endDate!, 
            status 
          }];
        }
        return [];
      })
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [vehicles, drivers, contracts]);

  const expiredAlerts = useMemo(() => docAlerts.filter(a => a.status === 'expired'), [docAlerts]);
  const warningAlerts = useMemo(() => docAlerts.filter(a => a.status === 'warning'), [docAlerts]);

  // Maintenance Monthly Aggregation - Memoized
  const maintenanceMonthlyData = useMemo(() => {
    return maintenances.reduce((acc: { label: string; cost: number; rawDate: Date }[], m) => {
      const date = new Date(m.date);
      const month = date.toLocaleString('pt-BR', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      const label = `${month}/${year}`;
      
      const existing = acc.find(item => item.label === label);
      if (existing) {
        existing.cost += (m.cost || 0);
      } else {
        acc.push({ label, cost: (m.cost || 0), rawDate: date });
      }
      return acc;
    }, []).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [maintenances]);

  // Maintenance cost per vehicle analysis - Memoized
  const vehicleMaintenanceStats = useMemo(() => {
    return vehicles.map(v => {
      const vMaintenances = maintenances.filter(m => m.vehicleId === v.id);
      const totalCost = vMaintenances.reduce((acc, m) => acc + (m.cost || 0), 0);
      const costPerKm = FleetEngine.calculateCostPerKm(totalCost, v.currentKm);

      return {
        id: v.id,
        plate: v.plate,
        model: v.model,
        totalCost,
        costPerKm
      };
    }).sort((a, b) => b.totalCost - a.totalCost);
  }, [vehicles, maintenances]);

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);
  const selectedVehicleMaintenances = useMemo(() => {
    return maintenances
      .filter(m => m.vehicleId === selectedVehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenances, selectedVehicleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-subtle font-medium">Carregando análises inteligentes...</p>
      </div>
    );
  }

  // Maintenance Type Breakdown
  const maintenanceTypeData = [
    { name: 'Preventiva', value: maintenances.filter(m => m.type === 'preventive').reduce((acc, m) => acc + (m.cost || 0), 0) },
    { name: 'Corretiva', value: maintenances.filter(m => m.type === 'corrective').reduce((acc, m) => acc + (m.cost || 0), 0) },
  ].filter(item => item.value > 0);

  const COLORS = ['#6366F1', '#EF4444', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-tight mb-1">Performance & Analytics</h2>
          <p className="text-subtle text-[14px]">Visão detalhada de rentabilidade e desempenho da frota</p>
        </div>
      </header>

      {/* Document Alerts Card */}
      {docAlerts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[18px] font-bold flex items-center gap-2">
              <AlertCircle size={20} className="text-warning" />
              Monitoramento de Vencimentos
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-widest text-subtle">
              Total de {docAlerts.length} pendências
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expired Alerts */}
            <div className="panel p-5 border-l-4 border-l-danger bg-danger/5">
              <h4 className="text-[14px] font-bold text-danger uppercase tracking-widest mb-4 flex items-center gap-2">
                Documentos Vencidos ({expiredAlerts.length})
              </h4>
              <div className="space-y-3">
                {expiredAlerts.length === 0 ? (
                  <p className="text-[12px] text-subtle italic py-4">Nenhum documento vencido.</p>
                ) : (
                  expiredAlerts.map((alert, i) => (
                    <div key={i} className="flex flex-col p-3 bg-surface border border-danger/20 rounded-[8px] shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-danger/10 text-danger rounded">
                          {alert.doc}
                        </span>
                        <span className="text-[11px] font-bold font-mono text-danger">
                          Vencido em {new Date(alert.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h5 className="text-[14px] font-bold leading-tight">{alert.target}</h5>
                      <p className="text-[11px] text-subtle uppercase tracking-widest">{alert.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Warning Alerts */}
            <div className="panel p-5 border-l-4 border-l-warning bg-warning/5">
              <h4 className="text-[14px] font-bold text-warning uppercase tracking-widest mb-4 flex items-center gap-2">
                A Vencer (Próximos 30 dias) ({warningAlerts.length})
              </h4>
              <div className="space-y-3">
                {warningAlerts.length === 0 ? (
                  <p className="text-[12px] text-subtle italic py-4">Nenhum vencimento próximo.</p>
                ) : (
                  warningAlerts.map((alert, i) => (
                    <div key={i} className="flex flex-col p-3 bg-surface border border-warning/20 rounded-[8px] shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-warning/10 text-warning rounded">
                          {alert.doc}
                        </span>
                        <span className="text-[11px] font-bold font-mono text-warning">
                          Vence em {new Date(alert.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h5 className="text-[14px] font-bold leading-tight">{alert.target}</h5>
                      <p className="text-[11px] text-subtle uppercase tracking-widest">{alert.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ROI Chart */}
        <div className="panel p-6 space-y-6">
           <div className="flex items-center gap-2 border-b border-line pb-4 mb-2">
             <div className="p-2 bg-accent/10 rounded-lg">
               <BarChart2 className="text-accent" size={18} />
             </div>
             <h3 className="text-[16px] font-bold">ROI por Veículo (%)</h3>
           </div>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleStats.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="plate" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip 
                  cursor={{fill: '#f5f7f9'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px'}}
                />
                <Bar dataKey="roi" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Profit vs Costs Pie */}
        <div className="panel p-6 space-y-6">
           <div className="flex items-center gap-2 border-b border-line pb-4 mb-2">
             <div className="p-2 bg-success/10 rounded-lg">
               <PieChart className="text-success" size={18} />
             </div>
             <h3 className="text-[16px] font-bold">Distribuição Financeira</h3>
           </div>
           <div className="h-[300px] w-full flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <RePieChart>
                 <Pie
                    data={[
                      { name: 'Lucro Líquido', value: Math.max(0, vehicleStats.reduce((a, b) => a + (b.profit || 0), 0)) },
                      { name: 'Custo de Manutenção', value: Math.max(0, maintenances.reduce((a, b) => a + (b.cost || 0), 0)) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                 >
                   <Cell fill="var(--color-accent)" />
                   <Cell fill="#e2e8f0" />
                 </Pie>
                 <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
               </RePieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-subtle tracking-tighter">Total Receita</span>
                <span className="text-[20px] font-display font-bold text-ink leading-tight">
                  {formatCurrency(payments.reduce((a, b) => a + b.amount, 0))}
                </span>
             </div>
           </div>
        </div>

        {/* Monthly Maintenance Chart */}
        <div className="panel p-6 space-y-6">
           <div className="flex items-center gap-2 border-b border-line pb-4">
             <div className="p-2 bg-danger/10 rounded-lg">
               <Wrench className="text-danger" size={18} />
             </div>
             <h3 className="text-[16px] font-bold">Custos de Manutenção Mensais</h3>
           </div>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip 
                  cursor={{fill: '#f5f7f9'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px'}}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Bar dataKey="cost" fill="var(--color-danger)" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Maintenance Analysis Table */}
        <div className="panel overflow-hidden">
          <div className="p-5 border-b border-line bg-ink/5">
            <h3 className="text-[14px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-accent" /> Eficiência de Manutenção
            </h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Veículo</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">Custo Total</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">Custo/KM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {vehicleMaintenanceStats.slice(0, 5).map((v, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-bg/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedVehicleId(v.id)}
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-[13px] group-hover:text-accent transition-colors">{v.model}</p>
                    <p className="text-[11px] font-mono text-subtle">{v.plate}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-[13px] font-medium">{formatCurrency(v.totalCost)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "font-bold text-[14px]",
                      v.costPerKm > 0.5 ? "text-danger" : "text-accent"
                    )}>
                      R$ {v.costPerKm.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Maintenance Type Pie Chart */}
        <div className="panel p-6 space-y-6">
           <div className="flex items-center gap-2 border-b border-line pb-4 mb-2">
             <div className="p-2 bg-warning/10 rounded-lg">
               <PieChart className="text-warning" size={18} />
             </div>
             <h3 className="text-[16px] font-bold">Tipo de Manutenção</h3>
           </div>
           <div className="h-[300px] w-full flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <RePieChart>
                 <Pie
                    data={maintenanceTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                 >
                   {maintenanceTypeData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
               </RePieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-subtle tracking-tighter">Total Geral</span>
                <span className="text-[20px] font-display font-bold text-ink leading-tight">
                  {formatCurrency(maintenances.reduce((acc, m) => acc + (m.cost || 0), 0))}
                </span>
             </div>
           </div>
        </div>

        {/* Maintenance Cost per Vehicle Bar Chart */}
        <div className="panel p-6 space-y-6">
           <div className="flex items-center gap-2 border-b border-line pb-4 mb-2">
             <div className="p-2 bg-danger/10 rounded-lg">
               <TrendingDown className="text-danger" size={18} />
             </div>
             <h3 className="text-[16px] font-bold text-ink">Custos Totais por Veículo</h3>
           </div>
           <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleMaintenanceStats.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="model" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `R$ ${val}`} 
                />
                <Tooltip 
                  cursor={{fill: '#f5f7f9'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px'}}
                  formatter={(val: number) => formatCurrency(val)}
                  labelFormatter={(idx) => `Veículo: ${idx}`}
                />
                <Bar dataKey="totalCost" fill="#EF4444" fillOpacity={0.8} radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList 
                    dataKey="totalCost" 
                    position="top" 
                    formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
           <p className="text-[11px] text-subtle text-center italic mt-2">
             Mostrando os 10 veículos com maiores custos acumulados de manutenção.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top ROI Vehicles Table */}
        <div className="panel overflow-hidden">
          <div className="p-5 border-b border-line bg-accent/[0.03]">
            <h3 className="text-[14px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Car size={16} className="text-accent" /> Rentabilidade da Frota
            </h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider">Veículo</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">Custo</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">Receita</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-subtle tracking-wider text-right">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {vehicleStats.slice(0, 5).map((v, idx) => (
                <tr key={idx} className="hover:bg-bg/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[13px]">{v.model}</p>
                    <p className="text-[11px] font-mono text-subtle">{v.plate}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-[13px] text-danger font-medium">{formatCurrency(v.costs)}</td>
                  <td className="px-6 py-4 text-right text-[13px] text-success font-medium">{formatCurrency(v.revenue)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-[14px] text-accent">{v.roi.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Driver Ranking */}
        <div className="panel overflow-hidden">
          <div className="p-5 border-b border-line bg-bg/30">
            <h3 className="text-[14px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Award size={16} /> Rankings de Motoristas
            </h3>
          </div>
          <div className="divide-y divide-line">
            {driverStats.slice(0, 5).map((d, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-bg/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px]",
                    idx === 0 ? "bg-accent text-surface" : "bg-bg text-subtle border border-line"
                  )}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-[14px]">{d.name}</p>
                    <p className="text-[11px] text-subtle uppercase tracking-widest">Score de Parceiro</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-bold">{d.score}</div>
                  <div className="w-24 h-1.5 bg-bg rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-accent transition-all duration-1000" 
                      style={{ width: `${d.score}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Maintenance History Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="panel w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-line flex items-center justify-between bg-bg/30">
              <div>
                <h3 className="text-[18px] font-bold">Histórico de Manutenções</h3>
                <p className="text-[12px] text-subtle font-mono uppercase tracking-widest">
                  {selectedVehicle.model} • {selectedVehicle.plate}
                </p>
              </div>
              <button 
                onClick={() => setSelectedVehicleId(null)}
                className="p-2 hover:bg-bg rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {selectedVehicleMaintenances.length > 0 ? (
                <div className="space-y-6">
                  {selectedVehicleMaintenances.map((m, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-line group">
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-accent group-hover:scale-125 transition-transform" />
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold font-mono text-subtle">
                              {new Date(m.date).toLocaleDateString()}
                            </span>
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded",
                              m.type === 'preventive' ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
                            )}>
                              {m.type === 'preventive' ? 'Preventiva' : 'Corretiva'}
                            </span>
                          </div>
                          <h4 className="text-[15px] font-bold">{m.description}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[16px] font-bold text-ink">{formatCurrency(m.cost)}</p>
                        </div>
                      </div>
                      
                      {m.parts && m.parts.length > 0 && (
                        <div className="bg-bg/50 border border-line rounded-md p-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle mb-2">Peças Substituídas</p>
                          <div className="flex flex-wrap gap-2">
                            {m.parts.map((p, i) => (
                              <span key={i} className="text-[11px] bg-surface border border-line px-2 py-0.5 rounded shadow-sm">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wrench size={40} className="text-line mb-4" />
                  <p className="text-subtle font-medium">Nenhuma manutenção registrada para este veículo.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-line bg-bg/10 flex justify-end">
              <button 
                onClick={() => setSelectedVehicleId(null)}
                className="btn-secondary px-6 py-2"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
