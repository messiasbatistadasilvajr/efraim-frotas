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

export interface Issue {
  id: string;
  vehicleId?: string;
  driverId?: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  date: string;
  ownerId: string;
  parentId?: string; // For sub-issues
}

export interface CommercialProposal {
  id: string;
  proposalNumber: string;
  clientName: string;
  clientCpfCnpj: string;
  clientEmail: string;
  clientPhone: string;
  vehicleCategory: string; // 'Econômico', 'Sedan Conforto', 'Premium Black'
  weeklyRate: number;
  securityDeposit: number;
  minimumPeriodWeeks: number;
  kmAllowancePerWeek: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  validUntil: string;
  notes?: string;
  signedAt?: string;
  signedIp?: string;
  ownerId: string;
}

export interface OperationalTask {
  id: string;
  code: string;
  title: string;
  description: string;
  columnId: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vehicleId?: string;
  vehiclePlate?: string;
  driverName?: string;
  assignee: string;
  category: 'manutencao' | 'sinistro' | 'documentacao' | 'vistoria' | 'limpeza' | 'financeiro';
  dueDate?: string;
  estimatedCost?: number;
  tags: string[];
  subtasks: { id: string; title: string; completed: boolean }[];
  createdAt: string;
  ownerId: string;
}

export interface InvestorAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  vehiclesCount: number;
  totalInvested: number;
  managementFeePercent: number; // e.g., 10% ou 15%
  bankInfo: {
    bank: string;
    agency: string;
    account: string;
    pixKey: string;
  };
  statements: {
    id: string;
    month: string; // '2026-07'
    grossRevenue: number;
    maintenanceExpenses: number;
    managementFee: number;
    netPayout: number;
    status: 'paid' | 'pending';
    paidAt?: string;
  }[];
  ownerId: string;
}

