import { Vehicle, Driver, Contract, Maintenance, Fine, Payment, Issue } from '../types';

export const mockVehicles: Vehicle[] = [
  {
    id: "v-1",
    plate: "QXG-4E25",
    model: "Fiat Cronos 1.3 Precision",
    year: 2022,
    color: "Cinza Metálico",
    status: "rented",
    currentKm: 42150,
    licensingExpiry: "2026-09-15",
    insuranceExpiry: "2026-11-20",
    purchaseValue: 78000,
    ownerId: "demo-manager"
  },
  {
    id: "v-2",
    plate: "RFK-9A15",
    model: "Chevrolet Onix Sedan Plus",
    year: 2021,
    color: "Prata",
    status: "rented",
    currentKm: 68100,
    licensingExpiry: "2026-06-10",
    insuranceExpiry: "2026-10-05",
    purchaseValue: 69000,
    ownerId: "demo-manager"
  },
  {
    id: "v-3",
    plate: "GAP-2D98",
    model: "Hyundai HB20S Vision",
    year: 2023,
    color: "Branco Polar",
    status: "available",
    currentKm: 15300,
    licensingExpiry: "2026-12-18",
    insuranceExpiry: "2027-02-12",
    purchaseValue: 84000,
    ownerId: "demo-manager"
  },
  {
    id: "v-4",
    plate: "EFR-7B21",
    model: "Toyota Corolla GLi 2.0",
    year: 2023,
    color: "Preto Eclipse",
    status: "maintenance",
    currentKm: 32000,
    licensingExpiry: "2026-05-15",
    insuranceExpiry: "2026-07-20",
    purchaseValue: 145000,
    ownerId: "demo-manager"
  },
  {
    id: "v-5",
    plate: "FLK-3C42",
    model: "Fiat Argo Drive 1.0",
    year: 2020,
    color: "Vermelho Montecarlo",
    status: "rented",
    currentKm: 85400,
    licensingExpiry: "2026-08-30",
    insuranceExpiry: "2026-09-10",
    purchaseValue: 58000,
    ownerId: "demo-manager"
  }
];

export const mockDrivers: Driver[] = [
  {
    id: "d-1",
    name: "Thiago Martins de Souza",
    cnh: "98765432109",
    cnhExpiry: "2029-10-14",
    cpf: "123.456.789-00",
    contact: "(11) 98765-4321",
    email: "motorista_demo@efraim.com",
    status: "active",
    depositBalance: 900,
    ownerId: "demo-manager"
  },
  {
    id: "d-2",
    name: "Ana Beatriz Silva",
    cnh: "87654321098",
    cnhExpiry: "2028-05-22",
    cpf: "234.567.890-11",
    contact: "(11) 97654-3210",
    email: "ana.silva@exemplo.com",
    status: "active",
    depositBalance: 800,
    ownerId: "demo-manager"
  },
  {
    id: "d-3",
    name: "Roberto Carlos Ramos",
    cnh: "76543210987",
    cnhExpiry: "2025-12-05",
    cpf: "345.678.901-22",
    contact: "(11) 96543-2109",
    email: "roberto@exemplo.com",
    status: "active",
    depositBalance: 600,
    ownerId: "demo-manager"
  }
];

export const mockContracts: Contract[] = [
  {
    id: "c-1",
    driverId: "d-1",
    vehicleId: "v-1",
    startDate: "2025-01-10",
    status: "active",
    pricePerWeek: 690,
    securityDeposit: 900,
    initialKm: 35000,
    ownerId: "demo-manager"
  },
  {
    id: "c-2",
    driverId: "d-2",
    vehicleId: "v-2",
    startDate: "2025-02-15",
    status: "active",
    pricePerWeek: 590,
    securityDeposit: 800,
    initialKm: 62000,
    ownerId: "demo-manager"
  },
  {
    id: "c-3",
    driverId: "d-3",
    vehicleId: "v-5",
    startDate: "2024-11-20",
    status: "active",
    pricePerWeek: 590,
    securityDeposit: 800,
    initialKm: 78000,
    ownerId: "demo-manager"
  }
];

export const mockPayments: Payment[] = [
  { id: "p-1", driverId: "d-1", contractId: "c-1", date: "2026-05-10", amount: 690, type: "weekly", ownerId: "demo-manager" },
  { id: "p-2", driverId: "d-1", contractId: "c-1", date: "2026-05-17", amount: 690, type: "weekly", ownerId: "demo-manager" },
  { id: "p-3", driverId: "d-1", contractId: "c-1", date: "2026-05-24", amount: 690, type: "weekly", ownerId: "demo-manager" },
  { id: "p-4", driverId: "d-2", contractId: "c-2", date: "2026-05-12", amount: 590, type: "weekly", ownerId: "demo-manager" },
  { id: "p-5", driverId: "d-2", contractId: "c-2", date: "2026-05-19", amount: 590, type: "weekly", ownerId: "demo-manager" },
  { id: "p-6", driverId: "d-3", contractId: "c-3", date: "2026-05-08", amount: 590, type: "weekly", ownerId: "demo-manager" },
  { id: "p-7", driverId: "d-3", contractId: "c-3", date: "2026-05-15", amount: 590, type: "weekly", ownerId: "demo-manager" },
  { id: "p-8", driverId: "d-3", contractId: "c-3", date: "2026-05-22", amount: 590, type: "weekly", ownerId: "demo-manager" },
  { id: "p-9", driverId: "d-1", contractId: "c-1", date: "2026-05-03", amount: 900, type: "deposit", ownerId: "demo-manager" }
];

export const mockMaintenances: Maintenance[] = [
  {
    id: "m-1",
    vehicleId: "v-4",
    type: "preventive",
    date: "2026-05-15",
    km: 32000,
    cost: 450,
    description: "Revisão periódica preventiva de 30k e alinhamento tridimensional.",
    workshopName: "Oficina Efraim Prime",
    ownerId: "demo-manager"
  },
  {
    id: "m-2",
    vehicleId: "v-2",
    type: "corrective",
    date: "2026-05-20",
    km: 67800,
    cost: 1100,
    description: "Substituição completa do kit de embreagem e fluido de freio.",
    workshopName: "Humberto Auto Elétrica e Mecânica",
    ownerId: "demo-manager"
  }
];

export const mockIssues: Issue[] = [
  {
    id: "i-1",
    vehicleId: "v-1",
    driverId: "d-1",
    title: "Vazamento leve de água",
    description: "O reservatório de expansão do radiador está descendo de nível lentamente ao final do dia de trabalho.",
    status: "in_progress",
    priority: "medium",
    date: "2026-05-28",
    ownerId: "demo-manager"
  },
  {
    id: "i-2",
    vehicleId: "v-5",
    driverId: "d-3",
    title: "Alerta de pneu murchando",
    description: "O sensor de pressão traseiro esquerdo ativou no painel duas vezes esta semana.",
    status: "open",
    priority: "low",
    date: "2026-05-29",
    ownerId: "demo-manager"
  }
];

export const mockFines: Fine[] = [
  {
    id: "f-1",
    vehicleId: "v-1",
    driverId: "d-1",
    date: "2026-05-02",
    amount: 130.16,
    description: "Transitar em velocidade superior à máxima permitida em até 20%",
    status: "pending",
    infractionCode: "518-51",
    ownerId: "demo-manager"
  }
];
