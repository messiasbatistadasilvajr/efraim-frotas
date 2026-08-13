import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Download, 
  Search, 
  Filter, 
  DollarSign, 
  User, 
  Car, 
  Calendar, 
  Share2, 
  ExternalLink,
  ShieldCheck,
  Printer,
  Sparkles,
  ChevronRight,
  Eye,
  Bell,
  Volume2
} from 'lucide-react';
import { CommercialProposal } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { triggerNewProposalAlert, simulateIncomingProposal } from '../lib/proposalNotificationService';

export function ProposalsManager() {
  const [proposals, setProposals] = useState<CommercialProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [viewingProposal, setViewingProposal] = useState<CommercialProposal | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientCpfCnpj: '',
    clientEmail: '',
    clientPhone: '',
    vehicleCategory: 'Sedan Conforto',
    weeklyRate: 690,
    securityDeposit: 900,
    minimumPeriodWeeks: 12,
    kmAllowancePerWeek: 1500,
    validUntilDays: 7,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  // Default Mock Data if Firestore is empty
  const initialMockProposals: CommercialProposal[] = [
    {
      id: 'prop-101',
      proposalNumber: 'PROP-2026-001',
      clientName: 'Carlos Eduardo Santos',
      clientCpfCnpj: '342.198.508-11',
      clientEmail: 'carlos.santos@gmail.com',
      clientPhone: '(11) 97123-8844',
      vehicleCategory: 'Sedan Conforto (Onix Plus / Cronos)',
      weeklyRate: 690,
      securityDeposit: 900,
      minimumPeriodWeeks: 12,
      kmAllowancePerWeek: 1750,
      status: 'accepted',
      createdAt: '2026-07-25',
      validUntil: '2026-08-01',
      signedAt: '2026-07-26 14:32:00',
      signedIp: '177.12.89.201',
      notes: 'Motorista aprovado na análise cadastral da Uber. Veículo com Kit GNV incluso.',
      ownerId: 'demo-manager'
    },
    {
      id: 'prop-102',
      proposalNumber: 'PROP-2026-002',
      clientName: 'Mariana Lima Barbosa',
      clientCpfCnpj: '411.092.338-77',
      clientEmail: 'mariana.barbosa@outlook.com',
      clientPhone: '(11) 98844-3322',
      vehicleCategory: 'Compacto Econômico (HB20 / Argo)',
      weeklyRate: 590,
      securityDeposit: 800,
      minimumPeriodWeeks: 8,
      kmAllowancePerWeek: 1500,
      status: 'sent',
      createdAt: '2026-07-28',
      validUntil: '2026-08-04',
      notes: 'Aguardando aceite digital pelo link WhatsApp enviado via n8n.',
      ownerId: 'demo-manager'
    },
    {
      id: 'prop-103',
      proposalNumber: 'PROP-2026-003',
      clientName: 'Rodrigo Mendonça',
      clientCpfCnpj: '289.441.908-00',
      clientEmail: 'rodrigo.mendonca@gmail.com',
      clientPhone: '(11) 96555-1212',
      vehicleCategory: 'Premium Executivo (Corolla / Sentra)',
      weeklyRate: 890,
      securityDeposit: 1200,
      minimumPeriodWeeks: 24,
      kmAllowancePerWeek: 2000,
      status: 'draft',
      createdAt: '2026-07-29',
      validUntil: '2026-08-05',
      notes: 'Draft para locação corporativa de longa duração com manutenção VIP.',
      ownerId: 'demo-manager'
    }
  ];

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      const uid = user?.uid || 'demo-manager';
      const q = query(collection(db, 'commercial_proposals'), where('ownerId', '==', uid));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setProposals(initialMockProposals);
      } else {
        const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CommercialProposal));
        setProposals(list);
      }
    } catch (e) {
      console.error('Error fetching proposals:', e);
      setProposals(initialMockProposals);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const user = auth.currentUser;
      const uid = user?.uid || 'demo-manager';
      const count = proposals.length + 1;
      const numStr = String(count).padStart(3, '0');
      const today = new Date();
      const validUntilDate = new Date();
      validUntilDate.setDate(today.getDate() + formData.validUntilDays);

      const newProp: Omit<CommercialProposal, 'id'> = {
        proposalNumber: `PROP-2026-${numStr}`,
        clientName: formData.clientName,
        clientCpfCnpj: formData.clientCpfCnpj,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        vehicleCategory: formData.vehicleCategory,
        weeklyRate: Number(formData.weeklyRate),
        securityDeposit: Number(formData.securityDeposit),
        minimumPeriodWeeks: Number(formData.minimumPeriodWeeks),
        kmAllowancePerWeek: Number(formData.kmAllowancePerWeek),
        status: 'sent',
        createdAt: today.toISOString().split('T')[0],
        validUntil: validUntilDate.toISOString().split('T')[0],
        notes: formData.notes,
        ownerId: uid
      };

      const docRef = await addDoc(collection(db, 'commercial_proposals'), newProp);
      const createdItem: CommercialProposal = { id: docRef.id, ...newProp };
      
      setProposals(prev => [createdItem, ...prev]);
      setShowModal(false);

      // Trigger Mercado Livre style sound & speech notification
      triggerNewProposalAlert({
        id: createdItem.id,
        clientName: createdItem.clientName,
        vehicleCategory: createdItem.vehicleCategory,
        weeklyRate: createdItem.weeklyRate,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        phone: createdItem.clientPhone
      });
      
      // Reset Form
      setFormData({
        clientName: '',
        clientCpfCnpj: '',
        clientEmail: '',
        clientPhone: '',
        vehicleCategory: 'Sedan Conforto',
        weeklyRate: 690,
        securityDeposit: 900,
        minimumPeriodWeeks: 12,
        kmAllowancePerWeek: 1500,
        validUntilDays: 7,
        notes: ''
      });
    } catch (e) {
      console.error('Error adding proposal:', e);
      // Fallback local update
      const localProp: CommercialProposal = {
        id: `prop-${Date.now()}`,
        proposalNumber: `PROP-2026-${String(proposals.length + 1).padStart(3, '0')}`,
        clientName: formData.clientName,
        clientCpfCnpj: formData.clientCpfCnpj,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        vehicleCategory: formData.vehicleCategory,
        weeklyRate: Number(formData.weeklyRate),
        securityDeposit: Number(formData.securityDeposit),
        minimumPeriodWeeks: Number(formData.minimumPeriodWeeks),
        kmAllowancePerWeek: Number(formData.kmAllowancePerWeek),
        status: 'sent',
        createdAt: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: formData.notes,
        ownerId: 'demo-manager'
      };
      setProposals(prev => [localProp, ...prev]);
      setShowModal(false);

      triggerNewProposalAlert({
        id: localProp.id,
        clientName: localProp.clientName,
        vehicleCategory: localProp.vehicleCategory,
        weeklyRate: localProp.weeklyRate,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        phone: localProp.clientPhone
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: CommercialProposal['status']) => {
    try {
      await updateDoc(doc(db, 'commercial_proposals', id), {
        status: newStatus,
        ...(newStatus === 'accepted' ? { signedAt: new Date().toISOString().replace('T', ' ').substring(0, 19), signedIp: '189.40.102.14' } : {})
      });
    } catch (e) {
      console.warn('Updated state locally:', e);
    }
    setProposals(prev => prev.map(p => p.id === id ? { 
      ...p, 
      status: newStatus, 
      ...(newStatus === 'accepted' ? { signedAt: new Date().toISOString().replace('T', ' ').substring(0, 19), signedIp: '189.40.102.14' } : {}) 
    } : p));
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.clientPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CommercialProposal['status']) => {
    switch(status) {
      case 'accepted':
        return (
          <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} /> Assinada & Aceita
          </span>
        );
      case 'sent':
        return (
          <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Send size={12} /> Enviada ao Cliente
          </span>
        );
      case 'draft':
        return (
          <span className="bg-slate-500/10 text-slate-600 border border-slate-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} /> Rascunho
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <XCircle size={12} /> Recusada
          </span>
        );
      case 'expired':
        return (
          <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} /> Expirada
          </span>
        );
    }
  };

  const handleShareWhatsApp = (p: CommercialProposal) => {
    const msg = `Olá ${p.clientName}, segue a proposta comercial de locação de veículo da *Efraim Frotas*:\n\n` +
                `📋 *Número:* ${p.proposalNumber}\n` +
                `🚗 *Categoria:* ${p.vehicleCategory}\n` +
                `💰 *Aluguel Semanal:* ${formatCurrency(p.weeklyRate)}\n` +
                `🛡️ *Caução:* ${formatCurrency(p.securityDeposit)}\n` +
                `📅 *Período Mínimo:* ${p.minimumPeriodWeeks} semanas\n` +
                `⏳ *Validade:* ${new Date(p.validUntil + 'T00:00:00').toLocaleDateString('pt-BR')}\n\n` +
                `Acesse o link abaixo para visualizar e assinar digitalmente:\nhttps://efraim-frotas.app/proposta/${p.proposalNumber}`;
    window.open(`https://api.whatsapp.com/send?phone=55${p.clientPhone.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-line shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="text-accent" size={24} />
            <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Propostas Comerciais & Orçamentos Digitais</h1>
          </div>
          <p className="text-xs text-subtle">
            Crie, envie via WhatsApp/Email e acompanhe assinaturas digitais com validade jurídica antes da formalização do contrato.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => simulateIncomingProposal()}
            className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl shadow-md transition-all uppercase tracking-wider"
            title="Simula chegada de proposta de aluguel de carro com som de campainha e aviso em voz alta"
          >
            <Bell size={16} className="animate-bounce" />
            <span>Testar Alerta (Som + Voz)</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20 transition-all"
          >
            <Plus size={16} />
            Nova Proposta Comercial
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 space-y-2 border-l-4 border-l-accent">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Total de Propostas</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-ink">{proposals.length}</span>
            <FileText size={18} className="text-accent" />
          </div>
          <span className="text-[11px] text-subtle">Orçamentos gerados</span>
        </div>

        <div className="panel p-5 space-y-2 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Aceitas & Assinadas</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-emerald-600">
              {proposals.filter(p => p.status === 'accepted').length}
            </span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Prontas para virar Contrato</span>
        </div>

        <div className="panel p-5 space-y-2 border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Aguardando Resposta</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-blue-600">
              {proposals.filter(p => p.status === 'sent').length}
            </span>
            <Send size={18} className="text-blue-500" />
          </div>
          <span className="text-[11px] text-subtle">Enviadas ao cliente</span>
        </div>

        <div className="panel p-5 space-y-2 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">Valor Proposto Mensal</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-display font-bold text-ink">
              {formatCurrency(proposals.reduce((acc, p) => acc + (p.weeklyRate * 4.33), 0))}
            </span>
            <DollarSign size={18} className="text-amber-500" />
          </div>
          <span className="text-[11px] text-subtle">Potencial de faturamento</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            placeholder="Buscar por cliente, CPF ou número da proposta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-line rounded-xl text-xs text-ink placeholder-subtle focus:outline-none focus:border-accent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <Filter size={14} className="text-subtle shrink-0" />
          {['all', 'accepted', 'sent', 'draft', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 capitalize",
                statusFilter === status
                  ? "bg-accent text-white shadow-sm"
                  : "bg-surface text-subtle hover:text-ink border border-line"
              )}
            >
              {status === 'all' ? 'Todas' : status === 'accepted' ? 'Assinadas' : status === 'sent' ? 'Enviadas' : status === 'draft' ? 'Rascunhos' : 'Recusadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals List Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-subtle text-xs">Carregando propostas comerciais...</div>
        ) : filteredProposals.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText size={32} className="mx-auto text-subtle/50" />
            <p className="text-sm font-bold text-ink">Nenhuma proposta comercial encontrada</p>
            <p className="text-xs text-subtle">Crie orçamentos em segundos e envie diretamente via WhatsApp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-subtle font-bold uppercase text-[10px] tracking-wider border-b border-line">
                <tr>
                  <th className="px-5 py-3.5">Número & Data</th>
                  <th className="px-5 py-3.5">Cliente / Contato</th>
                  <th className="px-5 py-3.5">Categoria do Veículo</th>
                  <th className="px-5 py-3.5">Aluguel Semanal</th>
                  <th className="px-5 py-3.5">Caução</th>
                  <th className="px-5 py-3.5">Status Assinatura</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredProposals.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-4 font-mono">
                      <div className="font-bold text-ink">{item.proposalNumber}</div>
                      <div className="text-[10px] text-subtle">
                        Criada: {new Date(item.createdAt + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-ink">{item.clientName}</div>
                      <div className="text-[11px] text-subtle">{item.clientPhone} • {item.clientCpfCnpj}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium text-ink bg-bg px-2.5 py-1 rounded-md border border-line">
                        {item.vehicleCategory}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-accent text-sm">
                        {formatCurrency(item.weeklyRate)}
                      </span>
                      <span className="text-[10px] text-subtle block">/ semana</span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium text-ink">
                        {formatCurrency(item.securityDeposit)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(item.status)}
                      {item.signedAt && (
                        <div className="text-[9px] text-emerald-600 mt-1 font-mono">
                          IP: {item.signedIp} ({item.signedAt})
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingProposal(item)}
                          title="Visualizar Proposta / PDF"
                          className="p-2 hover:bg-bg rounded-lg text-subtle hover:text-ink transition-colors border border-line"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => handleShareWhatsApp(item)}
                          title="Enviar WhatsApp via n8n"
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg transition-colors border border-emerald-500/20"
                        >
                          <Send size={14} />
                        </button>

                        {item.status === 'sent' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'accepted')}
                            title="Simular Aceite Digital do Cliente"
                            className="px-2.5 py-1.5 bg-accent text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-accent/90"
                          >
                            Simular Aceite
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE NEW PROPOSAL MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl rounded-2xl border border-line overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-line flex items-center justify-between bg-bg">
              <div className="flex items-center gap-2">
                <FileText className="text-accent" size={20} />
                <h3 className="font-display font-bold text-lg text-ink">Nova Proposta Comercial de Locação</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-surface rounded-lg text-subtle hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="p-6 space-y-6 overflow-y-auto">
              {/* Client Info Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent border-b border-line pb-1">
                  1. Dados do Cliente / Motorista Prospectado
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Roberto Alves Ferreira"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">CPF / CNPJ</label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={formData.clientCpfCnpj}
                      onChange={(e) => setFormData({ ...formData, clientCpfCnpj: e.target.value })}
                      className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">WhatsApp (com DDD)</label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 98888-7777"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">E-mail</label>
                    <input
                      type="email"
                      required
                      placeholder="cliente@email.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle & Commercial Terms */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent border-b border-line pb-1">
                  2. Condições Comerciais do Veículo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs font-bold text-ink">Categoria do Veículo</label>
                    <select
                      value={formData.vehicleCategory}
                      onChange={(e) => {
                        const cat = e.target.value;
                        let rate = 690;
                        let deposit = 900;
                        if (cat.includes('Econômico')) { rate = 590; deposit = 800; }
                        if (cat.includes('Premium')) { rate = 890; deposit = 1200; }
                        setFormData({ ...formData, vehicleCategory: cat, weeklyRate: rate, securityDeposit: deposit });
                      }}
                      className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent font-bold"
                    >
                      <option value="Compacto Econômico (HB20 / Argo)">Compacto Econômico (HB20, Onix, Argo) - R$ 590/sem</option>
                      <option value="Sedan Conforto (Onix Plus / Cronos)">Sedan Conforto (Onix Plus, Cronos, Logan) - R$ 690/sem</option>
                      <option value="Premium Executivo (Corolla / Sentra)">Premium Executivo (Corolla, Sentra, Nivus) - R$ 890/sem</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Aluguel Semanal (R$)</label>
                    <input
                      type="number"
                      required
                      value={formData.weeklyRate}
                      onChange={(e) => setFormData({ ...formData, weeklyRate: Number(e.target.value) })}
                      className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink font-bold text-accent focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Caução (R$)</label>
                    <input
                      type="number"
                      required
                      value={formData.securityDeposit}
                      onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                      className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink font-bold focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Período Mínimo (Semanas)</label>
                    <input
                      type="number"
                      required
                      value={formData.minimumPeriodWeeks}
                      onChange={(e) => setFormData({ ...formData, minimumPeriodWeeks: Number(e.target.value) })}
                      className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Observações e Termos Especiais</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Veículo equipado com kit de gás (GNV), revisões totalmente inclusas..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-line text-xs font-bold text-subtle hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 shadow-md flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Gerar Proposta Comercial
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROPOSAL DIGITAL LETTER/PDF MODAL */}
      {viewingProposal && (
        <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-3xl rounded-2xl border border-line overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-line flex items-center justify-between bg-bg">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-600" />
                <span className="font-bold text-sm text-ink font-mono">{viewingProposal.proposalNumber} - Visualização de Proposta Digital</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-secondary text-xs font-bold px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Printer size={14} /> Imprimir / Salvar PDF
                </button>
                <button 
                  onClick={() => setViewingProposal(null)}
                  className="p-1.5 hover:bg-surface rounded-lg text-subtle hover:text-ink"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 space-y-8 overflow-y-auto bg-white text-slate-900 font-sans print:p-0">
              {/* Header Letterhead */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-display font-extrabold uppercase tracking-tight text-slate-900">
                    EFRAIM FROTAS
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Gestão Profissional de Frotas & Mobilidade Urbana</p>
                  <p className="text-[11px] text-slate-400">CNPJ: 48.912.833/0001-90 • Fortaleza - CE</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-block px-3 py-1 bg-slate-100 font-mono text-xs font-extrabold rounded text-slate-800 border">
                    {viewingProposal.proposalNumber}
                  </span>
                  <p className="text-[11px] text-slate-500">Emissão: {new Date(viewingProposal.createdAt + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  <p className="text-[11px] text-amber-600 font-bold">Válido até: {new Date(viewingProposal.validUntil + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Proposal Client Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PROSPECTO / CLIENTE:</span>
                  <p className="font-bold text-sm text-slate-900">{viewingProposal.clientName}</p>
                  <p className="text-xs text-slate-600">CPF/CNPJ: {viewingProposal.clientCpfCnpj}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CONTATO REGISTRADO:</span>
                  <p className="text-xs text-slate-800 font-medium">{viewingProposal.clientPhone}</p>
                  <p className="text-xs text-slate-600">{viewingProposal.clientEmail}</p>
                </div>
              </div>

              {/* Offer Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-2">
                  Especificações do Veículo & Condições Comerciais
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Categoria</span>
                    <p className="font-bold text-sm text-slate-900 mt-0.5">{viewingProposal.vehicleCategory}</p>
                  </div>

                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold">Aluguel Semanal</span>
                    <p className="font-extrabold text-xl text-emerald-600 mt-0.5">{formatCurrency(viewingProposal.weeklyRate)}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Caução de Segurança</span>
                    <p className="font-bold text-base text-slate-900 mt-0.5">{formatCurrency(viewingProposal.securityDeposit)}</p>
                  </div>
                </div>
              </div>

              {/* Benefits checklist */}
              <div className="space-y-2 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Incluso no valor da assinatura semanal:</p>
                <ul className="grid grid-cols-2 gap-2 text-[11px] list-disc pl-4">
                  <li>Manutenção preventiva e corretiva inclusa.</li>
                  <li>Seguro contra roubo, furto e terceiros.</li>
                  <li>Assistência 24h e socorro mecânico.</li>
                  <li>Isenção de IPVA e licenciamento para o condutor.</li>
                </ul>
              </div>

              {/* Digital Signature Audit Trail Box */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Validação da Assinatura Digital:</span>
                  {viewingProposal.status === 'accepted' ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">✓ Assinado Digitalmente</span>
                  ) : (
                    <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">Pendente de Assinatura</span>
                  )}
                </div>
                {viewingProposal.signedAt && (
                  <p className="text-[11px] font-mono text-slate-600">
                    Data/Hora: {viewingProposal.signedAt} • IP Registrado: {viewingProposal.signedIp}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
