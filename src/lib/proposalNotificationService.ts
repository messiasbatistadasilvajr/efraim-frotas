/**
 * Proposal Notification Service with Mercado Livre style chime & Portuguese speech alert.
 */

export interface ProposalNotificationData {
  id: string;
  clientName: string;
  vehicleCategory: string;
  weeklyRate: number;
  timestamp: string;
  phone?: string;
  status?: string;
}

// Key for local storage settings
const SOUND_MUTED_KEY = 'efraim_proposal_sound_muted';
const VOICE_MUTED_KEY = 'efraim_proposal_voice_muted';

export function isSoundMuted(): boolean {
  return localStorage.getItem(SOUND_MUTED_KEY) === 'true';
}

export function setSoundMuted(muted: boolean): void {
  localStorage.setItem(SOUND_MUTED_KEY, String(muted));
}

export function isVoiceMuted(): boolean {
  return localStorage.getItem(VOICE_MUTED_KEY) === 'true';
}

export function setVoiceMuted(muted: boolean): void {
  localStorage.setItem(VOICE_MUTED_KEY, String(muted));
}

/**
 * Synthesizes a crisp "Mercado Livre" style 2-tone doorbell / notification chime (Ding-Dong)
 * using Web Audio API AudioContext without requiring external mp3 assets.
 */
export function playMercadoLivreChime(): void {
  if (isSoundMuted()) return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    const ctx = new AudioCtx();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: High crisp bell (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // slide up to A5
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: Warm confirmation bell (G5 - 783.99Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.18); // G5
    
    gain2.gain.setValueAtTime(0, now + 0.18);
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.20);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.18);
    osc2.stop(now + 0.9);

    // Tone 3: Harmonic overtone for extra richness (C6 - 1046.5Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();

    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1046.5, now + 0.18);
    
    gain3.gain.setValueAtTime(0, now + 0.18);
    gain3.gain.linearRampToValueAtTime(0.15, now + 0.20);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc3.start(now + 0.18);
    osc3.stop(now + 0.8);

  } catch (err) {
    console.warn("Audio Context sound alert failed:", err);
  }
}

/**
 * Speaks the alert in Portuguese using Web Speech Synthesis API.
 */
export function speakProposalAlert(clientName: string, category: string, weeklyRate: number): void {
  if (isVoiceMuted()) return;

  if (!('speechSynthesis' in window)) {
    console.warn("Web Speech API não é suportado neste navegador.");
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const formattedRate = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weeklyRate);
    const speechText = `Atenção! Nova proposta de aluguel recebida de ${clientName}. Veículo ${category}, valor semanal de ${formattedRate}!`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05; // Slightly lively pace like e-commerce notifications
    utterance.pitch = 1.1; // Clear friendly tone

    // Attempt to pick a Brazilian Portuguese voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech Synthesis alert failed:", err);
  }
}

/**
 * Triggers full notification: Chime Sound + Speech + Custom DOM Event
 */
export function triggerNewProposalAlert(data: ProposalNotificationData): void {
  // 1. Play Mercado Livre doorbell sound
  playMercadoLivreChime();

  // 2. Speak proposal notification after a brief 300ms delay so chime plays first
  setTimeout(() => {
    speakProposalAlert(data.clientName, data.vehicleCategory, data.weeklyRate);
  }, 350);

  // 3. Dispatch global custom event for UI toast banner
  const event = new CustomEvent('new-proposal-alert', { detail: data });
  window.dispatchEvent(event);
}

/**
 * Helper to simulate a sample proposal (e.g. for user testing)
 */
export function simulateIncomingProposal(): ProposalNotificationData {
  const sampleClients = [
    { name: 'Lucas Gabriel Ferreira', phone: '(11) 98765-4321', cat: 'Sedan Conforto (Onix Plus)', rate: 720 },
    { name: 'Patricia Alcantara', phone: '(11) 99123-8877', cat: 'Compacto Econômico (HB20)', rate: 610 },
    { name: 'Marcos Vinicius Ribeiro', phone: '(21) 97654-1122', cat: 'SUV Intermediário (Creta)', rate: 890 },
    { name: 'Aline Souza Castro', phone: '(31) 98833-4455', cat: 'Hatch Executivo (Polo TSI)', rate: 680 }
  ];

  const selected = sampleClients[Math.floor(Math.random() * sampleClients.length)];
  const proposalData: ProposalNotificationData = {
    id: `prop-sim-${Date.now()}`,
    clientName: selected.name,
    phone: selected.phone,
    vehicleCategory: selected.cat,
    weeklyRate: selected.rate,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: 'sent'
  };

  triggerNewProposalAlert(proposalData);
  return proposalData;
}
