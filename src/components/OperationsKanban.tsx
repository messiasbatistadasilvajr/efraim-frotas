import React, { useState, useEffect } from 'react';
import { 
  Kanban, 
  Plus, 
  Search, 
  Filter, 
  Car, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  FileText, 
  ShieldAlert, 
  CheckSquare, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  DollarSign,
  Tag,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { OperationalTask } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function OperationsKanban() {
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<OperationalTask | null>(null);

  // New Task Form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    vehiclePlate: '',
    driverName: '',
    assignee: 'Oficina Central Efraim',
    category: 'manutencao' as OperationalTask['category'],
    priority: 'medium' as OperationalTask['priority'],
    estimatedCost: 0,
    dueDate: '',
    columnId: 'todo' as OperationalTask['columnId'],
    subtaskText: '',
    subtasks: [] as { id: string; title: string; completed: boolean }[]
  });

  const mockTasks: OperationalTask[] = [
    {
      id: 'task-1',
      code: 'DEM-2026-08',
      title: 'Troca de pastilhas e óleo dos 50.000 km',
      description: 'Veículo atingiu a quilometragem da revisão preventiva. Trocar pastilhas dianteiras e óleo sintético 5W30.',
      columnId: 'in_progress',
      priority: 'high',
      vehicleId: 'veh-1',
      vehiclePlate: 'EFR-9A12',
      driverName: 'Thiago Martins',
      assignee: 'Auto Center Efraim (Mecânico Marcos)',
      category: 'manutencao',
      dueDate: '2026-07-31',
      estimatedCost: 380,
      tags: ['Preventiva', 'Óleo', 'Freios'],
      subtasks: [
        { id: 'st-1', title: 'Verificar alinhamento e balanceamento', completed: true },
        { id: 'st-2', title: 'Substituição do filtro de combustível', completed: false },
        { id: 'st-3', title: 'Carimbo no manual de manutenção', completed: false }
      ],
      createdAt: '2026-07-28',
      ownerId: 'demo-manager'
    },
    {
      id: 'task-2',
      code: 'DEM-2026-09',
      title: 'Renovação e Emissão de CRLV 2026 (IPVA Cota 3)',
      description: 'Emitir comprovante de licenciamento atualizado para disponibilizar no App do Motorista.',
      columnId: 'todo',
      priority: 'medium',
      vehicleId: 'veh-2',
      vehiclePlate: 'ABC-1234',
      driverName: 'João Silva',
      assignee: 'Setor de Documentação',
      category: 'documentacao',
      dueDate: '2026-08-05',
      estimatedCost: 160,
      tags: ['Licenciamento', 'IPVA'],
      subtasks: [
        { id: 'st-[#]', title: 'Pagar taxa no Banco do Brasil via chave PIX', completed: true },
        { id: 'st-[##]', title: 'Baixar PDF do CRLV no Detran', completed: false }
      ],
      createdAt: '2026-07-29',
      ownerId: 'demo-manager'
    },
    {
      id: 'task-3',
      code: 'DEM-2026-10',
      title: 'Vistoria Cautelar de Devolução e Higienização',
      description: 'Contrato encerrado. Executar checklist cautelar de pintura e estofamento.',
      columnId: 'review',
      priority: 'urgent',
      vehicleId: 'veh-3',
      vehiclePlate: 'XYZ-5678',
      driverName: 'Carlos Eduardo',
      assignee: 'Vistoriador Ricardo',
      category: 'vistoria',
      dueDate: '2026-07-30',
      estimatedCost: 120,
      tags: ['Vistoria', 'Higienização'],
      subtasks: [
        { id: 'st-a', title: 'Fotos em alta resolução dos 4 cantos', completed: true },
        { id: 'st-b', title: 'Checar estepe, macaco e chave de roda', completed: true },
        { id: 'st-c', title: 'Assinatura do termo de encerramento', completed: false }
      ],
      createdAt: '2026-07-27',
      ownerId: 'demo-manager'
    },
    {
      id: 'task-4',
      code: 'DEM-2026-11',
      title: 'Reparo de Avaria em Parachoque (Colisão Laranja)',
      description: 'Pequeno arranhão no parachoque dianteiro informado pelo motorista.',
      columnId: 'backlog',
      priority: 'low',
      vehicleId: 'veh-4',
      vehiclePlate: 'KLR-9090',
      driverName: 'Mariana Lima',
      assignee: 'Funilaria Express',
      category: 'sinistro',
      dueDate: '2026-08-10',
      estimatedCost: 250,
      tags: ['Funilaria', 'Franquia'],
      subtasks: [
        { id: 'st-10', title: 'Orçamento com funileiro credenciado', completed: false }
      ],
      createdAt: '2026-07-29',
      ownerId: 'demo-manager'
    },
    {
      id: 'task-5',
      code: 'DEM-2026-07',
      title: 'Instalação de Kit Rastreador GPS de Precisão',
      description: 'Veículo novo incorporado à frota. Rastreador com bloqueio remoto instalado com sucesso.',
      columnId: 'done',
      priority: 'high',
      vehicleId: 'veh-5',
      vehiclePlate: 'MNO-3344',
      driverName: 'Rodrigo Mendonça',
      assignee: 'Técnico de Telemetria',
      category: 'manutencao',
      dueDate: '2026-07-26',
      estimatedCost: 220,
      tags: ['GPS', 'Segurança'],
      subtasks: [
        { id: 'st-z1', title: 'Testar sinal no mapa ao vivo', completed: true },
        { id: 'st-z2', title: 'Cadastrar no aplicativo Efraim', completed: true }
      ],
      createdAt: '2026-07-25',
      ownerId: 'demo-manager'
    }
  ];

  const columns: { id: OperationalTask['columnId']; title: string; color: string; bg: string }[] = [
    { id: 'backlog', title: 'Backlog / Solicitações', color: 'text-slate-500', bg: 'border-t-slate-500' },
    { id: 'todo', title: 'A Fazer / Aprovadas', color: 'text-blue-500', bg: 'border-t-blue-500' },
    { id: 'in_progress', title: 'Em Andamento / Oficina', color: 'text-amber-500', bg: 'border-t-amber-500' },
    { id: 'review', title: 'Vistoria & Teste de Rota', color: 'text-indigo-500', bg: 'border-t-indigo-500' },
    { id: 'done', title: 'Concluído & Liberado', color: 'text-emerald-500', bg: 'border-t-emerald-500' }
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      const uid = user?.uid || 'demo-manager';
      const q = query(collection(db, 'operational_tasks'), where('ownerId', '==', uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        setTasks(mockTasks);
      } else {
        const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as OperationalTask));
        setTasks(list);
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveColumn = async (taskId: string, targetCol: OperationalTask['columnId']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, columnId: targetCol } : t));
    try {
      await updateDoc(doc(db, 'operational_tasks', taskId), { columnId: targetCol });
    } catch (e) {
      console.warn('Updated state locally:', e);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubs = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        return { ...t, subtasks: updatedSubs };
      }
      return t;
    }));

    if (selectedTaskDetails && selectedTaskDetails.id === taskId) {
      setSelectedTaskDetails(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      });
    }

    try {
      const taskObj = tasks.find(t => t.id === taskId);
      if (taskObj) {
        const updatedSubs = taskObj.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        await updateDoc(doc(db, 'operational_tasks', taskId), { subtasks: updatedSubs });
      }
    } catch (e) {
      console.warn('Subtask state saved locally');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const user = auth.currentUser;
      const uid = user?.uid || 'demo-manager';
      const code = `DEM-2026-${String(tasks.length + 12).padStart(2, '0')}`;

      const created: Omit<OperationalTask, 'id'> = {
        code,
        title: newTask.title,
        description: newTask.description,
        columnId: newTask.columnId,
        priority: newTask.priority,
        vehiclePlate: newTask.vehiclePlate,
        driverName: newTask.driverName,
        assignee: newTask.assignee,
        category: newTask.category,
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        estimatedCost: Number(newTask.estimatedCost),
        tags: [newTask.category.toUpperCase()],
        subtasks: newTask.subtasks,
        createdAt: new Date().toISOString().split('T')[0],
        ownerId: uid
      };

      const docRef = await addDoc(collection(db, 'operational_tasks'), created);
      setTasks(prev => [{ id: docRef.id, ...created }, ...prev]);
      setShowModal(false);

      // Reset
      setNewTask({
        title: '',
        description: '',
        vehiclePlate: '',
        driverName: '',
        assignee: 'Oficina Central Efraim',
        category: 'manutencao',
        priority: 'medium',
        estimatedCost: 0,
        dueDate: '',
        columnId: 'todo',
        subtaskText: '',
        subtasks: []
      });
    } catch (e) {
      console.error('Error adding task:', e);
      const localTask: OperationalTask = {
        id: `task-${Date.now()}`,
        code: `DEM-2026-${String(tasks.length + 12).padStart(2, '0')}`,
        title: newTask.title,
        description: newTask.description,
        columnId: newTask.columnId,
        priority: newTask.priority,
        vehiclePlate: newTask.vehiclePlate,
        driverName: newTask.driverName,
        assignee: newTask.assignee,
        category: newTask.category,
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        estimatedCost: Number(newTask.estimatedCost),
        tags: [newTask.category.toUpperCase()],
        subtasks: newTask.subtasks,
        createdAt: new Date().toISOString().split('T')[0],
        ownerId: 'demo-manager'
      };
      setTasks(prev => [localTask, ...prev]);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtaskDraft = () => {
    if (!newTask.subtaskText.trim()) return;
    setNewTask(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: `st-${Date.now()}`, title: prev.subtaskText.trim(), completed: false }],
      subtaskText: ''
    }));
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.vehiclePlate && t.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const getPriorityBadge = (p: OperationalTask['priority']) => {
    switch (p) {
      case 'urgent':
        return <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Urgente</span>;
      case 'high':
        return <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Alta</span>;
      case 'medium':
        return <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Média</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-600 border border-slate-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Baixa</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-line shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Kanban className="text-accent" size={24} />
            <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Kanban de Demandas e Ordens de Serviço</h1>
          </div>
          <p className="text-xs text-subtle">
            Gerencie o fluxo completo de revisões, sinistros, documentações e vistorias cautelares em estilo Kanban com checklists integrados.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20 transition-all shrink-0"
        >
          <Plus size={16} />
          Nova Ordem / Demanda
        </button>
      </div>

      {/* Filters & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            placeholder="Filtrar por placa, código ou título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-line rounded-xl text-xs text-ink placeholder-subtle focus:outline-none focus:border-accent transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-line rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-accent"
          >
            <option value="all">Todas as Categorias</option>
            <option value="manutencao">🔧 Manutenção</option>
            <option value="sinistro">🚨 Sinistros / Avarias</option>
            <option value="documentacao">📄 Documentação / IPVA</option>
            <option value="vistoria">📋 Vistoria Cautelar</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface border border-line rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-accent"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">🔴 Urgente</option>
            <option value="high">🟡 Alta</option>
            <option value="medium">🔵 Média</option>
            <option value="low">⚪ Baixa</option>
          </select>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start min-h-[600px] overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.columnId === col.id);
          const totalCost = colTasks.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

          return (
            <div 
              key={col.id} 
              className={cn(
                "bg-surface rounded-2xl border border-line p-4 space-y-4 border-t-4 flex flex-col h-full min-w-[260px]",
                col.bg
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className={cn("font-bold text-xs uppercase tracking-wider", col.color)}>
                    {col.title}
                  </span>
                  <span className="bg-bg text-ink text-[10px] font-bold px-2 py-0.5 rounded-full border border-line">
                    {colTasks.length}
                  </span>
                </div>
                {totalCost > 0 && (
                  <span className="text-[10px] font-mono font-bold text-subtle">
                    {formatCurrency(totalCost)}
                  </span>
                )}
              </div>

              {/* Task Cards Container */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-subtle border border-dashed border-line rounded-xl">
                    Nenhuma demanda nesta coluna
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const completedSubtasksCount = task.subtasks.filter(s => s.completed).length;

                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl bg-bg border border-line hover:border-accent/40 shadow-sm transition-all space-y-3 group cursor-pointer"
                        onClick={() => setSelectedTaskDetails(task)}
                      >
                        {/* Header Badge Row */}
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono text-[10px] text-subtle font-bold bg-surface px-2 py-0.5 rounded border border-line">
                            {task.code}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors leading-snug">
                          {task.title}
                        </h4>

                        {/* Vehicle & Driver Chips */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-subtle">
                          {task.vehiclePlate && (
                            <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-line font-mono font-bold text-ink">
                              <Car size={10} className="text-accent" />
                              {task.vehiclePlate}
                            </span>
                          )}
                          {task.driverName && (
                            <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-line">
                              <User size={10} />
                              {task.driverName}
                            </span>
                          )}
                        </div>

                        {/* Subtasks progress bar */}
                        {task.subtasks.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold text-subtle">
                              <span>Checklist: {completedSubtasksCount}/{task.subtasks.length}</span>
                              <span>{Math.round((completedSubtasksCount / task.subtasks.length) * 100)}%</span>
                            </div>
                            <div className="w-full bg-line h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full transition-all duration-300"
                                style={{ width: `${(completedSubtasksCount / task.subtasks.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Footer details */}
                        <div className="flex items-center justify-between pt-2 border-t border-line text-[10px] text-subtle">
                          <span className="font-bold text-ink">
                            {task.estimatedCost ? formatCurrency(task.estimatedCost) : 'Gratuito'}
                          </span>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {col.id !== 'backlog' && (
                              <button
                                onClick={() => {
                                  const idx = columns.findIndex(c => c.id === col.id);
                                  if (idx > 0) handleMoveColumn(task.id, columns[idx - 1].id);
                                }}
                                className="p-1 hover:bg-surface rounded text-subtle hover:text-ink"
                                title="Mover para esquerda"
                              >
                                <ChevronLeft size={14} />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={() => {
                                  const idx = columns.findIndex(c => c.id === col.id);
                                  if (idx < columns.length - 1) handleMoveColumn(task.id, columns[idx + 1].id);
                                }}
                                className="p-1 hover:bg-surface rounded text-subtle hover:text-accent font-bold"
                                title="Mover para direita"
                              >
                                <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW TASK MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-xl rounded-2xl border border-line overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-line flex items-center justify-between bg-bg">
              <div className="flex items-center gap-2">
                <Kanban className="text-accent" size={20} />
                <h3 className="font-display font-bold text-lg text-ink">Nova Demanda / Ordem de Serviço</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-surface rounded-lg text-subtle hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Título da Ordem de Serviço</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de Pneus e Alinhamento 3D"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Placa do Veículo</label>
                  <input
                    type="text"
                    placeholder="Ex: EFR-9A12"
                    value={newTask.vehiclePlate}
                    onChange={(e) => setNewTask({ ...newTask, vehiclePlate: e.target.value })}
                    className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink font-mono focus:outline-none focus:border-accent uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Motorista Responsável</label>
                  <input
                    type="text"
                    placeholder="Ex: Thiago Martins"
                    value={newTask.driverName}
                    onChange={(e) => setNewTask({ ...newTask, driverName: e.target.value })}
                    className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Categoria</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}
                    className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="manutencao">Manutenção</option>
                    <option value="sinistro">Sinistro / Avaria</option>
                    <option value="documentacao">Documentação</option>
                    <option value="vistoria">Vistoria</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Prioridade</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">🔴 Urgente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    value={newTask.estimatedCost}
                    onChange={(e) => setNewTask({ ...newTask, estimatedCost: Number(e.target.value) })}
                    className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink font-bold focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Descrição da Demanda</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes sobre o problema ou revisão solicitada..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              {/* Subtasks Creator */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">Checklist de Itens a Verificar</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar item da vistoria..."
                    value={newTask.subtaskText}
                    onChange={(e) => setNewTask({ ...newTask, subtaskText: e.target.value })}
                    className="flex-1 p-2 bg-bg border border-line rounded-lg text-xs text-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskDraft}
                    className="px-3 py-2 bg-accent/10 text-accent font-bold text-xs rounded-lg hover:bg-accent/20"
                  >
                    + Adicionar
                  </button>
                </div>

                {newTask.subtasks.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {newTask.subtasks.map((st, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-bg p-2 rounded border border-line">
                        <span>• {st.title}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 shadow-md"
                >
                  Criar Ordem no Kanban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS MODAL WITH CHECKLIST INTERACTIVITY */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-xl rounded-2xl border border-line overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-line flex items-center justify-between bg-bg">
              <div className="space-y-1">
                <span className="font-mono text-xs font-bold text-accent">{selectedTaskDetails.code}</span>
                <h3 className="font-display font-bold text-base text-ink">{selectedTaskDetails.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedTaskDetails(null)}
                className="p-2 hover:bg-surface rounded-lg text-subtle hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-subtle leading-relaxed bg-bg p-3 rounded-xl border border-line">
                {selectedTaskDetails.description}
              </p>

              {/* Subtasks checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                  <CheckSquare size={16} className="text-emerald-500" />
                  Checklist de Verificação Operacional
                </h4>

                <div className="space-y-2">
                  {selectedTaskDetails.subtasks.map((st) => (
                    <div 
                      key={st.id}
                      onClick={() => handleToggleSubtask(selectedTaskDetails.id, st.id)}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer",
                        st.completed 
                          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800" 
                          : "bg-bg border-line text-ink hover:border-accent/40"
                      )}
                    >
                      <input 
                        type="checkbox" 
                        checked={st.completed}
                        readOnly
                        className="rounded accent-emerald-500 w-4 h-4 cursor-pointer" 
                      />
                      <span className={cn("text-xs font-medium", st.completed && "line-through opacity-70")}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Move column action */}
              <div className="pt-4 border-t border-line flex justify-between items-center text-xs">
                <span className="text-subtle">Mover status:</span>
                <div className="flex items-center gap-2">
                  {columns.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        handleMoveColumn(selectedTaskDetails.id, c.id);
                        setSelectedTaskDetails(prev => prev ? { ...prev, columnId: c.id } : null);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all",
                        selectedTaskDetails.columnId === c.id ? "bg-accent text-white" : "bg-bg text-subtle hover:text-ink border border-line"
                      )}
                    >
                      {c.title.split('/')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
