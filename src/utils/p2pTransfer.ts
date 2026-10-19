import { Peer, DataConnection } from 'peerjs';
import QRCode from 'qrcode';
import { P2PTransferPayload } from '../types';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

export const PEER_PREFIX = 'rtph-v1';

export function generate6DigitPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function formatPin(pin: string): string {
  const clean = pin.replace(/\D/g, '').slice(0, 6);
  if (clean.length > 3) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

export async function generateQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: 260,
    margin: 1.5,
    color: {
      dark: '#134e4a', // Dark Teal
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });
}

export interface HostSession {
  peer: Peer;
  sendPayload: (payload: P2PTransferPayload) => boolean;
  destroy: () => void;
}

export function startHostSession(
  pin: string,
  callbacks: {
    onReady: (peerId: string) => void;
    onConnected: () => void;
    onTransferred: () => void;
    onError: (msg: string) => void;
  }
): HostSession {
  const cleanPin = pin.replace(/\D/g, '');
  const hostPeerId = `${PEER_PREFIX}-host-${cleanPin}`;
  let activeConn: DataConnection | null = null;
  let isDestroyed = false;

  const peer = new Peer(hostPeerId, {
    debug: 1,
    config: {
      iceServers: ICE_SERVERS
    }
  });

  peer.on('open', (id) => {
    if (isDestroyed) return;
    callbacks.onReady(id);
  });

  peer.on('connection', (conn) => {
    if (isDestroyed) return;
    activeConn = conn;

    conn.on('open', () => {
      callbacks.onConnected();
    });

    conn.on('close', () => {
      activeConn = null;
    });

    conn.on('error', (err) => {
      callbacks.onError(err?.message || 'Connection error with receiving phone');
    });
  });

  peer.on('error', (err) => {
    if (isDestroyed) return;
    if (err.type === 'unavailable-id') {
      callbacks.onError('This PIN is already active. Please generate a new PIN.');
    } else {
      callbacks.onError(err.message || 'WebRTC Peer connection failed.');
    }
  });

  const sendPayload = (payload: P2PTransferPayload): boolean => {
    if (!activeConn || !activeConn.open) {
      callbacks.onError('No active receiving phone connected.');
      return false;
    }
    try {
      activeConn.send(payload);
      callbacks.onTransferred();
      return true;
    } catch {
      callbacks.onError('Failed to send prescription data across data channel.');
      return false;
    }
  };

  const destroy = () => {
    isDestroyed = true;
    try {
      if (activeConn) {
        activeConn.close();
        activeConn = null;
      }
      peer.destroy();
    } catch {
      // Ignore cleanup error
    }
  };

  return { peer, sendPayload, destroy };
}

export interface GuestSession {
  peer: Peer;
  destroy: () => void;
}

export function connectAsGuest(
  pin: string,
  callbacks: {
    onConnecting: () => void;
    onConnected: () => void;
    onDataReceived: (payload: P2PTransferPayload) => void;
    onError: (msg: string) => void;
  }
): GuestSession {
  const cleanPin = pin.replace(/\D/g, '');
  const targetHostId = `${PEER_PREFIX}-host-${cleanPin}`;
  const guestPeerId = `${PEER_PREFIX}-guest-${cleanPin}-${Math.random().toString(36).substring(2, 7)}`;
  let isDestroyed = false;
  let conn: DataConnection | null = null;
  let timeoutId: number | null = null;

  const peer = new Peer(guestPeerId, {
    debug: 1,
    config: {
      iceServers: ICE_SERVERS
    }
  });

  peer.on('open', () => {
    if (isDestroyed) return;
    callbacks.onConnecting();

    conn = peer.connect(targetHostId, {
      reliable: true,
      serialization: 'json'
    });

    // 15 second timeout if host is not found
    timeoutId = window.setTimeout(() => {
      if (conn && !conn.open) {
        callbacks.onError('Sender phone not found. Make sure the 6-digit PIN matches and the sender phone is on the share screen.');
      }
    }, 15000);

    conn.on('open', () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      callbacks.onConnected();
    });

    conn.on('data', (data) => {
      try {
        const payload = data as P2PTransferPayload;
        if (payload && payload.app === 'ResetaTime-PH') {
          callbacks.onDataReceived(payload);
        } else {
          callbacks.onError('Received unknown or invalid data format.');
        }
      } catch {
        callbacks.onError('Could not process received prescription data.');
      }
    });

    conn.on('error', (err) => {
      if (timeoutId) window.clearTimeout(timeoutId);
      callbacks.onError(err?.message || 'Error connecting to sender phone.');
    });

    conn.on('close', () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    });
  });

  peer.on('error', (err) => {
    if (isDestroyed) return;
    if (timeoutId) window.clearTimeout(timeoutId);
    if (err.type === 'peer-unavailable') {
      callbacks.onError('Sender phone was not found. Please verify the 6-digit PIN code.');
    } else {
      callbacks.onError(err.message || 'WebRTC error connecting to sender phone.');
    }
  });

  const destroy = () => {
    isDestroyed = true;
    if (timeoutId) window.clearTimeout(timeoutId);
    try {
      if (conn) {
        conn.close();
        conn = null;
      }
      peer.destroy();
    } catch {
      // Ignore cleanup error
    }
  };

  return { peer, destroy };
}
