import React, { useState, useEffect, useRef, useId } from 'react';
import {
  X,
  Share2,
  Smartphone,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  Download,
  Users,
  Pill,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { UserProfile, PrescriptionItem, P2PTransferPayload, DoseLog } from '../types';
import {
  generate6DigitPin,
  formatPin,
  generateQrDataUrl,
  startHostSession,
  connectAsGuest,
  HostSession,
  GuestSession
} from '../utils/p2pTransfer';

interface P2PTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  prescriptions: PrescriptionItem[];
  activeProfileId: string;
  isTl: boolean;
  onImportSingleProfile: (profile: UserProfile, meds: PrescriptionItem[]) => void;
  onImportFullBackup: (
    profiles: UserProfile[],
    meds: PrescriptionItem[],
    doseLogs?: Record<string, DoseLog>
  ) => void;
  initialPin?: string;
}

type TransferTab = 'send' | 'receive';
type HostState = 'idle' | 'ready' | 'connected' | 'transferred' | 'error';
type GuestState = 'idle' | 'connecting' | 'connected' | 'received' | 'error';

export const P2PTransferModal: React.FC<P2PTransferModalProps> = ({
  isOpen,
  onClose,
  profiles,
  prescriptions,
  activeProfileId,
  isTl,
  onImportSingleProfile,
  onImportFullBackup,
  initialPin = ''
}) => {
  const pinInputId = useId();
  const [activeTab, setActiveTab] = useState<TransferTab>(initialPin ? 'receive' : 'send');

  // --- SEND MODE STATE ---
  const [sendTarget, setSendTarget] = useState<string>(activeProfileId === 'all' ? (profiles[0]?.id || 'all') : activeProfileId);
  const [hostPin, setHostPin] = useState<string>('');
  const [hostQrUrl, setHostQrUrl] = useState<string>('');
  const [hostStatus, setHostStatus] = useState<HostState>('idle');
  const [hostError, setHostError] = useState<string>('');
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const hostSessionRef = useRef<HostSession | null>(null);

  // --- RECEIVE MODE STATE ---
  const [guestPinInput, setGuestPinInput] = useState<string>(initialPin);
  const [guestStatus, setGuestStatus] = useState<GuestState>('idle');
  const [guestError, setGuestError] = useState<string>('');
  const [receivedPayload, setReceivedPayload] = useState<P2PTransferPayload | null>(null);
  const guestSessionRef = useRef<GuestSession | null>(null);

  // Close & cleanup sessions
  const cleanupAll = () => {
    if (hostSessionRef.current) {
      hostSessionRef.current.destroy();
      hostSessionRef.current = null;
    }
    if (guestSessionRef.current) {
      guestSessionRef.current.destroy();
      guestSessionRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

  // When modal opens in Send tab, initialize host PIN and QR code
  useEffect(() => {
    if (!isOpen) {
      cleanupAll();
      setHostStatus('idle');
      setGuestStatus('idle');
      setReceivedPayload(null);
      setHostError('');
      setGuestError('');
      return;
    }

    if (activeTab === 'send') {
      initHost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  const initHost = async () => {
    cleanupAll();
    const pin = generate6DigitPin();
    setHostPin(pin);
    setHostStatus('ready');
    setHostError('');

    // Generate pairing URL with hash for instant QR scan
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const shareUrl = `${origin}${pathname}#drop=${pin}`;

    try {
      const qr = await generateQrDataUrl(shareUrl);
      setHostQrUrl(qr);
    } catch {
      // fallback if QR generation fails
    }

    const session = startHostSession(pin, {
      onReady: () => {
        setHostStatus('ready');
      },
      onConnected: () => {
        setHostStatus('connected');
        // Automatically send the payload once the peer connects!
        doSendPayload(session, pin);
      },
      onTransferred: () => {
        setHostStatus('transferred');
      },
      onError: (msg) => {
        setHostStatus('error');
        setHostError(msg);
      }
    });

    hostSessionRef.current = session;
  };

  const doSendPayload = (session: HostSession, currentPin: string) => {
    const isSingle = sendTarget !== 'all';
    const targetProfile = profiles.find((p) => p.id === sendTarget);
    const targetMeds = isSingle
      ? prescriptions.filter((p) => p.profileId === sendTarget)
      : prescriptions;

    const payload: P2PTransferPayload = {
      version: 1,
      app: 'ResetaTime-PH',
      mode: isSingle ? 'single-profile' : 'all-family',
      timestamp: new Date().toISOString(),
      sourceDevice: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Mobile Phone',
      profile: targetProfile,
      prescriptions: targetMeds,
      profiles: isSingle ? (targetProfile ? [targetProfile] : []) : profiles
    };

    session.sendPayload(payload);
  };

  // Connect as Guest to receive payload
  const handleConnectGuest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = guestPinInput.replace(/\D/g, '');
    if (clean.length < 6) {
      setGuestError(isTl ? 'Mangyaring maglagay ng kumpletong 6-digit PIN code.' : 'Please enter the complete 6-digit PIN code.');
      return;
    }

    cleanupAll();
    setGuestStatus('connecting');
    setGuestError('');

    const session = connectAsGuest(clean, {
      onConnecting: () => {
        setGuestStatus('connecting');
      },
      onConnected: () => {
        setGuestStatus('connected');
      },
      onDataReceived: (payload) => {
        setGuestStatus('received');
        setReceivedPayload(payload);
      },
      onError: (msg) => {
        setGuestStatus('error');
        setGuestError(msg);
      }
    });

    guestSessionRef.current = session;
  };

  // Copy PIN to clipboard
  const handleCopyPin = () => {
    if (!hostPin) return;
    navigator.clipboard.writeText(hostPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // Confirm Import (Single Profile)
  const handleConfirmSingleImport = () => {
    if (!receivedPayload || !receivedPayload.profile) return;
    onImportSingleProfile(receivedPayload.profile, receivedPayload.prescriptions);
    onClose();
  };

  // Confirm Full Overwrite / Restore
  const handleConfirmFullImport = () => {
    if (!receivedPayload || !receivedPayload.profiles) return;
    onImportFullBackup(
      receivedPayload.profiles,
      receivedPayload.prescriptions,
      receivedPayload.doseLogs
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="p2p-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="p2p-modal-title" className="font-extrabold text-base sm:text-lg text-white leading-tight">
                  ResetaDrop
                </h2>
                <span className="text-[10px] font-bold bg-teal-800 text-teal-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  P2P Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isTl
                  ? 'Ilipat ang reseta sa ibang phone (Walang account, Peer-to-Peer)'
                  : 'Instant phone-to-phone prescription transfer (Zero-cloud WebRTC)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Send vs Receive */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'send'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{isTl ? 'Mag-Send sa Ibang Phone' : 'Send to Phone'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receive')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isTl ? 'Tanggapin (Receive)' : 'Receive Schedule'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* ============================================================ */}
          {/* TAB 1: SEND MODE */}
          {/* ============================================================ */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              {/* Select What to Send */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  <span>{isTl ? 'Piliin ang Gamot na Ililipat:' : 'Select Schedule to Send:'}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {profiles.map((p) => {
                    const isChosen = sendTarget === p.id;
                    const count = prescriptions.filter((m) => m.profileId === p.id).length;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSendTarget(p.id);
                          if (hostStatus === 'ready') initHost();
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isChosen
                            ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {count} {isTl ? 'gamot' : 'meds'}
                        </div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setSendTarget('all');
                      if (hostStatus === 'ready') initHost();
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      sendTarget === 'all'
                        ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-slate-900 truncate">
                      {isTl ? 'Lahat (Buong Pamilya)' : 'All Family Meds'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {prescriptions.length} {isTl ? 'lahat ng gamot' : 'total meds'}
                    </div>
                  </button>
                </div>
              </div>

              {/* 6-Digit PIN Display Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Wifi className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                    {isTl ? 'Live Pairing PIN' : 'Pairing PIN'}
                  </span>
                  <button
                    type="button"
                    onClick={initHost}
                    className="text-[11px] text-teal-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                    title="Generate new PIN"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isTl ? 'Bagong PIN' : 'New PIN'}</span>
                  </button>
                </div>

                {/* Big Formatted PIN */}
                <div className="py-1">
                  <div className="text-3xl sm:text-4xl font-black tracking-widest text-amber-300 font-mono">
                    {formatPin(hostPin)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isTl
                      ? 'I-type ito sa kabilang phone o i-scan ang QR code sa ibaba'
                      : 'Type this on the receiving phone or scan the QR code below'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedPin ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">{isTl ? 'Na-kopya!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>{isTl ? 'Kopyahin ang PIN' : 'Copy PIN'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status Indicator inside Card */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs">
                  {hostStatus === 'ready' && (
                    <span className="text-teal-300 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      {isTl ? 'Naghihintay na kumonekta ang kabilang phone...' : 'Waiting for receiving phone to connect...'}
                    </span>
                  )}
                  {hostStatus === 'connected' && (
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      {isTl ? 'Konektado na! Ipinapadala ang reseta...' : 'Connected! Transferring schedule...'}
                    </span>
                  )}
                  {hostStatus === 'transferred' && (
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {isTl ? 'Matagumpay na naipadala ang schedule!' : 'Prescription transferred successfully!'}
                    </span>
                  )}
                  {hostStatus === 'error' && (
                    <span className="text-rose-300 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      {hostError}
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              {hostQrUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-teal-700" />
                    <span>{isTl ? 'O I-scan gamit ang Camera ng Kabilang Phone:' : 'Or Scan with Camera on Receiving Phone:'}</span>
                  </div>
                  <div className="flex justify-center py-1">
                    <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200">
                      <img
                        src={hostQrUrl}
                        alt="ResetaDrop Pairing QR Code"
                        className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {isTl
                      ? 'Buksan lang ang camera ng isa pang cellphone para awtomatikong mag-bukas at mag-sync ang gamot.'
                      : 'Open the camera on the other phone to auto-launch and receive the medication schedule.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: RECEIVE MODE */}
          {/* ============================================================ */}
          {activeTab === 'receive' && (
            <div className="space-y-4">
              {/* If no payload received yet, show PIN entry form */}
              {!receivedPayload ? (
                <form onSubmit={handleConnectGuest} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <label htmlFor={pinInputId} className="block text-xs sm:text-sm font-bold text-slate-800">
                      {isTl
                        ? 'I-type ang 6-Digit PIN na nakadisplay sa nagpadalang phone:'
                        : 'Enter the 6-digit PIN displayed on the sender phone:'}
                    </label>

                    <input
                      id={pinInputId}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={7}
                      value={formatPin(guestPinInput)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setGuestPinInput(val);
                        if (val.length === 6) {
                          setGuestError('');
                        }
                      }}
                      placeholder="Hal: 782-194"
                      className="w-full text-center text-3xl sm:text-4xl font-black tracking-widest py-3 px-4 bg-white border-2 border-teal-500 focus:border-teal-700 rounded-xl text-slate-900 font-mono focus:outline-none"
                      autoFocus
                    />

                    {guestError && (
                      <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-start gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{guestError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={guestPinInput.replace(/\D/g, '').length < 6 || guestStatus === 'connecting'}
                      className={`w-full min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        guestPinInput.replace(/\D/g, '').length === 6 && guestStatus !== 'connecting'
                          ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {guestStatus === 'connecting' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isTl ? 'Kumukonekta sa kabilang phone...' : 'Connecting to sender phone...'}</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>{isTl ? 'Kumonekta at Kunin ang Schedule' : 'Connect & Receive Schedule'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>
                      {isTl
                        ? 'Direktang ipinapadala ang data phone-to-phone gamit ang encrypted WebRTC DataChannel. Walang naiiwang kopya sa anumang cloud server.'
                        : 'Data transfers directly phone-to-phone over an encrypted WebRTC DataChannel. Zero copies ever stored on any cloud server.'}
                    </span>
                  </div>
                </form>
              ) : (
                /* INCOMING PAYLOAD PREVIEW & CONFIRMATION */
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm sm:text-base">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>
                        {isTl
                          ? 'Natanggap ang Reseta Schedule!'
                          : 'Prescription Schedule Received!'}
                      </span>
                    </div>

                    {/* Member details */}
                    {receivedPayload.profile && (
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-900 font-extrabold flex items-center justify-center text-sm border border-teal-300 shrink-0">
                          {receivedPayload.profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {receivedPayload.profile.name}
                          </h4>
                          <p className="text-xs text-slate-600">
                            {receivedPayload.profile.role} • {receivedPayload.prescriptions.length} {isTl ? 'gamot' : 'prescriptions'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Medicines List Preview */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      <div className="text-xs font-bold text-slate-700">
                        {isTl ? 'Mga Kasamang Gamot:' : 'Prescription Items:'}
                      </div>
                      {receivedPayload.prescriptions.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white/80 p-2 rounded-lg border border-emerald-100 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Pill className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span className="font-bold text-slate-900 truncate">
                              {m.brandName}
                            </span>
                            <span className="text-slate-500 truncate text-[11px]">
                              ({m.strength})
                            </span>
                          </div>
                          <span className="font-bold text-teal-800 text-[11px] shrink-0">
                            {m.doseAmount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    {receivedPayload.mode === 'single-profile' && receivedPayload.profile && (
                      <button
                        type="button"
                        onClick={handleConfirmSingleImport}
                        className="w-full min-h-[46px] rounded-xl font-bold text-sm bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition-all cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        <span>
                          {isTl
                            ? `Idagdag si ${receivedPayload.profile.name} sa Aking Pamilya`
                            : `Add ${receivedPayload.profile.name} to My Family`}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleConfirmFullImport}
                      className="w-full min-h-[44px] rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-300"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                      <span>
                        {isTl
                          ? 'I-replace ang Buong Schedule (Full Overwrite)'
                          : 'Replace Full Schedule (Full Overwrite)'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">{isTl ? '100% Offline & Private P2P' : '100% Private WebRTC'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold px-3 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {isTl ? 'Isara' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
