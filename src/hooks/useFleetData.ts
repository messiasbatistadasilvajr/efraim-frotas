import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Vehicle, Driver, Payment, Maintenance, Contract } from '../types';

export function useFleetData() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    const ownerId = auth.currentUser.uid;
    setLoading(true);

    const unsubV = onSnapshot(query(collection(db, 'vehicles'), where('ownerId', '==', ownerId)), (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));
    const unsubD = onSnapshot(query(collection(db, 'drivers'), where('ownerId', '==', ownerId)), (s) => setDrivers(s.docs.map(d => ({ id: d.id, ...d.data() } as Driver))));
    const unsubP = onSnapshot(query(collection(db, 'payments'), where('ownerId', '==', ownerId)), (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() } as Payment))));
    const unsubM = onSnapshot(query(collection(db, 'maintenances'), where('ownerId', '==', ownerId)), (s) => setMaintenances(s.docs.map(d => ({ id: d.id, ...d.data() } as Maintenance))));
    const unsubC = onSnapshot(query(collection(db, 'contracts'), where('ownerId', '==', ownerId)), (s) => {
      setContracts(s.docs.map(d => ({ id: d.id, ...d.data() } as Contract)));
      setLoading(false);
    });

    return () => {
      unsubV(); unsubD(); unsubP(); unsubM(); unsubC();
    };
  }, []);

  return { vehicles, drivers, payments, maintenances, contracts, loading };
}
