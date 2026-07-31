export interface WebhookConfig {
  paymentUrl: string;
  maintenanceUrl: string;
  sheetsUrl: string;
  remindersUrl: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: 'payment.created' | 'maintenance.created' | 'transaction.created' | 'reminder.created' | 'test';
  status: 'SUCCESS' | 'FAILED';
  payload: any;
  error?: string;
}

const STORAGE_KEYS = {
  CONFIG: 'efraim_n8n_config',
  LOGS: 'efraim_n8n_logs'
};

export function getWebhookConfig(): WebhookConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        paymentUrl: parsed.paymentUrl || '',
        maintenanceUrl: parsed.maintenanceUrl || '',
        sheetsUrl: parsed.sheetsUrl || '',
        remindersUrl: parsed.remindersUrl || ''
      };
    }
  } catch (e) {
    console.error('Failed to parse webhook config', e);
  }
  return { paymentUrl: '', maintenanceUrl: '', sheetsUrl: '', remindersUrl: '' };
}

export function saveWebhookConfig(config: WebhookConfig) {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

export function getWebhookLogs(): WebhookLog[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse webhook logs', e);
  }
  return [];
}

export function addWebhookLog(event: WebhookLog['event'], status: WebhookLog['status'], payload: any, error?: string) {
  try {
    const logs = getWebhookLogs();
    const newLog: WebhookLog = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      event,
      status,
      payload,
      error
    };
    // Keep max 100 logs
    const updated = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
    
    // Dispatch a custom event to notify listeners
    window.dispatchEvent(new Event('efraim_n8n_logs_updated'));
  } catch (e) {
    console.error('Failed to write webhook log', e);
  }
}

export function clearWebhookLogs() {
  localStorage.removeItem(STORAGE_KEYS.LOGS);
  window.dispatchEvent(new Event('efraim_n8n_logs_updated'));
}

export async function triggerWebhook(
  url: string,
  event: WebhookLog['event'],
  payload: any
): Promise<{ success: boolean; error?: string }> {
  if (!url || !url.trim()) {
    return { success: false, error: 'URL do webhook vazia ou não configurada' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload
      })
    });

    if (response.ok) {
      addWebhookLog(event, 'SUCCESS', payload);
      return { success: true };
    } else {
      const errorText = await response.text();
      const statusText = response.statusText || 'Erro HTTP';
      const fullError = `Status ${response.status}: ${errorText || statusText}`;
      addWebhookLog(event, 'FAILED', payload, fullError);
      return { success: false, error: fullError };
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    addWebhookLog(event, 'FAILED', payload, errorMsg);
    return { success: false, error: errorMsg };
  }
}
