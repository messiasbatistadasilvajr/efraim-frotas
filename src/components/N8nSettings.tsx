import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  HelpCircle, 
  Link2, 
  Check, 
  AlertCircle, 
  Play, 
  Trash2, 
  FileCode, 
  ExternalLink,
  DollarSign,
  Wrench,
  Activity,
  ArrowRight,
  Calendar,
  Layers,
  Database,
  Copy,
  Bell,
  Send,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { 
  getWebhookConfig, 
  saveWebhookConfig, 
  getWebhookLogs, 
  clearWebhookLogs, 
  triggerWebhook, 
  WebhookLog, 
  WebhookConfig 
} from '../lib/webhooks';
import { 
  generateActiveReminders, 
  sendWhatsAppReminder, 
  dispatchBatchReminders, 
  buildWhatsAppReminderPayload,
  ReminderItem 
} from '../lib/reminderService';
import { cn } from '../lib/utils';

export function N8nSettings() {
  const [config, setConfig] = useState<WebhookConfig>(getWebhookConfig());
  const [logs, setLogs] = useState<WebhookLog[]>(getWebhookLogs());
  const [isSaved, setIsSaved] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<'payment' | 'maintenance' | 'sheets' | 'reminders' | null>(null);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'reminders' | 'templates'>('config');
  const [selectedWorkflow, setSelectedWorkflow] = useState<'whatsapp' | 'calendar' | 'sheets' | 'reminders'>('whatsapp');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>(generateActiveReminders());
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);
  const [batchResult, setBatchResult] = useState<{ sent: number; failed: number } | null>(null);
  const [previewMsgId, setPreviewMsgId] = useState<string | null>(null);

  useEffect(() => {
    const handleLogsUpdate = () => {
      setLogs(getWebhookLogs());
    };
    window.addEventListener('efraim_n8n_logs_updated', handleLogsUpdate);
    return () => {
      window.removeEventListener('efraim_n8n_logs_updated', handleLogsUpdate);
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveWebhookConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopyClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleSendSingleReminder = async (item: ReminderItem) => {
    setSendingReminderId(item.id);
    const result = await sendWhatsAppReminder(item);
    setSendingReminderId(null);
    setReminders(generateActiveReminders());
    if (result.success) {
      setTestResult({
        type: 'success',
        message: `Lembrete enviado com sucesso para o WhatsApp de ${item.recipientName} (${item.recipientPhone}) via n8n!`
      });
    } else {
      setTestResult({
        type: 'error',
        message: `Falha ao enviar lembrete para ${item.recipientName}: ${result.error}`
      });
    }
  };

  const handleSendBatchReminders = async () => {
    setBatchSending(true);
    setBatchResult(null);
    const result = await dispatchBatchReminders(reminders);
    setBatchSending(false);
    setBatchResult(result);
    setReminders(generateActiveReminders());
  };

  const handleTestWebhook = async (type: 'payment' | 'maintenance' | 'sheets' | 'reminders') => {
    let url = '';
    if (type === 'payment') url = config.paymentUrl;
    else if (type === 'maintenance') url = config.maintenanceUrl;
    else if (type === 'sheets') url = config.sheetsUrl;
    else if (type === 'reminders') url = config.remindersUrl || config.paymentUrl;

    if (!url || !url.trim()) {
      setTestResult({
        type: 'error',
        message: `Insira uma URL para o webhook antes de testar.`
      });
      return;
    }

    setTestingWebhook(type);
    setTestResult(null);

    // Dynamic mock payloads to show actual n8n input structure
    let mockPayload: any = {};
    let eventName: WebhookLog['event'] = 'test';

    if (type === 'payment') {
      eventName = 'payment.created';
      mockPayload = {
        mock: true,
        id: "pay_test_a018f",
        driverId: "drv_messias_77",
        driverName: "Messias Ferreira Martins (Principal)",
        driverEmail: "messias.martins77@gmail.com",
        driverContact: "(11) 98765-4321",
        amount: 550.00,
        type: "weekly",
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        contractId: "ctr_active_39b"
      };
    } else if (type === 'maintenance') {
      eventName = 'maintenance.created';
      mockPayload = {
        mock: true,
        id: "maint_test_904",
        vehicleId: "veh_corolla_33",
        vehicleModel: "Toyota Corolla S",
        vehiclePlate: "EFR-9A12",
        vehicleColor: "Prata Grafite",
        type: "preventive",
        date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days in future
        km: 48500,
        cost: 480.00,
        description: "Revisão e regulagem de freios com troca de pastilhas dianteiras",
        workshopName: "Centro Automotivo Efraim Leste",
        isFutureDate: true,
        suggestedCalendarTitle: "Manutenção Preventiva: Toyota Corolla S (EFR-9A12)",
        managerEmail: "messiasbjunior76@gmail.com"
      };
    } else if (type === 'sheets') {
      eventName = 'transaction.created';
      mockPayload = {
        mock: true,
        id: "sheet_test_88f",
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        amount: 550.00,
        type: "CREDIT",
        category: "Aluguel Semanal",
        description: "Aporte financeiro recebido de Messias Ferreira Martins",
        driverName: "Messias Ferreira Martins (Principal)",
        driverEmail: "messias.martins77@gmail.com",
        driverContact: "(11) 98765-4321",
        vehicleModel: "Toyota Corolla S",
        vehiclePlate: "EFR-9A12"
      };
    } else if (type === 'reminders') {
      eventName = 'reminder.created';
      mockPayload = {
        mock: true,
        reminderId: "rem_test_cnh_99",
        type: "cnh_expiry",
        recipientName: "Messias Ferreira Martins",
        recipientPhone: "5511988887777",
        formattedPhone: "(11) 98888-7777",
        recipientRole: "motorista",
        title: "CNH Próxima ao Vencimento - Messias Ferreira Martins",
        description: "A CNH do motorista Messias vence em 3 dias.",
        dueDate: "02/08/2026",
        rawDueDate: "2026-08-02",
        daysRemaining: 3,
        severity: "critical",
        vehiclePlate: "EFR-9A12",
        vehicleModel: "Toyota Corolla S",
        messageText: "🔔 *EFRAIM GESTÃO DE FROTAS - LEMBRETE IMPORTANTE*\n\nOlá *Messias Ferreira Martins*,\n\n⚠️ Identificamos que a sua *CNH* está próxima do vencimento (02/08/2026).\nPor favor, providencie a renovação e envie a cópia atualizada para o nosso suporte."
      };
    }

    const res = await triggerWebhook(url, eventName, mockPayload);
    setTestingWebhook(null);

    if (res.success) {
      setTestResult({
        type: 'success',
        message: `Sucesso! O webhook de ${type === 'payment' ? 'Pagamentos' : type === 'maintenance' ? 'Manutenções' : type === 'sheets' ? 'Google Sheets' : 'Lembretes WhatsApp'} foi disparado corretamente para o n8n.`
      });
    } else {
      setTestResult({
        type: 'error',
        message: `Falha no envio para o n8n: ${res.error || 'Erro de rede ou URL inválida'}`
      });
    }
  };

  // Pre-configured workflow JSONs for n8n copy-paste
  const workflowsJSON = {
    whatsapp: JSON.stringify({
      "nodes": [
        {
          "parameters": {
            "httpMethod": "POST",
            "path": "efraim-whatsapp-receipt",
            "options": {}
          },
          "id": "19b8823f-bf83-4a0b-85fe-9b936e392ff1",
          "name": "Webhook Pagamento",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [250, 300]
        },
        {
          "parameters": {
            "method": "POST",
            "url": "https://api.evolution.com/message/sendText/instancia",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "apikey",
                  "value": "SUA_API_KEY_AQUI"
                }
              ]
            },
            "sendBody": true,
            "contentType": "json",
            "bodyParameters": {
              "parameters": [
                {
                  "name": "number",
                  "value": "={{ $json.body.data.driverContact.replace(/\\D/g, '') }}"
                },
                {
                  "name": "text",
                  "value": "=🧾 *EFRAIM GESTÃO DE FROTAS*\\n\\nOlá *{{ $json.body.data.driverName }}*, seu pagamento de aluguel/caução foi recebido com sucesso!\\n\\n💵 *Valor:* R$ {{ $json.body.data.amount.toFixed(2) }}\\n📅 *Data:* {{ $json.body.data.date }}\\n🗂️ *Categoria:* {{ $json.body.data.type === 'weekly' ? 'Mensalidade/Semanal' : 'Caução de Garantia' }}\\n\\nObrigado pela parceria! Tem dúvidas? Entre em vigor com o suporte."
                }
              ]
            },
            "options": {}
          },
          "id": "f8a02c91-953e-43c2-b36c-94ccb1915674",
          "name": "Enviar Recibo WhatsApp",
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4,
          "position": [480, 300]
        }
      ],
      "connections": {
        "Webhook Pagamento": {
          "main": [
            [
              {
                "node": "Enviar Recibo WhatsApp",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      }
    }, null, 2),

    calendar: JSON.stringify({
      "nodes": [
        {
          "parameters": {
            "httpMethod": "POST",
            "path": "efraim-calendar-maintenance",
            "options": {}
          },
          "id": "2da12b9d-ccf0-4660-84c4-72ff9fa139db",
          "name": "Webhook Manutenção",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [250, 300]
        },
        {
          "parameters": {
            "conditions": {
              "boolean": [
                {
                  "value1": "={{ $json.body.data.isFutureDate }}",
                  "value2": true
                }
              ]
            }
          },
          "id": "bc339121-7f8e-4a81-9b19-2ea87bfca0bd",
          "name": "É Data Futura?",
          "type": "n8n-nodes-base.if",
          "typeVersion": 1,
          "position": [450, 300]
        },
        {
          "parameters": {
            "calendar": {
              "__resolvedKey": "id",
              "value": "primary"
            },
            "title": "={{ $json.body.data.suggestedCalendarTitle }}",
            "start": "={{ $json.body.data.date }}",
            "end": "={{ $json.body.data.date }}",
            "allDay": true,
            "additionalFields": {
              "description": "=Agendamento Crítico de Manutenção\\n\\n🚗 Veículo: {{ $json.body.data.vehicleModel }} ({{ $json.body.data.vehiclePlate }})\\n🔧 Tipo: {{ $json.body.data.type === 'preventive' ? 'Revisão Preventiva' : 'Conserto Corretivo' }}\\n📝 Detalhes: {{ $json.body.data.description }}\\n💼 Gestor: {{ $json.body.data.managerEmail }}",
              "attendees": [
                "={{ $json.body.data.managerEmail }}"
              ]
            }
          },
          "id": "4da78ca1-7440-42ca-bbce-1961e93c1266",
          "name": "Google Calendar",
          "type": "n8n-nodes-base.googleCalendar",
          "typeVersion": 2,
          "position": [680, 200]
        }
      ],
      "connections": {
        "Webhook Manutenção": {
          "main": [
            [
              {
                "node": "É Data Futura?",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "É Data Futura?": {
          "main": [
            [
              {
                "node": "Google Calendar",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      }
    }, null, 2),

    sheets: JSON.stringify({
      "nodes": [
        {
          "parameters": {
            "httpMethod": "POST",
            "path": "efraim-sheets-backup",
            "options": {}
          },
          "id": "e81cfb9b-9801-44eb-9fe1-0eb844781ca1",
          "name": "Webhook Transações",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [250, 300]
        },
        {
          "parameters": {
            "documentId": "PREENCHA_COM_O_ID_DA_PLANILHA_AQUI",
            "sheetName": "Consolidação Contábil",
            "options": {},
            "columns": {
              "mappingMode": "defineBelow",
              "value": {
                "DATA": "={{ $json.body.data.date }}",
                "VALOR": "={{ $json.body.data.amount }}",
                "TIPO": "={{ $json.body.data.type }}",
                "CATEGORIA": "={{ $json.body.data.category }}",
                "DESCRIÇÃO": "={{ $json.body.data.description }}",
                "CONDUTOR": "={{ $json.body.data.driverName }}",
                "VEÍCULO / PLACA": "={{ $json.body.data.vehicleModel }} {{ $json.body.data.vehiclePlate }}"
              }
            }
          },
          "id": "fc11cd65-aa89-4da3-9b9c-4978fed39df1",
          "name": "Google Sheets",
          "type": "n8n-nodes-base.googleSheets",
          "typeVersion": 3,
          "position": [480, 300]
        }
      ],
      "connections": {
        "Webhook Transações": {
          "main": [
            [
              {
                "node": "Google Sheets",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      }
    }, null, 2),

    reminders: JSON.stringify({
      "nodes": [
        {
          "parameters": {
            "httpMethod": "POST",
            "path": "efraim-whatsapp-reminders",
            "options": {}
          },
          "id": "rem-webhook-001",
          "name": "Webhook Lembretes Vencimento",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [250, 300]
        },
        {
          "parameters": {
            "method": "POST",
            "url": "https://api.evolution.com/message/sendText/instancia-efraim",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "apikey",
                  "value": "SUA_API_KEY_EVOLUTION_OU_ZAPI"
                }
              ]
            },
            "sendBody": true,
            "contentType": "json",
            "bodyParameters": {
              "parameters": [
                {
                  "name": "number",
                  "value": "={{ $json.body.data.recipientPhone }}"
                },
                {
                  "name": "text",
                  "value": "={{ $json.body.data.messageText }}"
                }
              ]
            },
            "options": {}
          },
          "id": "rem-http-002",
          "name": "Enviar Lembrete WhatsApp (API)",
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4,
          "position": [480, 300]
        }
      ],
      "connections": {
        "Webhook Lembretes Vencimento": {
          "main": [
            [
              {
                "node": "Enviar Lembrete WhatsApp (API)",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      }
    }, null, 2)
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-1">
        <div>
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] bg-accent/10 px-3 py-1 rounded-full">Automations Engine</span>
          <h2 className="font-display text-[28px] font-bold tracking-tight mt-3 mb-1">Ações Automatizadas com n8n</h2>
          <p className="text-subtle text-[14px]">Expanda todo o potencial do Efraim Frotas conectando eventos críticos a alertas de WhatsApp, Google Calendar e backup na nuvem.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-muted p-1 rounded-xl border border-line">
          <button 
            onClick={() => setActiveTab('config')}
            className={cn(
              "text-xs font-bold px-4 py-2 rounded-lg transition-all",
              activeTab === 'config' ? "bg-panel text-ink shadow-sm" : "text-subtle hover:text-ink"
            )}
          >
            Configuração
          </button>
          <button 
            onClick={() => setActiveTab('reminders')}
            className={cn(
              "text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5",
              activeTab === 'reminders' ? "bg-panel text-ink shadow-sm" : "text-subtle hover:text-ink"
            )}
          >
            <Bell size={13} className="text-amber-500" />
            Lembretes WhatsApp
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={cn(
              "text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5",
              activeTab === 'templates' ? "bg-panel text-ink shadow-sm" : "text-subtle hover:text-ink"
            )}
          >
            <Layers size={13} />
            Modelos de Fluxos (Workflows)
          </button>
        </div>
      </header>

      {activeTab === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Config column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="panel p-6">
              <h3 className="text-md font-bold mb-5 flex items-center gap-2 border-b border-line pb-4">
                <Link2 size={18} className="text-accent" />
                Configurar Endpoints de Webhook do n8n
              </h3>

              <form onSubmit={handleSave} className="space-y-6">
                {/* WHATSAPP TRIGGER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Recibo de Pagamento - WhatsApp
                    </label>
                    <span className="text-[10px] text-accent font-mono font-bold bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                      payment.created
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Ex: https://n8n.servidor.com/webhook/efraim-whatsapp-receipt"
                      value={config.paymentUrl}
                      onChange={(e) => setConfig({ ...config, paymentUrl: e.target.value })}
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      disabled={testingWebhook !== null}
                      onClick={() => handleTestWebhook('payment')}
                      className="btn-secondary text-xs font-bold flex items-center gap-1.5 px-4"
                      title="Testar envio com dados de teste"
                    >
                      {testingWebhook === 'payment' ? (
                        <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Play size={12} className="text-accent" />
                      )}
                      Testar
                    </button>
                  </div>
                  <p className="text-[11px] text-subtle">Dispara um evento instantâneo sempre que um pagamento de aluguel ou caução é registrado no Financeiro.</p>
                </div>

                {/* CALENDAR TRIGGER */}
                <div className="space-y-2 pt-4 border-t border-line/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Calendário de Manutenções Futuras
                    </label>
                    <span className="text-[10px] text-accent font-mono font-bold bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                      maintenance.created
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Ex: https://n8n.servidor.com/webhook/efraim-calendar-maintenance"
                      value={config.maintenanceUrl}
                      onChange={(e) => setConfig({ ...config, maintenanceUrl: e.target.value })}
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      disabled={testingWebhook !== null}
                      onClick={() => handleTestWebhook('maintenance')}
                      className="btn-secondary text-xs font-bold flex items-center gap-1.5 px-4"
                    >
                      {testingWebhook === 'maintenance' ? (
                        <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Play size={12} className="text-accent" />
                      )}
                      Testar
                    </button>
                  </div>
                  <p className="text-[11px] text-subtle">Dispara eventos contendo flags inteligentes (<code className="font-mono bg-bg text-[10px] px-1 py-0.2 rounded font-bold">isFutureDate</code>) para criar lembretes no Google Calendar do gestor.</p>
                </div>

                {/* GOOGLE SHEETS TRIGGER */}
                <div className="space-y-2 pt-4 border-t border-line">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1">
                      <Database size={13} className="text-subtle" />
                      Backup Geral de Caixa em Tempo Real (Google Sheets)
                    </label>
                    <span className="text-[10px] text-accent font-mono font-bold bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                      transaction.created
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Ex: https://n8n.servidor.com/webhook/efraim-sheets-backup"
                      value={config.sheetsUrl}
                      onChange={(e) => setConfig({ ...config, sheetsUrl: e.target.value })}
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      disabled={testingWebhook !== null}
                      onClick={() => handleTestWebhook('sheets')}
                      className="btn-secondary text-xs font-bold flex items-center gap-1.5 px-4"
                    >
                      {testingWebhook === 'sheets' ? (
                        <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Play size={12} className="text-accent" />
                      )}
                      Testar
                    </button>
                  </div>
                  <p className="text-[11px] text-subtle">Reúne de forma centralizada todos os débitos (manutenções, multas lançadas) e créditos (pagamentos efetuados) para preencher sua planilha contábil externa.</p>
                </div>

                {/* AUTOMATED REMINDERS TRIGGER */}
                <div className="space-y-2 pt-4 border-t border-line">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1">
                      <Bell size={13} className="text-amber-500" />
                      Lembretes Automáticos WhatsApp (Vencimentos & Manutenção)
                    </label>
                    <span className="text-[10px] text-amber-600 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      reminder.created
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Ex: https://n8n.servidor.com/webhook/efraim-whatsapp-reminders"
                      value={config.remindersUrl}
                      onChange={(e) => setConfig({ ...config, remindersUrl: e.target.value })}
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      disabled={testingWebhook !== null}
                      onClick={() => handleTestWebhook('reminders')}
                      className="btn-secondary text-xs font-bold flex items-center gap-1.5 px-4"
                    >
                      {testingWebhook === 'reminders' ? (
                        <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Play size={12} className="text-amber-500" />
                      )}
                      Testar
                    </button>
                  </div>
                  <p className="text-[11px] text-subtle">Envia alertas automatizados com a mensagem pré-formatada para o WhatsApp do motorista ou proprietário quando houver CNH, CRLV, seguro ou manutenção prestes a vencer.</p>
                </div>

                {testResult && (
                  <div className={cn(
                    "p-4 rounded-xl border flex gap-3 text-xs font-medium animate-in slide-in-from-top-2 duration-300",
                    testResult.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                  )}>
                    {testResult.type === 'success' ? <Check size={16} className="shrink-0 text-emerald-600" /> : <AlertCircle size={16} className="shrink-0 text-rose-600" />}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-line">
                  <button
                    type="submit"
                    className="btn-primary px-6 font-bold"
                  >
                    {isSaved ? '✓ Configurações Salvas!' : 'Salvar Webhooks'}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Quick Tutorial card */}
            <div className="panel p-6 bg-accent/5 border-accent/10">
              <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <HelpCircle size={14} />
                Como funciona a arquitetura
              </h4>
              <p className="text-xs text-subtle leading-relaxed mb-3">
                O Efraim Frotas não armazena chaves privadas nem segredos diretamente nos navegadores. Usando os Webhooks, o painel despacha os dados consolidados das transações, contatos e veículos prontificados de forma segura à sua instância do <strong>n8n</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-panel rounded-lg border border-line text-center-left">
                  <span className="text-[10px] font-bold text-accent">1. ACIONADOR EM PORTAL</span>
                  <p className="text-[11px] text-subtle mt-1.5">O gestor salva um pagamento, manutenção ou multa no app.</p>
                </div>
                <div className="p-3 bg-panel rounded-lg border border-line text-center-left">
                  <span className="text-[10px] font-bold text-accent">2. DISPARO HTTP</span>
                  <p className="text-[11px] text-subtle mt-1.5">O frontend dispara o payload de forma assíncrona ao n8n.</p>
                </div>
                <div className="p-3 bg-panel rounded-lg border border-line text-center-left">
                  <span className="text-[10px] font-bold text-accent">3. EXECUÇÃO INTEGRADA</span>
                  <p className="text-[11px] text-subtle mt-1.5">O n8n envia a mensagem de WhatsApp, insere na agenda ou na planilha.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Logs Dashboard */}
          <div className="space-y-6">
            <div className="panel p-6 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-accent animate-pulse" />
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Histórico de Disparos</h3>
                    <p className="text-[10px] text-subtle">Monitoramento em tempo real</p>
                  </div>
                </div>
                
                {logs.length > 0 && (
                  <button
                    onClick={clearWebhookLogs}
                    className="p-1.5 text-subtle hover:text-danger rounded hover:bg-danger/5 transition-colors"
                    title="Limpar histórico"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-subtle space-y-3">
                  <div className="p-3 bg-muted rounded-full">
                    <Link2 size={24} className="text-subtle" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink">Nenhum disparo na fila</p>
                  <p className="text-[11px] leading-relaxed max-w-[220px]">Adicione lançamentos contábeis ou de manutenção para disparar os webhooks em tempo real e visualizar os retornos.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[520px] pr-1">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const dateStr = new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    return (
                      <div 
                        key={log.id} 
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          log.status === 'SUCCESS' ? "bg-emerald-50/[0.15] border-emerald-500/20" : "bg-rose-50/[0.15] border-rose-500/20"
                        )}
                      >
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                                log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                              )}>
                                {log.status === 'SUCCESS' ? 'Sucesso' : 'Falhou'}
                              </span>
                              <span className="text-[10px] font-bold text-ink font-mono">{log.event}</span>
                            </div>
                            <p className="text-[10px] text-subtle font-medium">{dateStr} • ID: {log.id}</p>
                          </div>
                          <ArrowRight size={14} className={cn("text-subtle transition-transform duration-200", isExpanded ? "rotate-90 text-ink" : "")} />
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-line/40 space-y-2 animate-in fade-in duration-200">
                            {log.error && (
                              <div className="p-2 rounded bg-rose-500/5 text-rose-600 font-mono text-[10px] border border-rose-500/10 leading-relaxed">
                                <strong>Erro retornado pelo n8n:</strong> {log.error}
                              </div>
                            )}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-subtle uppercase tracking-wider block">Payload enviado:</span>
                              <pre className="text-[9px] font-mono text-ink bg-bg p-2 rounded overflow-x-auto border border-line/30 leading-snug max-h-44">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'reminders' ? (
        /* TAB: REMINDERS HUB */
        <div className="space-y-8 text-left animate-in fade-in duration-300">
          <div className="panel p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-line pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Bell size={20} className="text-amber-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-ink">Central de Disparo de Lembretes WhatsApp via n8n</h3>
                </div>
                <p className="text-xs text-subtle mt-1">
                  Alertas em tempo real sobre vencimento de CNH, licenciamento CRLV/IPVA, renovação de seguro, encerramento de contratos e manutenções preventivas atrasadas.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  disabled={batchSending || reminders.length === 0}
                  onClick={handleSendBatchReminders}
                  className="btn-primary w-full md:w-auto font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-none py-2.5 px-5 shadow-sm"
                >
                  {batchSending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Disparando Webhooks...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Disparar Todos os Lembretes via n8n ({reminders.length})
                    </>
                  )}
                </button>
              </div>
            </div>

            {batchResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>
                    <strong>Resultado do Disparo em Lote:</strong> {batchResult.sent} lembrete(s) enviado(s) com sucesso com payload formatado para WhatsApp via n8n.
                    {batchResult.failed > 0 && ` (${batchResult.failed} falharam).`}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-subtle uppercase tracking-wider">
                <span>Itens com Vencimento Próximo ({reminders.length})</span>
                <span>Canal de Entrega: WhatsApp (Webhook API n8n)</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {reminders.map((item) => {
                  const isSendingThis = sendingReminderId === item.id;
                  const isPreviewing = previewMsgId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-5 rounded-2xl border transition-all space-y-4",
                        item.severity === 'critical' 
                          ? "bg-rose-500/5 border-rose-500/20" 
                          : item.severity === 'warning'
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-blue-500/5 border-blue-500/20"
                      )}
                    >
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                              item.severity === 'critical' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                              item.severity === 'warning' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                              "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            )}>
                              {item.severity === 'critical' ? '🔴 Crítico / Imediato' : item.severity === 'warning' ? '🟡 Atenção' : '🔵 Informativo'}
                            </span>

                            <span className="text-xs font-bold text-ink font-mono bg-panel px-2.5 py-0.5 rounded border border-line">
                              {item.type === 'cnh_expiry' ? '📄 CNH Expirando' :
                               item.type === 'crlv_licensing' ? '🚗 Licenciamento IPVA/CRLV' :
                               item.type === 'maintenance_due' ? '🔧 Manutenção Atrasada' :
                               item.type === 'insurance_renewal' ? '🛡️ Renovação de Seguro' : '📋 Fim de Contrato'}
                            </span>

                            <span className="text-xs text-subtle font-medium">
                              Vencimento: <strong className="text-ink">{new Date(item.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-ink">{item.title}</h4>
                          <p className="text-xs text-subtle leading-relaxed">{item.description}</p>

                          <div className="flex items-center gap-4 text-xs text-subtle pt-1 flex-wrap">
                            <div>
                              Destinatário: <strong className="text-ink">{item.recipientName}</strong> ({item.recipientRole})
                            </div>
                            <div>
                              WhatsApp: <strong className="text-ink font-mono">{item.recipientPhone}</strong>
                            </div>
                            {item.vehiclePlate && (
                              <div>
                                Veículo: <strong className="text-ink">{item.vehicleModel} ({item.vehiclePlate})</strong>
                              </div>
                            )}
                            {item.lastSentAt && (
                              <div className="text-emerald-600 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                                ✓ Enviado via n8n às {new Date(item.lastSentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
                          <button
                            onClick={() => setPreviewMsgId(isPreviewing ? null : item.id)}
                            className="btn-secondary text-xs font-bold px-3 py-2 flex items-center justify-center gap-1.5 flex-1 lg:flex-initial"
                          >
                            <MessageSquare size={13} className="text-accent" />
                            {isPreviewing ? 'Ocultar Mensagem' : 'Ver Mensagem'}
                          </button>

                          <button
                            disabled={isSendingThis || batchSending}
                            onClick={() => handleSendSingleReminder(item)}
                            className="btn-primary text-xs font-bold px-4 py-2 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none flex-1 lg:flex-initial"
                          >
                            {isSendingThis ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send size={13} />
                                Enviar WhatsApp (n8n)
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Preview Box */}
                      {isPreviewing && (
                        <div className="p-4 bg-emerald-950 text-emerald-100 rounded-xl font-mono text-xs space-y-2 border border-emerald-800 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center border-b border-emerald-800/80 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Pré-visualização do Payload WhatsApp</span>
                            <span className="text-[10px] text-emerald-400">WhatsApp API Integration</span>
                          </div>
                          <pre className="whitespace-pre-wrap leading-relaxed font-sans text-xs text-white bg-emerald-900/40 p-3 rounded border border-emerald-800">
                            {buildWhatsAppReminderPayload(item).messageText}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB: TEMPLATES and Workflows */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Flow Selector */}
          <div className="md:col-span-1 space-y-3">
            <h4 className="text-[11px] font-bold text-subtle uppercase tracking-widest px-2">Automações Criadas</h4>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedWorkflow('whatsapp')}
                className={cn(
                  "w-full text-left text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-between",
                  selectedWorkflow === 'whatsapp' ? "bg-accent/10 border-l-4 border-accent text-accent" : "hover:bg-muted text-subtle hover:text-ink"
                )}
              >
                <span>🧾 Alerta Recibo WhatsApp</span>
                <DollarSign size={14} />
              </button>
              <button
                onClick={() => setSelectedWorkflow('reminders')}
                className={cn(
                  "w-full text-left text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-between",
                  selectedWorkflow === 'reminders' ? "bg-accent/10 border-l-4 border-accent text-accent" : "hover:bg-muted text-subtle hover:text-ink"
                )}
              >
                <span>🔔 Lembretes de Vencimento</span>
                <Bell size={14} className="text-amber-500" />
              </button>
              <button
                onClick={() => setSelectedWorkflow('calendar')}
                className={cn(
                  "w-full text-left text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-between",
                  selectedWorkflow === 'calendar' ? "bg-accent/10 border-l-4 border-accent text-accent" : "hover:bg-muted text-subtle hover:text-ink"
                )}
              >
                <span>📅 Agenda Google Calendar</span>
                <Calendar size={14} />
              </button>
              <button
                onClick={() => setSelectedWorkflow('sheets')}
                className={cn(
                  "w-full text-left text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-between",
                  selectedWorkflow === 'sheets' ? "bg-accent/10 border-l-4 border-accent text-accent" : "hover:bg-muted text-subtle hover:text-ink"
                )}
              >
                <span>📊 Backup no Google Sheets</span>
                <Database size={14} />
              </button>
            </div>

            <div className="mt-8 p-4 bg-muted border border-line rounded-xl text-left space-y-2">
              <h5 className="text-[10px] font-bold text-ink uppercase tracking-wider">Como importar no n8n?</h5>
              <ol className="text-[11px] text-subtle space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Escolha a automação ao lado</li>
                <li>Clique no botão <strong>Copiar código do fluxo</strong></li>
                <li>Abra uma aba vazia no n8n</li>
                <li>Pressione <kbd className="bg-panel px-1 py-0.2 rounded border shadow-sm text-[10px]">CTRL + V</kbd> (Colar)</li>
                <li>Pronto! O n8n monta o fluxo completo automaticamente.</li>
              </ol>
            </div>
          </div>

          {/* Right Workflow View */}
          <div className="md:col-span-3 space-y-6">
            <div className="panel p-6 space-y-6">
              {selectedWorkflow === 'whatsapp' && (
                <div className="space-y-4">
                  <header className="flex justify-between items-start border-b border-line pb-4 flex-wrap gap-4">
                    <div>
                      <h3 className="font-display text-md font-bold text-ink">Recibo de WhatsApp via API n8n</h3>
                      <p className="text-xs text-subtle mt-1 text-left">Sempre que um pagamento cai, envie um recibo de texto formatado automático ao WhatsApp do condutor.</p>
                    </div>
                    <button
                      onClick={() => handleCopyClipboard(workflowsJSON.whatsapp, 'whatsapp')}
                      className="btn-primary text-xs font-bold flex items-center gap-1.5 px-3 py-2"
                    >
                      {copiedText === 'whatsapp' ? (
                        <>✓ Copiado para a Área de Transferência!</>
                      ) : (
                        <>
                          <Copy size={13} />
                          Copiar Código do Fluxo
                        </>
                      )}
                    </button>
                  </header>

                  <div className="space-y-4 text-left">
                    <div>
                      <h4 className="text-[11px] font-bold text-ink uppercase tracking-wider mb-2">Estrutura das Variáveis Oportunizadas</h4>
                      <div className="p-3 bg-muted rounded-xl border border-line flex flex-col space-y-1.5 font-mono text-[11px] text-subtle">
                        <div><strong className="text-ink">{"{{ $json.body.data.driverName }}"}</strong> &rarr; Nome Completo do Motorista</div>
                        <div><strong className="text-ink">{"{{ $json.body.data.driverContact }}"}</strong> &rarr; Celular do Motorista (higienizado por Regex no fluxo)</div>
                        <div><strong className="text-ink">{"{{ $json.body.data.amount }}"}</strong> &rarr; Valor recebido em Reais (Ex: 550.00)</div>
                        <div><strong className="text-ink">{"{{ $json.body.data.type }}"}</strong> &rarr; Tipo de Lançamento (Aluguel, Caução, Balanço, etc)</div>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50/[0.2] border border-emerald-500/20 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">💡 DICA DE INTEGRAÇÃO</span>
                      <p className="text-xs text-subtle leading-relaxed">
                        No nó de HTTP Request, você pode utilizar qualquer API de WhatsApp que use (Evolution API, MyZ-API, Z-API, ou Chatwoot). O JSON disponibilizado vem totalmente mapeado para converter o número usando expressão regular <code className="bg-panel px-1 py-0.5 rounded text-ink font-mono">replace(/\D/g, '')</code>, removendo travessões, espaços ou parênteses automaticamente para envio perfeito.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedWorkflow === 'calendar' && (
                <div className="space-y-4">
                  <header className="flex justify-between items-start border-b border-line pb-4 flex-wrap gap-4">
                    <div>
                      <h3 className="font-display text-md font-bold text-ink">Agendamento de Calendário no Google Calendar</h3>
                      <p className="text-xs text-subtle mt-1 text-left">Sempre que inserir uma manutenção de caráter futuro, gera de forma automática um lembrete/evento na agenda do Google do gestor.</p>
                    </div>
                    <button
                      onClick={() => handleCopyClipboard(workflowsJSON.calendar, 'calendar')}
                      className="btn-primary text-xs font-bold flex items-center gap-1.5 px-3 py-2"
                    >
                      {copiedText === 'calendar' ? (
                        <>✓ Copiado para a Área de Transferência!</>
                      ) : (
                        <>
                          <Copy size={13} />
                          Copiar Código do Fluxo
                        </>
                      )}
                    </button>
                  </header>

                  <div className="space-y-4 text-left">
                    <div>
                      <h4 className="text-[11px] font-bold text-ink uppercase tracking-wider mb-2">Funcionamento do Fluxo</h4>
                      <p className="text-xs text-subtle leading-relaxed mb-3">
                        O painel avalia dinamicamente se a data da manutenção é maior que a data atual. Se sim, ele anexa a flag de rota <code className="bg-muted px-1 rounded text-ink font-mono">isFutureDate: true</code>. No n8n, o nó de <strong>IF</strong> executa a triagem: se for futuro, anexa o agendamento; se for manutenção histórica que ocorreu no passado, descarta o evento do calendário sem poluir a sua agenda.
                      </p>
                      <div className="p-3 bg-muted rounded-xl border border-line flex flex-col space-y-1.5 font-mono text-[11px] text-subtle">
                        <div><strong className="text-ink">{"{{ $json.body.data.suggestedCalendarTitle }}"}</strong> &rarr; Título Formatado (Ex: Manutenção Preventiva: Toyota Corolla)</div>
                        <div><strong className="text-ink">{"{{ $json.body.data.date }}"}</strong> &rarr; Data da Operação para agendamento exato</div>
                        <div><strong className="text-ink">{"{{ $json.body.data.managerEmail }}"}</strong> &rarr; E-mail responsável pelo Google Calendar para envio de convite</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedWorkflow === 'sheets' && (
                <div className="space-y-4">
                  <header className="flex justify-between items-start border-b border-line pb-4 flex-wrap gap-4">
                    <div>
                      <h3 className="font-display text-md font-bold text-ink">Backup Contábil no Google Sheets</h3>
                      <p className="text-xs text-subtle mt-1 text-left">Mantenha uma planilha auditável em tempo real. Cada entrada (Credit) de aluguel e cada saída (Debit) com custos de manutenções ou multas são gravados em linha única instantaneamente.</p>
                    </div>
                    <button
                      onClick={() => handleCopyClipboard(workflowsJSON.sheets, 'sheets')}
                      className="btn-primary text-xs font-bold flex items-center gap-1.5 px-3 py-2"
                    >
                      {copiedText === 'sheets' ? (
                        <>✓ Copiado para a Área de Transferência!</>
                      ) : (
                        <>
                          <Copy size={13} />
                          Copiar Código do Fluxo
                        </>
                      )}
                    </button>
                  </header>

                  <div className="space-y-4 text-left">
                    <div>
                      <h4 className="text-[11px] font-bold text-ink uppercase tracking-wider mb-2">Estrutura de Colunas Recomendada para o Sheets</h4>
                      <p className="text-xs text-subtle leading-relaxed mb-3">
                        Crie uma planilha no Google Sheets contendo exatamente as seguintes colunas na primeira linha (Cabeçalho):
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-bold font-mono">
                        <div className="p-2 bg-muted border border-line rounded">DATA</div>
                        <div className="p-2 bg-muted border border-line rounded">VALOR</div>
                        <div className="p-2 bg-muted border border-line rounded">TIPO</div>
                        <div className="p-2 bg-muted border border-line rounded">CATEGORIA</div>
                        <div className="p-2 bg-muted border border-line rounded">DESCRIÇÃO</div>
                        <div className="p-2 bg-muted border border-line rounded">CONDUTOR</div>
                        <div className="p-2 bg-muted border border-line rounded" style={{ gridColumn: 'span 2' }}>VEÍCULO / PLACA</div>
                      </div>
                      <p className="text-[11px] text-subtle mt-2 leading-relaxed">
                        O nó mapeador do n8n lê esses campos e anexa a linha preservando valores, casas decimais de caixa e referências no veículo associado automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Workflow JSON Box View */}
              <div className="space-y-2 text-left pt-2 border-t border-line">
                <span className="text-[10px] font-bold text-subtle uppercase tracking-widest block">Representação do Código JSON do Fluxo n8n:</span>
                <pre className="text-[10px] font-mono text-ink bg-bg p-4 rounded-xl border border-line leading-relaxed max-h-60 overflow-y-auto">
                  {selectedWorkflow === 'whatsapp' && workflowsJSON.whatsapp}
                  {selectedWorkflow === 'calendar' && workflowsJSON.calendar}
                  {selectedWorkflow === 'sheets' && workflowsJSON.sheets}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
