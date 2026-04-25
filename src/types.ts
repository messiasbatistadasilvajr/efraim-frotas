export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  color: string;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  currentKm: number;
  insuranceExpiry: string;
  licensingExpiry: string;
  purchaseValue: number;
  ownerId: string;
  documents?: {
    crlvUrl?: string;
    insurancePolicyUrl?: string;
  };
}

export interface Driver {
  id: string;
  name: string;
  cnh: string;
  cnhExpiry: string;
  cpf: string;
  contact: string;
  email: string;
  status: 'active' | 'blocked' | 'inactive';
  ownerId: string;
  depositBalance: number;
  documents?: {
    cnhUrl?: string;
    residenceProofUrl?: string;
  };
}

export interface Contract {
  id: string;
  driverId: string;
  vehicleId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'closed' | 'cancelled';
  pricePerWeek: number;
  securityDeposit: number;
  initialKm: number;
  finalKm?: number;
  ownerId: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  type: 'preventive' | 'corrective';
  date: string;
  km: number;
  cost: number;
  description: string;
  parts?: string[];
  workshopName?: string;
  ownerId: string;
}

export interface Fine {
  id: string;
  vehicleId: string;
  driverId: string;
  date: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'contested' | 'reimbursed';
  infractionCode?: string;
  ownerId: string;
}

export interface Payment {
  id: string;
  driverId: string;
  contractId: string;
  date: string;
  amount: number;
  type: 'weekly' | 'deposit' | 'repair' | 'fine' | 'earnings'; // 'earnings' for gross earnings reporting
  ownerId: string;
}

export interface Checklist {
  id: string;
  contractId: string;
  type: 'delivery' | 'return';
  date: string;
  km: number;
  items: {
    itemName: string;
    status: 'ok' | 'damage' | 'missing';
    note?: string;
  }[];
  photos?: string[];
  ownerId: string;
}
