import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Vehicle, Driver, Payment, Maintenance, Contract, Issue } from '../types';
import { 
  mockVehicles, 
  mockDrivers, 
  mockContracts, 
  mockPayments, 
  mockMaintenances, 
  mockIssues 
} from '../lib/mockData';

export function useFleetData() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If the session flag is explicitly set to demo, instantly load mock data
    const isDemo = localStorage.getItem('efraim_demo_session') === 'true';
    if (isDemo) {
      setVehicles(mockVehicles);
      setDrivers(mockDrivers);
      setPayments(mockPayments);
      setMaintenances(mockMaintenances);
      setContracts(mockContracts);
      setIssues(mockIssues);
      setLoading(false);
      return;
    }

    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    const ownerId = auth.currentUser.uid;
    setLoading(true);

    const unsubV = onSnapshot(query(collection(db, 'vehicles'), where('ownerId', '==', ownerId)), (s) => {
      const dbVehicles = s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle));
      setVehicles(dbVehicles.length > 0 ? dbVehicles : mockVehicles);
    });
    const unsubD = onSnapshot(query(collection(db, 'drivers'), where('ownerId', '==', ownerId)), (s) => {
      const dbDrivers = s.docs.map(d => ({ id: d.id, ...d.data() } as Driver));
      setDrivers(dbDrivers.length > 0 ? dbDrivers : mockDrivers);
    });
    const unsubP = onSnapshot(query(collection(db, 'payments'), where('ownerId', '==', ownerId)), (s) => {
      const dbPayments = s.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
      setPayments(dbPayments.length > 0 ? dbPayments : mockPayments);
    });
    const unsubM = onSnapshot(query(collection(db, 'maintenances'), where('ownerId', '==', ownerId)), (s) => {
      const dbMaintenances = s.docs.map(d => ({ id: d.id, ...d.data() } as Maintenance));
      setMaintenances(dbMaintenances.length > 0 ? dbMaintenances : mockMaintenances);
    });
    const unsubC = onSnapshot(query(collection(db, 'contracts'), where('ownerId', '==', ownerId)), (s) => {
      const dbContracts = s.docs.map(d => ({ id: d.id, ...d.data() } as Contract));
      setContracts(dbContracts.length > 0 ? dbContracts : mockContracts);
    });
    const unsubI = onSnapshot(query(collection(db, 'issues'), where('ownerId', '==', ownerId)), (s) => {
      const dbIssues = s.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
      setIssues(dbIssues.length > 0 ? dbIssues : mockIssues);
      setLoading(false);
    });

    return () => {
      unsubV(); unsubD(); unsubP(); unsubM(); unsubC(); unsubI();
    };
  }, []);

  return { vehicles, drivers, payments, maintenances, contracts, issues, loading };
}
