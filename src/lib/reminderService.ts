import { getWebhookConfig, triggerWebhook } from './webhooks';

export type ReminderType = 'cnh_expiry' | 'crlv_licensing' | 'insurance_renewal' | 'maintenance_due' | 'contract_expiry';

export interface ReminderItem {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  recipientName: string;
  recipientPhone: string;
  recipientRole: 'motorista' | 'proprietario' | 'gestor';
  dueDate: string;
  daysRemaining: number;
  severity: 'critical' | 'warning' | 'info';
  vehiclePlate?: string;
  vehicleModel?: string;
  cnhNumber?: string;
  contractId?: string;
  lastSentAt?: string;
}

const SENT_REMINDERS_KEY = 'efraim_whatsapp_sent_reminders';

export function getSentRemindersHistory(): Record<string, string> {
  try {
    const saved = localStorage.getItem(SENT_REMINDERS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

export function markReminderAsSent(id: string) {
  try {
    const history = getSentRemindersHistory();
    history[id] = new Date().toISOString();
    localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('efraim_reminders_updated'));
  } catch (e) {
    console.error('Failed to mark reminder as sent', e);
  }
}

// Generate active reminders based on mock/real fleet data
export function generateActiveReminders(): ReminderItem[] {
  const history = getSentRemindersHistory();

  const items: ReminderItem[] = [
    {
      id: 'rem_cnh_01',
      type: 'cnh_expiry',
      title: 'CNH Próxima ao Vencimento - João Silva',
      description: 'A CNH de João Silva (CNH: 98765432100) vence em 3 dias. Necessário envio de documento renovado.',
      recipientName: 'João Silva',
      recipientPhone: '(11) 98765-4321',
      recipientRole: 'motorista',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      daysRemaining: 3,
      severity: 'critical',
      cnhNumber: '98765432100',
      lastSentAt: history['rem_cnh_01']
    },
    {
      id: 'rem_crlv_02',
      type: 'crlv_licensing',
      title: 'Licenciamento CRLV/IPVA - Corolla (ABC-1234)',
      description: 'O licenciamento anual do veículo Toyota Corolla S (Placa: ABC-1234) vence em 5 dias.',
      recipientName: 'Messias Ferreira Martins',
      recipientPhone: '(11) 98888-7777',
      recipientRole: 'proprietario',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      daysRemaining: 5,
      severity: 'warning',
      vehiclePlate: 'ABC-1234',
      vehicleModel: 'Toyota Corolla S',
      lastSentAt: history['rem_crlv_02']
    },
    {
      id: 'rem_maint_03',
      type: 'maintenance_due',
      title: 'Manutenção Preventiva Pendente - Onix (DEF-5678)',
      description: 'Troca de óleo e revisão de freios pendente. Veículo ultrapassou a marca de 10.000 km rodados.',
      recipientName: 'Carlos Eduardo',
      recipientPhone: '(11) 97777-6666',
      recipientRole: 'motorista',
      dueDate: new Date().toISOString().split('T')[0],
      daysRemaining: 0,
      severity: 'critical',
      vehiclePlate: 'DEF-5678',
      vehicleModel: 'Chevrolet Onix LTZ',
      lastSentAt: history['rem_maint_03']
    },
    {
      id: 'rem_ins_04',
      type: 'insurance_renewal',
      title: 'Renovação de Apólice de Seguro - Frota Sul',
      description: 'A apólice de seguro Porto Seguro referente aos veículos alugados vence em 10 dias.',
      recipientName: 'Geraldo Alcantara (Seguradora)',
      recipientPhone: '(11) 96666-5555',
      recipientRole: 'gestor',
      dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      daysRemaining: 10,
      severity: 'warning',
      lastSentAt: history['rem_ins_04']
    },
    {
      id: 'rem_ctr_05',
      type: 'contract_expiry',
      title: 'Fim de Contrato de Locação #CTR-2026-88',
      description: 'Contrato de locação de 12 meses do Hyundai HB20 (XYZ-9876) vence em 4 dias.',
      recipientName: 'Ana Paula (SulAmérica)',
      recipientPhone: '(11) 95555-4444',
      recipientRole: 'motorista',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      daysRemaining: 4,
      severity: 'info',
      vehiclePlate: 'XYZ-9876',
      vehicleModel: 'Hyundai HB20',
      contractId: 'CTR-2026-88',
      lastSentAt: history['rem_ctr_05']
    }
  ];

  return items;
}

export function buildWhatsAppReminderPayload(item: ReminderItem) {
  const formattedDate = new Date(item.dueDate + 'T00:00:00').toLocaleDateString('pt-BR');
  
  let formattedMessage = `🔔 *EFRAIM GESTÃO DE FROTAS - LEMBRETE IMPORTANTE*\n\n`;
  formattedMessage += `Olá *${item.recipientName}*,\n\n`;

  if (item.type === 'cnh_expiry') {
    formattedMessage += `⚠️ Identificamos que a sua *CNH* está próxima do vencimento (${formattedDate}).\n`;
    formattedMessage += `Por favor, providencie a renovação e envie a cópia atualizada para o nosso suporte para evitar a suspensão da locação.\n`;
  } else if (item.type === 'crlv_licensing') {
    formattedMessage += `📄 O licenciamento/IPVA do veículo *${item.vehicleModel}* (Placa: *${item.vehiclePlate}*) vence em *${formattedDate}*.\n`;
    formattedMessage += `Caso já tenha efetuado o pagamento, envie o comprovante. Se precisar do boleto, solicite por aqui.\n`;
  } else if (item.type === 'maintenance_due') {
    formattedMessage += `🔧 Lembramos que a *manutenção preventiva* do veículo *${item.vehicleModel}* (${item.vehiclePlate}) está programada para *${formattedDate}*.\n`;
    formattedMessage += `Compareça à oficina credenciada Efraim Frotas para a realização dos serviços.\n`;
  } else if (item.type === 'contract_expiry') {
    formattedMessage += `📋 O seu contrato de locação *${item.contractId || ''}* encerra em *${formattedDate}*.\n`;
    formattedMessage += `Entre em contato conosco para renovar sua locação com condições exclusivas ou agendar a devolução.\n`;
  } else {
    formattedMessage += `📌 *${item.title}*\n${item.description}\nData limite: *${formattedDate}*\n`;
  }

  formattedMessage += `\nQualquer dúvida, estamos à disposição!\n*Efraim Frotas - Atendimento ao Cliente*`;

  return {
    reminderId: item.id,
    type: item.type,
    recipientName: item.recipientName,
    recipientPhone: item.recipientPhone.replace(/\D/g, ''),
    formattedPhone: item.recipientPhone,
    recipientRole: item.recipientRole,
    title: item.title,
    description: item.description,
    dueDate: formattedDate,
    rawDueDate: item.dueDate,
    daysRemaining: item.daysRemaining,
    severity: item.severity,
    vehiclePlate: item.vehiclePlate || 'N/A',
    vehicleModel: item.vehicleModel || 'N/A',
    messageText: formattedMessage,
    sentAt: new Date().toISOString()
  };
}

export async function sendWhatsAppReminder(item: ReminderItem): Promise<{ success: boolean; error?: string }> {
  const config = getWebhookConfig();
  // Use remindersUrl or fallback to paymentUrl
  const url = config.remindersUrl || config.paymentUrl;

  if (!url) {
    return {
      success: false,
      error: 'URL do Webhook do n8n não configurada. Configure a URL na guia Configuração do n8n.'
    };
  }

  const payload = buildWhatsAppReminderPayload(item);
  const result = await triggerWebhook(url, 'reminder.created', payload);

  if (result.success) {
    markReminderAsSent(item.id);
  }

  return result;
}

export async function dispatchBatchReminders(items: ReminderItem[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    const res = await sendWhatsAppReminder(item);
    if (res.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
