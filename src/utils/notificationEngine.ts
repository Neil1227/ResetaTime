import { PrescriptionItem, ScheduledSlot } from '../types';
import { formatTime12h } from './scheduleEngine';

/**
 * Plays a gentle, senior-friendly two-tone medical chime using the Web Audio API (no external MP3 needed, works 100% offline).
 */
export function playAlertChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(587.33, now, 0.25);        // D5
    playNote(880.0, now + 0.22, 0.45);  // A5
    playNote(1174.66, now + 0.5, 0.55); // D6
  } catch {
    // Ignore audio context errors if blocked by autoplay policy
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

export async function triggerMedicineNotification(
  med: PrescriptionItem,
  slot: ScheduledSlot,
  lang: 'en' | 'taglish',
  personName?: string
): Promise<boolean> {
  playAlertChime();

  const namePrefix = personName ? `${personName} • ` : '';
  const title =
    lang === 'taglish'
      ? `${namePrefix}Oras na ng Gamot (${formatTime12h(slot.time24)})`
      : `${namePrefix}Time for Medicine (${formatTime12h(slot.time24)})`;

  const body =
    lang === 'taglish'
      ? `${personName ? `Gamot para kay ${personName}: ` : ''}${med.brandName} (${med.genericName} ${med.strength}) — Inumin: ${med.doseAmount}. ${slot.reasonTl}`
      : `${personName ? `Medicine for ${personName}: ` : ''}${med.brandName} (${med.genericName} ${med.strength}) — Take: ${med.doseAmount}. ${slot.reasonEn}`;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: `med-${med.id}-${slot.id}`,
            requireInteraction: true
          });
          return true;
        }
      }
      new Notification(title, {
        body,
        icon: '/icon.svg',
        tag: `med-${med.id}-${slot.id}`
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
