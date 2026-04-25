import { Vehicle, Maintenance, Payment, Driver, Contract } from '../types';

export const FleetEngine = {
  /**
   * Calculates ROI based on revenue, costs and purchase value
   */
  calculateROI: (revenue: number, costs: number, purchaseValue: number): number => {
    if (purchaseValue <= 0) return 0;
    const roi = ((revenue - costs) / purchaseValue) * 100;
    return isNaN(roi) ? 0 : roi;
  },

  /**
   * Calculates cost per kilometer
   */
  calculateCostPerKm: (totalCosts: number, currentKm: number): number => {
    if (currentKm <= 0) return 0;
    const cost = totalCosts / currentKm;
    return isNaN(cost) ? 0 : cost;
  },

  /**
   * Determines document expiry status
   */
  getExpiryStatus: (date: string | undefined): 'expired' | 'warning' | 'ok' | null => {
    if (!date) return null;
    const day = 24 * 60 * 60 * 1000;
    const diff = new Date(date).getTime() - new Date().getTime();
    if (diff < 0) return 'expired';
    if (diff < 30 * day) return 'warning';
    return 'ok';
  },

  /**
   * Formats currency to BRL
   */
  formatBRL: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  },

  /**
   * Aggregates maintenance costs by vehicle
   */
  aggregateMaintenanceByVehicle: (vehicles: Vehicle[], maintenances: Maintenance[]) => {
    return vehicles.map(v => {
      const vMaintenances = maintenances.filter(m => m.vehicleId === v.id);
      const totalCost = vMaintenances.reduce((acc, m) => acc + (m.cost || 0), 0);
      return {
        ...v,
        totalMaintenanceCost: totalCost,
        maintenanceCount: vMaintenances.length
      };
    }).sort((a, b) => b.totalMaintenanceCost - a.totalMaintenanceCost);
  }
};
