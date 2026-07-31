import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Search, AlertCircle, Clock, CheckCircle2, MoreVertical, Trash2, Edit3, ChevronRight, CornerDownRight, Flag } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { useFleetData } from '../hooks/useFleetData';
import { Issue } from '../types';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Issues() {
  const { issues, vehicles, drivers, loading } = useFleetData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open' as Issue['status'],
    priority: 'medium' as Issue['priority'],
    vehicleId: '',
    driverId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const data = {
      ...formData,
      parentId: parentId || null,
      ownerId: auth.currentUser.uid,
      date: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingIssue) {
        await updateDoc(doc(db, 'issues', editingIssue.id), data);
      } else {
        await addDoc(collection(db, 'issues'), data);
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving issue:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      vehicleId: '',
      driverId: ''
    });
    setEditingIssue(null);
    setParentId(undefined);
  };

  const openAddSubIssue = (id: string) => {
    resetForm();
    setParentId(id);
    setShowModal(true);
  };

  const filteredIssues = issues.filter(i => 
    !i.parentId && // Only top-level issues for the main list
    (i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     i.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSubIssues = (id: string) => issues.filter(i => i.parentId === id);

  const getPriorityColor = (p: Issue['priority']) => {
    switch (p) {
      case 'urgent': return 'text-danger bg-danger/10 border-danger/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-subtle bg-bg border-line';
    }
  };

  const getStatusIcon = (s: Issue['status']) => {
    switch (s) {
      case 'open': return <AlertCircle size={16} className="text-danger" />;
      case 'in_progress': return <Clock size={16} className="text-warning" />;
      case 'resolved': return <CheckCircle2 size={16} className="text-accent" />;
      case 'closed': return <CheckCircle2 size={16} className="text-subtle" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-subtle">Carregando ocorrências...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold">Ocorrências e Tarefas</h2>
          <p className="text-subtle text-[14px]">Gerencie problemas, manutenções e pendências da frota.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={20} /> Nova Ocorrência
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={20} />
        <input 
          type="text" 
          placeholder="Buscar ocorrências..." 
          className="input pl-10 h-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="panel p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-line mb-4" />
            <h3 className="text-[18px] font-bold">Nenhuma ocorrência encontrada</h3>
            <p className="text-subtle">Comece registrando um novo problema ou tarefa.</p>
          </div>
        ) : (
          filteredIssues.map(issue => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              subIssues={getSubIssues(issue.id)}
              onEdit={() => { setEditingIssue(issue); setFormData(issue); setShowModal(true); }}
              onDelete={() => deleteDoc(doc(db, 'issues', issue.id))}
              onAddSub={() => openAddSubIssue(issue.id)}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
              vehicles={vehicles}
              drivers={drivers}
            />
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface w-full max-w-lg rounded-[20px] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-line flex justify-between items-center">
              <h3 className="text-[18px] font-bold">
                {editingIssue ? 'Editar Ocorrência' : parentId ? 'Criar Sub-ocorrência' : 'Nova Ocorrência'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-subtle hover:text-ink">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] font-bold uppercase tracking-widest text-subtle">Título</label>
                <input 
                  required
                  className="input" 
                  placeholder="Ex: Barulho no freio"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold uppercase tracking-widest text-subtle">Descrição</label>
                <textarea 
                  className="input min-h-[100px] py-2" 
                  placeholder="Detalhes da ocorrência..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-subtle">Prioridade</label>
                  <select 
                    className="input"
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as any})}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-subtle">Status</label>
                  <select 
                    className="input"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="open">Aberta</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="resolved">Resolvida</option>
                    <option value="closed">Fechada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-subtle">Veículo (Opcional)</label>
                  <select 
                    className="input"
                    value={formData.vehicleId}
                    onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                  >
                    <option value="">Nenhum</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-subtle">Motorista (Opcional)</label>
                  <select 
                    className="input"
                    value={formData.driverId}
                    onChange={e => setFormData({...formData, driverId: e.target.value})}
                  >
                    <option value="">Nenhum</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full h-12 text-[14px]">
                {editingIssue ? 'Salvar Alterações' : 'Criar Ocorrência'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue, subIssues, onEdit, onDelete, onAddSub, getPriorityColor, getStatusIcon, vehicles, drivers }: any) {
  const [expanded, setExpanded] = useState(false);
  const vehicle = vehicles.find((v: any) => v.id === issue.vehicleId);
  const driver = drivers.find((d: any) => d.id === issue.driverId);

  return (
    <div className="panel overflow-hidden border-l-4" style={{ borderLeftColor: issue.priority === 'urgent' ? 'var(--color-danger)' : issue.priority === 'high' ? '#f97316' : issue.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-line)' }}>
      <div className="p-4 flex items-start gap-4">
        <div className="mt-1">{getStatusIcon(issue.status)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-[16px] truncate">{issue.title}</h4>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", getPriorityColor(issue.priority))}>
              {issue.priority}
            </span>
          </div>
          <p className="text-subtle text-[13px] line-clamp-1 mb-2">{issue.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-subtle font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(issue.date)}</span>
            {vehicle && <span className="flex items-center gap-1 font-bold text-ink bg-bg px-2 py-0.5 rounded border border-line">{vehicle.plate}</span>}
            {driver && <span className="flex items-center gap-1 font-bold text-ink bg-bg px-2 py-0.5 rounded border border-line">{driver.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onAddSub} className="p-2 hover:bg-bg rounded-lg text-accent transition-colors" title="Adicionar sub-tarefa">
            <CornerDownRight size={18} />
          </button>
          <button onClick={onEdit} className="p-2 hover:bg-bg rounded-lg text-subtle hover:text-ink transition-colors">
            <Edit3 size={18} />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-bg rounded-lg text-danger opacity-50 hover:opacity-100 transition-colors">
            <Trash2 size={18} />
          </button>
          {subIssues.length > 0 && (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className={cn("p-2 hover:bg-bg rounded-lg transition-all", expanded && "rotate-90")}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && subIssues.length > 0 && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-line bg-bg/50 px-4 py-2 space-y-2"
          >
            {subIssues.map((sub: any) => (
              <div key={sub.id} className="flex items-center gap-3 py-2 pl-6 border-l-2 border-line ml-2">
                <div className="w-1.5 h-1.5 rounded-full bg-subtle" />
                <div className="flex-1 min-w-0">
                  <h5 className="text-[14px] font-bold flex items-center gap-2">
                    {sub.title}
                    {getStatusIcon(sub.status)}
                  </h5>
                  <p className="text-[12px] text-subtle truncate">{sub.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
