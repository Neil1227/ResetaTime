import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Plus,
  Clock,
  Check,
  CheckCircle2,
  Bell,
  Calendar,
  AlertTriangle,
  Package,
  BookOpen,
  Settings2,
  RotateCcw,
  Trash2,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Sunrise,
  Volume2,
  Download,
  Search,
  Globe,
  FileText,
  Info,
  Utensils,
  Users,
  UserCheck
} from 'lucide-react';
import {
  DailyRoutine,
  DoseLog,
  FdaPhMedicine,
  LanguageMode,
  PillColor,
  PrescriptionItem,
  ScheduledSlot,
  TimeBlock,
  UserProfile,
  RelationshipRole
} from './types';
import {
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  DEFAULT_SELF_PROFILE_ID,
  DEFAULT_ROUTINE,
  loadPrescriptions,
  savePrescriptions,
  loadDoseLogs,
  saveDoseLogs,
  loadAllFdaMedicines,
  saveCustomFdaMedicine,
  getTodayDateString,
  buildDemoPrescriptions,
  ResetaTimeBackup
} from './db/storage';
import {
  formatTime12h,
  generateScheduleSlots,
  timeToMinutes,
  addMinutes,
  downloadIcsAlarms,
  FREQUENCY_OPTIONS,
  MEAL_RULE_OPTIONS
} from './utils/scheduleEngine';
import {
  requestNotificationPermission,
  triggerMedicineNotification,
  playAlertChime
} from './utils/notificationEngine';
import { AddResetaModal } from './components/AddResetaModal';
import { RoutineModal } from './components/RoutineModal';
import { ProfileModal } from './components/ProfileModal';

type ActiveTab = 'timeline' | 'medicines' | 'decoder';
type TimelinePeriod = 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'all';

const getInitialTimelinePeriod = (): TimelinePeriod => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'bedtime';
};

const PILL_COLOR_STYLES: Record<
  PillColor,
  { bg: string; border: string; badge: string; dot: string }
> = {
  teal: {
    bg: 'bg-teal-50/70',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-900',
    dot: 'bg-teal-600'
  },
  amber: {
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-950',
    dot: 'bg-amber-500'
  },
  blue: {
    bg: 'bg-sky-50/70',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-900',
    dot: 'bg-sky-600'
  },
  rose: {
    bg: 'bg-rose-50/70',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-900',
    dot: 'bg-rose-600'
  },
  violet: {
    bg: 'bg-violet-50/70',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-900',
    dot: 'bg-violet-600'
  },
  emerald: {
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-900',
    dot: 'bg-emerald-600'
  },
  slate: {
    bg: 'bg-slate-100/80',
    border: 'border-slate-300',
    badge: 'bg-slate-200 text-slate-900',
    dot: 'bg-slate-600'
  }
};

const TIME_BLOCK_META: Record<
  TimeBlock,
  {
    titleEn: string;
    titleTl: string;
    subEn: string;
    subTl: string;
    icon: React.ReactNode;
    headerBg: string;
  }
> = {
  morning: {
    titleEn: 'Morning (Umaga)',
    titleTl: 'Umaga (Pagkagising at Almusal)',
    subEn: '4:00 AM – 11:59 AM',
    subTl: '4:00 AM – 11:59 AM',
    icon: <Sunrise className="w-5 h-5 text-amber-500" />,
    headerBg: 'bg-amber-50 border-amber-200 text-amber-950'
  },
  afternoon: {
    titleEn: 'Afternoon (Tanghali / Hapon)',
    titleTl: 'Tanghali at Hapon (Tanghalian)',
    subEn: '12:00 PM – 5:29 PM',
    subTl: '12:00 PM – 5:29 PM',
    icon: <Sun className="w-5 h-5 text-sky-500" />,
    headerBg: 'bg-sky-50 border-sky-200 text-sky-950'
  },
  evening: {
    titleEn: 'Evening (Hapunan)',
    titleTl: 'Gabi (Hapunan)',
    subEn: '5:30 PM – 8:59 PM',
    subTl: '5:30 PM – 8:59 PM',
    icon: <Sunset className="w-5 h-5 text-orange-500" />,
    headerBg: 'bg-orange-50 border-orange-200 text-orange-950'
  },
  bedtime: {
    titleEn: 'Bedtime (Bago Matulog)',
    titleTl: 'Bago Matulog (Night)',
    subEn: '9:00 PM onwards',
    subTl: '9:00 PM pataas',
    icon: <Moon className="w-5 h-5 text-indigo-500" />,
    headerBg: 'bg-indigo-50 border-indigo-200 text-indigo-950'
  }
};

export function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => loadProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string>(() => loadActiveProfileId());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(() =>
    loadPrescriptions(loadProfiles())
  );
  const [doseLogs, setDoseLogs] = useState<Record<string, DoseLog>>(() => loadDoseLogs());
  const [fdaMedicines, setFdaMedicines] = useState<FdaPhMedicine[]>(() => loadAllFdaMedicines());

  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod>(getInitialTimelinePeriod);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  type ToastType = 'success' | 'info' | 'alert' | 'snooze' | 'trash' | 'bell' | 'calendar';
  interface ToastState {
    text: string;
    type: ToastType;
  }
  const [toast, setToast] = useState<ToastState | null>(null);
  const [fdaSearchFilter, setFdaSearchFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Persist active profile ID
  useEffect(() => {
    saveActiveProfileId(activeProfileId);
  }, [activeProfileId]);

  // Derived active profile & profile map
  const activeProfile = useMemo(() => {
    if (activeProfileId === 'all') return null;
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;
  }, [profiles, activeProfileId]);

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const p of profiles) {
      map.set(p.id, p);
    }
    return map;
  }, [profiles]);

  // Active routine (for current active profile, or primary profile as default)
  const currentRoutine = activeProfile ? activeProfile.routine : (profiles[0]?.routine || DEFAULT_ROUTINE);
  const isTl = currentRoutine.language === 'taglish';
  const todayStr = getTodayDateString();

  const showToast = (text: string, type: ToastType = 'info') => {
    setToast({ text, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const renderToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'snooze':
        return <Moon className="w-4 h-4 text-amber-300 shrink-0" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'trash':
        return <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'bell':
        return <Bell className="w-4 h-4 text-teal-300 shrink-0" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-teal-300 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-sky-300 shrink-0" />;
    }
  };

  // Toggle Language (Taglish <-> English) across all family profiles
  const toggleLanguage = () => {
    const nextLang: LanguageMode = currentRoutine.language === 'taglish' ? 'en' : 'taglish';
    const updated = profiles.map((p) => ({
      ...p,
      routine: { ...p.routine, language: nextLang }
    }));
    setProfiles(updated);
    saveProfiles(updated);
  };

  // Save updated Daily Routine for the active profile and recalculate their schedules
  const handleSaveRoutine = (updatedRoutine: DailyRoutine) => {
    const targetProfileId = activeProfile ? activeProfile.id : profiles[0]?.id;
    if (!targetProfileId) return;

    const updatedProfiles = profiles.map((p) =>
      p.id === targetProfileId ? { ...p, routine: updatedRoutine } : p
    );
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);

    const recalculated = prescriptions.map((med) =>
      med.profileId === targetProfileId
        ? {
            ...med,
            slots: generateScheduleSlots(updatedRoutine, med.frequency, med.mealRule)
          }
        : med
    );
    setPrescriptions(recalculated);
    savePrescriptions(recalculated);

    const targetName = profileMap.get(targetProfileId)?.name || 'Member';
    showToast(
      isTl
        ? `Na-update na ang oras ng kainan at gamot ni ${targetName}!`
        : `Daily routine updated for ${targetName}!`,
      'success'
    );
  };

  // Save or edit a family member profile from ProfileModal
  const handleSaveProfile = (savedProfile: UserProfile) => {
    const exists = profiles.some((p) => p.id === savedProfile.id);
    let updatedProfiles: UserProfile[];
    if (exists) {
      updatedProfiles = profiles.map((p) => (p.id === savedProfile.id ? savedProfile : p));
      const recalculated = prescriptions.map((med) =>
        med.profileId === savedProfile.id
          ? {
              ...med,
              slots: generateScheduleSlots(savedProfile.routine, med.frequency, med.mealRule)
            }
          : med
      );
      setPrescriptions(recalculated);
      savePrescriptions(recalculated);
    } else {
      updatedProfiles = [...profiles, savedProfile];
    }
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    setActiveProfileId(savedProfile.id);

    showToast(
      isTl
        ? `Na-save ang profile ni ${savedProfile.name}!`
        : `Saved profile for ${savedProfile.name}!`,
      'success'
    );
  };

  // Delete a family member profile (reallocates medicines to primary profile)
  const handleDeleteProfile = (profileIdToDelete: string) => {
    if (profiles.length <= 1) return;
    const toDelete = profileMap.get(profileIdToDelete);
    const updatedProfiles = profiles.filter((p) => p.id !== profileIdToDelete);
    const fallbackId = updatedProfiles[0].id;

    const reallocatedMeds = prescriptions.map((m) =>
      m.profileId === profileIdToDelete ? { ...m, profileId: fallbackId } : m
    );
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    setPrescriptions(reallocatedMeds);
    savePrescriptions(reallocatedMeds);

    if (activeProfileId === profileIdToDelete) {
      setActiveProfileId(fallbackId);
    }

    showToast(
      isTl
        ? `Inalis si ${toDelete?.name || 'miyembro'}. Ang mga gamot ay inilipat kay ${updatedProfiles[0].name}.`
        : `Removed ${toDelete?.name || 'member'}. Medicines moved to ${updatedProfiles[0].name}.`,
      'trash'
    );
  };

  // Restore entire family application state from a JSON backup file
  const handleRestoreBackup = (backup: ResetaTimeBackup) => {
    setProfiles(backup.profiles);
    setActiveProfileId(backup.activeProfileId);
    setPrescriptions(backup.prescriptions);
    setDoseLogs(backup.doseLogs);
    setFdaMedicines(loadAllFdaMedicines());
    showToast(
      isTl
        ? `Na-restore ang data para sa ${backup.profiles.length} miyembro ng pamilya!`
        : `Restored data for ${backup.profiles.length} family members!`,
      'success'
    );
  };

  // Add a new prescription from AddResetaModal
  const handleAddPrescription = (item: PrescriptionItem, newCustomMed?: FdaPhMedicine) => {
    if (newCustomMed) {
      saveCustomFdaMedicine(newCustomMed);
      setFdaMedicines(loadAllFdaMedicines());
    }
    const updated = [item, ...prescriptions];
    setPrescriptions(updated);
    savePrescriptions(updated);
    showToast(
      isTl
        ? `Naidagdag na ang ${item.brandName} sa iyong schedule!`
        : `Added ${item.brandName} to your daily schedule!`,
      'success'
    );
  };

  // Mark a dose as Taken, Snoozed, or Undo
  const handleDoseAction = (
    med: PrescriptionItem,
    slot: ScheduledSlot,
    action: 'taken' | 'snoozed' | 'reset'
  ) => {
    const logKey = `${todayStr}_${med.id}_${slot.id}`;
    const existingLog = doseLogs[logKey];
    const nextLogs = { ...doseLogs };

    if (action === 'taken') {
      playAlertChime();
      const nowTime = new Date().toTimeString().slice(0, 5);
      nextLogs[logKey] = {
        id: logKey,
        date: todayStr,
        prescriptionId: med.id,
        slotId: slot.id,
        status: 'taken',
        takenAt: nowTime
      };

      // Deduct 1 from Tingi stock if not already marked taken today
      if (!existingLog || existingLog.status !== 'taken') {
        const updatedMeds = prescriptions.map((p) =>
          p.id === med.id
            ? {
                ...p,
                stockOnHand: Math.max(0, p.stockOnHand - 1),
                dosesTakenTotal: p.dosesTakenTotal + 1
              }
            : p
        );
        setPrescriptions(updatedMeds);
        savePrescriptions(updatedMeds);
      }

      showToast(
        isTl
          ? `Nainom na: ${med.brandName} (${med.doseAmount})`
          : `Marked Taken: ${med.brandName} (${med.doseAmount})`,
        'success'
      );
    } else if (action === 'snoozed') {
      const now = new Date();
      const now24 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const snoozedTime = addMinutes(now24, 15);
      nextLogs[logKey] = {
        id: logKey,
        date: todayStr,
        prescriptionId: med.id,
        slotId: slot.id,
        status: 'snoozed',
        snoozedUntil: snoozedTime
      };
      showToast(
        isTl
          ? `Na-snooze ang ${med.brandName}. Paaalalahanan ka ulit nang ${formatTime12h(snoozedTime)}.`
          : `Snoozed ${med.brandName} until ${formatTime12h(snoozedTime)}.`,
        'snooze'
      );
    } else if (action === 'reset') {
      if (existingLog?.status === 'taken') {
        const updatedMeds = prescriptions.map((p) =>
          p.id === med.id
            ? {
                ...p,
                stockOnHand: p.stockOnHand + 1,
                dosesTakenTotal: Math.max(0, p.dosesTakenTotal - 1)
              }
            : p
        );
        setPrescriptions(updatedMeds);
        savePrescriptions(updatedMeds);
      }
      delete nextLogs[logKey];
    }

    setDoseLogs(nextLogs);
    saveDoseLogs(nextLogs);
  };

  // Add Tingi Refill Stock
  const handleAddTingiStock = (medId: string, addCount: number) => {
    const updated = prescriptions.map((p) =>
      p.id === medId ? { ...p, stockOnHand: p.stockOnHand + addCount } : p
    );
    setPrescriptions(updated);
    savePrescriptions(updated);
    showToast(
      isTl
        ? `Nadagdagan ng +${addCount} piraso ang iyong stock!`
        : `Added +${addCount} to your pill stock!`,
      'success'
    );
  };

  // Delete a prescription
  const handleDeletePrescription = (medId: string) => {
    const updated = prescriptions.filter((p) => p.id !== medId);
    setPrescriptions(updated);
    savePrescriptions(updated);
    showToast(isTl ? 'Inalis na ang gamot sa listahan.' : 'Removed medicine from schedule.', 'trash');
  };

  // Reset demo data
  const handleResetDemo = () => {
    const demos = buildDemoPrescriptions(profiles);
    setPrescriptions(demos);
    savePrescriptions(demos);
    setDoseLogs({});
    saveDoseLogs({});
    showToast(
      isTl
        ? 'Na-reset na ang sample Family Reseta schedule!'
        : 'Reset sample Family Reseta schedule!',
      'info'
    );
  };

  // Enable Browser / PWA Notifications
  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifStatus(perm);
    if (perm === 'granted') {
      playAlertChime();
      showToast(
        isTl
          ? 'Aktibo na ang Alert Notifications at Sound Chime!'
          : 'Medicine Alert Notifications & Sound Chime enabled!',
        'bell'
      );
    } else {
      showToast(
        isTl
          ? 'Naka-block ang browser notification. Magagamit pa rin ang In-App Sound at Phone Calendar Alarm (.ics)!'
          : 'Browser notifications blocked. You can still use In-App Chimes and Phone Calendar Alarms (.ics)!',
        'info'
      );
    }
  };

  // Background 20-second watcher while app is open to fire scheduled alerts with family member context
  useEffect(() => {
    const firedSet = new Set<string>();
    const timer = window.setInterval(() => {
      const now = new Date();
      const current24 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const med of prescriptions) {
        if (!med.active) continue;
        for (const slot of med.slots) {
          const logKey = `${todayStr}_${med.id}_${slot.id}`;
          const log = doseLogs[logKey];
          const targetTime = log?.status === 'snoozed' && log.snoozedUntil ? log.snoozedUntil : slot.time24;

          if (targetTime === current24 && log?.status !== 'taken') {
            const fireKey = `${logKey}_${targetTime}`;
            if (!firedSet.has(fireKey)) {
              firedSet.add(fireKey);
              const person = profileMap.get(med.profileId);
              triggerMedicineNotification(med, slot, currentRoutine.language, person?.name);
              showToast(
                isTl
                  ? `Oras na ng gamot${person ? ` ni ${person.name}` : ''}: ${med.brandName} (${med.doseAmount})`
                  : `Time for ${person ? `${person.name}'s ` : ''}medicine: ${med.brandName} (${med.doseAmount})`,
                'alert'
              );
            }
          }
        }
      }
    }, 20000);
    return () => window.clearInterval(timer);
  }, [prescriptions, doseLogs, todayStr, currentRoutine.language, isTl, profileMap]);

  // Flatten scheduled slots for today filtered by active profile (or combined when 'all')
  const flattenedTodaySlots = useMemo(() => {
    const list: {
      med: PrescriptionItem;
      slot: ScheduledSlot;
      log?: DoseLog;
      profile?: UserProfile;
    }[] = [];
    const targetMeds =
      activeProfileId === 'all'
        ? prescriptions
        : prescriptions.filter((m) => m.profileId === activeProfileId);

    for (const med of targetMeds) {
      if (!med.active) continue;
      for (const slot of med.slots) {
        const logKey = `${todayStr}_${med.id}_${slot.id}`;
        list.push({
          med,
          slot,
          log: doseLogs[logKey],
          profile: profileMap.get(med.profileId)
        });
      }
    }
    return list.sort((a, b) => timeToMinutes(a.slot.time24) - timeToMinutes(b.slot.time24));
  }, [prescriptions, doseLogs, todayStr, activeProfileId, profileMap]);

  // Progress Stats for Today
  const totalDosesToday = flattenedTodaySlots.length;
  const takenDosesToday = flattenedTodaySlots.filter((item) => item.log?.status === 'taken').length;
  const progressPercent = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 0;

  // Doses stats per time period for the segmented timeline tabs
  const periodStats = useMemo(() => {
    const stats: Record<TimeBlock, { total: number; taken: number }> = {
      morning: { total: 0, taken: 0 },
      afternoon: { total: 0, taken: 0 },
      evening: { total: 0, taken: 0 },
      bedtime: { total: 0, taken: 0 }
    };
    for (const item of flattenedTodaySlots) {
      const b = item.slot.timeBlock;
      if (stats[b]) {
        stats[b].total += 1;
        if (item.log?.status === 'taken') {
          stats[b].taken += 1;
        }
      }
    }
    return stats;
  }, [flattenedTodaySlots]);

  // Which time blocks to display based on selected period tab
  const activeBlocks: TimeBlock[] = useMemo(() => {
    if (selectedPeriod === 'all') {
      return ['morning', 'afternoon', 'evening', 'bedtime'];
    }
    return [selectedPeriod];
  }, [selectedPeriod]);

  // Low Tingi Stock Medicines filtered by active profile
  const lowStockMeds = useMemo(() => {
    const targetMeds =
      activeProfileId === 'all'
        ? prescriptions
        : prescriptions.filter((m) => m.profileId === activeProfileId);
    return targetMeds.filter(
      (m) =>
        m.active &&
        m.stockOnHand <= 4 &&
        m.dosesTakenTotal + m.stockOnHand < m.totalPrescribedQty
    );
  }, [prescriptions, activeProfileId]);

  // Prescriptions list for Tab 2
  const displayedPrescriptions = useMemo(() => {
    if (activeProfileId === 'all') return prescriptions;
    return prescriptions.filter((m) => m.profileId === activeProfileId);
  }, [prescriptions, activeProfileId]);

  // Categories for FDA PH Explorer
  const fdaCategories = useMemo(() => {
    const cats = new Set<string>(['All']);
    fdaMedicines.forEach((m) => cats.add(m.category));
    return Array.from(cats);
  }, [fdaMedicines]);

  const filteredFdaExplorer = useMemo(() => {
    const q = fdaSearchFilter.trim().toLowerCase();
    return fdaMedicines.filter((m) => {
      const matchesCat = selectedCategoryFilter === 'All' || m.category === selectedCategoryFilter;
      const matchesText =
        !q ||
        m.genericName.toLowerCase().includes(q) ||
        m.brandName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);
      return matchesCat && matchesText;
    });
  }, [fdaMedicines, fdaSearchFilter, selectedCategoryFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 w-full max-w-full overflow-x-hidden">
      {/* Top Floating Toast Banner */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-3 py-2 rounded-xl shadow-2xl border border-teal-500/40 text-xs font-bold flex items-center gap-2 max-w-sm w-[92%] animate-bounce"
        >
          {renderToastIcon(toast.type)}
          <span className="flex-1 leading-tight">{toast.text}</span>
        </div>
      )}

      {/* Top App Bar */}
      <header className="bg-linear-to-r from-teal-800 via-teal-700 to-sky-800 text-white shadow-md sticky top-0 z-30 w-full max-w-full overflow-hidden">
        <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Left: Branding */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="bg-white/15 p-1.5 rounded-lg border border-white/20 shadow-inner shrink-0">
              <Pill className="w-4 h-4 text-teal-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight truncate">ResetaTime</h1>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-1 py-0.2 rounded shrink-0">
                  PH
                </span>
              </div>
              <p className="text-[10px] text-teal-100 hidden md:block truncate">
                {isTl
                  ? 'Tagasalin ng Oras ng Reseta at Paalala sa Gamot'
                  : 'Smart Philippine Prescription Translator & Pill Alert'}
              </p>
            </div>
          </div>

          {/* Right: Compact Actions (No Overflow) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Family Members Manager Button */}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="h-8 px-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title={isTl ? 'Miyembro ng Pamilya' : 'Family Members'}
            >
              <Users className="w-3.5 h-3.5 text-teal-200" />
              <span className="hidden md:inline text-xs">
                {isTl ? 'Pamilya' : 'Family'}
              </span>
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="h-8 px-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-teal-200" />
              <span className="text-[11px] font-bold">{isTl ? 'TL' : 'EN'}</span>
            </button>

            {/* Daily Routine Settings Button */}
            <button
              type="button"
              onClick={() => setIsRoutineModalOpen(true)}
              className="h-8 px-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title={isTl ? 'Oras ng Kainan' : 'Meal Times'}
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline text-xs">
                {isTl ? 'Oras ng Kainan' : 'Meal Times'}
              </span>
            </button>

            {/* Primary Add Reseta CTA */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isTl ? 'Dagdag' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Family Member Quick Switcher Strip */}
        <div className="bg-teal-900/90 border-t border-white/10 w-full overflow-hidden">
          <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-0.5">
                <Users className="w-3 h-3 text-amber-300 shrink-0" />
                <span>{isTl ? 'Pasyente:' : 'Profile:'}</span>
              </span>

              {/* All Family Chip */}
              <button
                type="button"
                onClick={() => setActiveProfileId('all')}
                className={`h-6.5 px-2.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                  activeProfileId === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300/40'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/15'
                }`}
              >
                <span>{isTl ? 'Lahat (Pamilya)' : 'All Family'}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    activeProfileId === 'all'
                      ? 'bg-amber-500/50 text-slate-950'
                      : 'bg-black/20 text-teal-100'
                  }`}
                >
                  {prescriptions.length}
                </span>
              </button>

              {/* Individual Member Chips */}
              {profiles.map((p) => {
                const isActive = activeProfileId === p.id;
                const colorStyle = PILL_COLOR_STYLES[p.avatarColor] || PILL_COLOR_STYLES.teal;
                const medCount = prescriptions.filter((m) => m.profileId === p.id).length;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProfileId(p.id)}
                    className={`h-6.5 px-2.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white text-teal-950 shadow-xs ring-2 ring-teal-300'
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/15'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${colorStyle.dot}`} />
                    <span className="truncate max-w-[110px]">{p.name}</span>
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isActive ? 'bg-teal-100 text-teal-900' : 'bg-black/20 text-teal-100'
                      }`}
                    >
                      {medCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add / Manage Family Members CTA */}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="h-6.5 px-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-teal-100 hover:text-white text-[10px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer ml-auto"
              title={isTl ? 'Pamahalaan ang mga miyembro' : 'Manage family members'}
            >
              <Plus className="w-3 h-3 text-amber-300" />
              <span>{isTl ? 'Miyembro' : 'Member'}</span>
            </button>
          </div>
        </div>

        {/* User Routine Summary Strip */}
        <div className="bg-teal-950/80 border-t border-white/10 w-full overflow-hidden">
          <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-[10px] sm:text-xs text-teal-100 no-scrollbar whitespace-nowrap">
            {activeProfile ? (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{activeProfile.name}:</span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md">
                  <Sunrise className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>
                    {isTl ? 'Gising' : 'Wake'}:{' '}
                    <strong className="text-white">
                      {formatTime12h(activeProfile.routine.wakeTime)}
                    </strong>
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md">
                  <Utensils className="w-3 h-3 text-teal-300 shrink-0" />
                  <span>
                    {isTl ? 'Almusal' : 'Breakfast'}:{' '}
                    <strong className="text-white">
                      {formatTime12h(activeProfile.routine.breakfastTime)}
                    </strong>
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md">
                  <Utensils className="w-3 h-3 text-sky-300 shrink-0" />
                  <span>
                    {isTl ? 'Tanghali' : 'Lunch'}:{' '}
                    <strong className="text-white">
                      {formatTime12h(activeProfile.routine.lunchTime)}
                    </strong>
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md">
                  <Utensils className="w-3 h-3 text-orange-300 shrink-0" />
                  <span>
                    {isTl ? 'Hapon' : 'Dinner'}:{' '}
                    <strong className="text-white">
                      {formatTime12h(activeProfile.routine.dinnerTime)}
                    </strong>
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md">
                  <Moon className="w-3 h-3 text-indigo-300 shrink-0" />
                  <span>
                    {isTl ? 'Tulog' : 'Bed'}:{' '}
                    <strong className="text-white">
                      {formatTime12h(activeProfile.routine.bedTime)}
                    </strong>
                  </span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{isTl ? 'Buong Pamilya:' : 'All Family:'}</span>
                </span>
                <span className="text-teal-200">
                  {isTl
                    ? `${profiles.length} miyembro na may kanya-kanyang oras ng kainan`
                    : `${profiles.length} family members with individual meal schedules`}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsRoutineModalOpen(true)}
              className="text-amber-300 hover:text-amber-200 underline font-bold shrink-0 cursor-pointer ml-1 text-[10px] sm:text-xs"
            >
              {isTl ? 'Ayusin Oras' : 'Edit Routine'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-2.5 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
        {/* Progress & Alert Controls Hero Card */}
        <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                {isTl ? 'Schedule Ngayong Araw' : "Today's Plan"}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{todayStr}</span>
            </div>
            <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap leading-tight">
              {takenDosesToday === totalDosesToday && totalDosesToday > 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                  <span>
                    {isTl
                      ? 'Kumpleto na ang inom mo ngayong araw!'
                      : 'All doses completed for today!'}
                  </span>
                </>
              ) : isTl ? (
                `${takenDosesToday} sa ${totalDosesToday} na gamot ang nainom na`
              ) : (
                `${takenDosesToday} of ${totalDosesToday} scheduled doses taken`
              )}
            </h2>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-linear-to-r from-teal-600 to-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Alert & Calendar Sync Buttons - Responsive 50%/50% on mobile */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleEnableNotifications}
              className={`flex-1 sm:flex-initial h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                notifStatus === 'granted'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-950'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="text-[11px] sm:text-xs">
                {notifStatus === 'granted'
                  ? isTl ? 'Alerts On' : 'Alerts On'
                  : isTl ? 'I-on ang Alert' : 'Enable Alerts'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadIcsAlarms(
                  activeProfileId === 'all'
                    ? prescriptions
                    : prescriptions.filter((m) => m.profileId === activeProfileId),
                  currentRoutine.language,
                  profiles
                );
                showToast(
                  isTl
                    ? 'Na-download na ang Phone Calendar Alarms (.ics)!'
                    : 'Downloaded Phone Calendar Alarms (.ics)!',
                  'calendar'
                );
              }}
              className="flex-1 sm:flex-initial h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="text-[11px] sm:text-xs">{isTl ? 'Alarm (.ics)' : 'Alarms (.ics)'}</span>
            </button>
          </div>
        </section>

        {/* PH "Tingi" Low-Stock Warning Banner */}
        {lowStockMeds.length > 0 && (
          <section
            aria-label="Low pill stock alert"
            className="bg-amber-50 border border-amber-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-xs space-y-2"
          >
            <div className="flex items-start gap-2">
              <div className="bg-amber-200/80 p-1.5 rounded-lg text-amber-900 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-amber-800" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-amber-950 text-xs sm:text-sm">
                  {isTl
                    ? 'Paubos na ang Nabili Mong Gamot ("Tingi" Refill Alert)'
                    : 'Low Pill Stock Alert (Partial Purchase / "Tingi" Tracker)'}
                </h3>
                <p className="text-[10px] sm:text-xs text-amber-900 mt-0.5">
                  {isTl
                    ? 'Bumili na agad sa botika bago maubusan para hindi maputol ang gamutan:'
                    : 'Refill soon at the pharmacy so your treatment course is not interrupted:'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lowStockMeds.map((med) => {
                const remainingToBuy = Math.max(
                  0,
                  med.totalPrescribedQty - (med.dosesTakenTotal + med.stockOnHand)
                );
                return (
                  <div
                    key={med.id}
                    className="bg-white border border-amber-200 rounded-lg p-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {med.brandName} <span className="text-[10px] text-slate-500">({med.strength})</span>
                      </div>
                      <div className="text-[10px] text-rose-700 font-semibold truncate">
                        {isTl
                          ? `${med.stockOnHand} piraso na lang! (Kulang pa ng ${remainingToBuy})`
                          : `Only ${med.stockOnHand} left! (Need ${remainingToBuy} more)`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddTingiStock(med.id, remainingToBuy || 6)}
                      className="h-7 px-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] rounded-md shrink-0 cursor-pointer"
                    >
                      + {isTl ? `Bumili (+${remainingToBuy || 6})` : `Add +${remainingToBuy || 6}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 1: TODAY'S VISUAL TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Morning / Afternoon / Evening / Bedtime / All Time Period Tabs */}
            <div className="bg-white p-1 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="grid grid-cols-5 gap-1">
                {(
                  [
                    {
                      id: 'morning' as TimelinePeriod,
                      labelEn: 'Morning',
                      labelTl: 'Umaga',
                      icon: (active: boolean) => (
                        <Sunrise
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? 'text-amber-300' : 'text-amber-500'
                          }`}
                        />
                      )
                    },
                    {
                      id: 'afternoon' as TimelinePeriod,
                      labelEn: 'Afternoon',
                      labelTl: 'Tanghali',
                      icon: (active: boolean) => (
                        <Sun
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? 'text-amber-300' : 'text-sky-500'
                          }`}
                        />
                      )
                    },
                    {
                      id: 'evening' as TimelinePeriod,
                      labelEn: 'Evening',
                      labelTl: 'Gabi',
                      icon: (active: boolean) => (
                        <Sunset
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? 'text-amber-300' : 'text-orange-500'
                          }`}
                        />
                      )
                    },
                    {
                      id: 'bedtime' as TimelinePeriod,
                      labelEn: 'Bedtime',
                      labelTl: 'Tulog',
                      icon: (active: boolean) => (
                        <Moon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? 'text-indigo-200' : 'text-indigo-500'
                          }`}
                        />
                      )
                    },
                    {
                      id: 'all' as TimelinePeriod,
                      labelEn: 'All Day',
                      labelTl: 'Lahat',
                      icon: (active: boolean) => (
                        <Calendar
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? 'text-teal-200' : 'text-teal-700'
                          }`}
                        />
                      )
                    }
                  ] as const
                ).map((tab) => {
                  const isActive = selectedPeriod === tab.id;
                  const stat =
                    tab.id === 'all'
                      ? { total: flattenedTodaySlots.length, taken: takenDosesToday }
                      : periodStats[tab.id];
                  const count = stat?.total ?? 0;
                  const taken = stat?.taken ?? 0;
                  const isAllDone = count > 0 && taken === count;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedPeriod(tab.id)}
                      className={`h-11 sm:h-12 rounded-lg sm:rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center px-1 text-center relative ${
                        isActive
                          ? 'bg-teal-700 text-white font-extrabold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-1 leading-none">
                        {tab.icon(isActive)}
                        <span
                          className={`text-[10px] font-bold px-1 py-0.2 rounded-full leading-tight ${
                            isActive
                              ? 'bg-teal-900/60 text-teal-100'
                              : isAllDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isAllDone ? (
                            <Check className="w-2.5 h-2.5 stroke-[3] inline-block" />
                          ) : (
                            count
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] tracking-tight mt-0.5 truncate max-w-full leading-tight">
                        {isTl ? tab.labelTl : tab.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Block Content */}
            {activeBlocks.map((block) => {
              const blockItems = flattenedTodaySlots.filter((i) => i.slot.timeBlock === block);
              const meta = TIME_BLOCK_META[block];
              const blockStat = periodStats[block];

              if (blockItems.length === 0) {
                if (selectedPeriod === 'all') return null;
                return (
                  <div
                    key={block}
                    className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-5 text-center space-y-2 shadow-2xs"
                  >
                    <div className="w-9 h-9 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      {meta.icon}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">
                      {isTl
                        ? `Walang nakatakdang gamot sa ${meta.titleTl.split('(')[0].trim()}`
                        : `No medicines scheduled for ${meta.titleEn.split('(')[0].trim()}`}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isTl
                        ? `Nasa ibang oras ang iyong mga gamot ngayon.`
                        : `Your scheduled doses for today are set in other time blocks.`}
                    </p>
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPeriod('all')}
                        className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                      >
                        {isTl ? 'Tingnan ang Lahat ng Oras' : 'View All Times'} →
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <section key={block} className="space-y-1.5 sm:space-y-2">
                  {/* Time Block Header */}
                  <div
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${meta.headerBg}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {meta.icon}
                      <h3 className="font-extrabold text-xs sm:text-sm truncate">
                        {isTl ? meta.titleTl : meta.titleEn}
                      </h3>
                      <span className="text-[10px] opacity-75 hidden xs:inline">
                        • {isTl ? meta.subTl : meta.subEn}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold opacity-90 shrink-0">
                      {blockStat?.taken === blockItems.length && blockItems.length > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          {isTl ? 'Lahat Nainom Na' : 'All Taken'}
                        </span>
                      ) : (
                        `${blockStat?.taken ?? 0} of ${blockItems.length} taken`
                      )}
                    </span>
                  </div>

                  {/* Dose Cards in this Time Block - Compact, only Time, Qty, Name, Small Note & Same Buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    {blockItems.map(({ med, slot, log, profile }) => {
                      const isTaken = log?.status === 'taken';
                      const isSnoozed = log?.status === 'snoozed';
                      const style = PILL_COLOR_STYLES[med.pillColor] || PILL_COLOR_STYLES.teal;
                      const profileColorStyle = profile
                        ? PILL_COLOR_STYLES[profile.avatarColor] || PILL_COLOR_STYLES.teal
                        : null;

                      return (
                        <div
                          key={`${med.id}-${slot.id}`}
                          className={`rounded-xl border p-2.5 sm:p-3 transition-all bg-white shadow-2xs ${
                            isTaken
                              ? 'border-emerald-300 bg-emerald-50/40 opacity-85'
                              : style.border
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            {/* Top: Time Badge + Medicine Name & Small Note */}
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                              {/* Time & Quantity Badge */}
                              <div
                                className={`w-[66px] sm:w-[74px] text-center px-1 py-1 rounded-lg border shrink-0 ${
                                  isTaken
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-slate-900 text-white border-slate-900'
                                }`}
                              >
                                <div className="text-xs sm:text-sm font-extrabold leading-tight">
                                  {formatTime12h(slot.time24)}
                                </div>
                                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-teal-300 leading-tight mt-0.5 truncate">
                                  {med.doseAmount}
                                </div>
                              </div>

                              {/* Medicine Name & Small Notes ONLY */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                  {/* Person Name Badge */}
                                  {profile && (
                                    <span
                                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md inline-flex items-center gap-1 shrink-0 ${
                                        profileColorStyle?.badge || 'bg-slate-100 text-slate-800'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          profileColorStyle?.dot || 'bg-teal-600'
                                        }`}
                                      />
                                      <span className="truncate max-w-[85px]">{profile.name}</span>
                                    </span>
                                  )}
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${style.dot}`}
                                    aria-hidden="true"
                                  />
                                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                                    {med.brandName}
                                  </h4>
                                  {med.classification === 'Rx' && (
                                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-100 text-rose-800 shrink-0">
                                      Rx
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                                  {med.genericName} • {med.strength}
                                </div>

                                {/* Small Note (clean, subtle single line note) */}
                                {(med.doctorNotes || slot.reasonEn) && (
                                  <p className="text-[10px] sm:text-[11px] text-slate-500 italic truncate flex items-center gap-1 mt-0.5">
                                    <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">
                                      {med.doctorNotes ? `"${med.doctorNotes}"` : (isTl ? slot.reasonTl : slot.reasonEn)}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Bottom: Same Action Buttons */}
                            <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                              {isTaken ? (
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px] min-w-0 truncate">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span className="truncate">
                                      {isTl
                                        ? `Nainom na (${log?.takenAt ? formatTime12h(log.takenAt) : 'Done'})`
                                        : `Taken (${log?.takenAt ? formatTime12h(log.takenAt) : 'Done'})`}
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDoseAction(med, slot, 'reset')}
                                    className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer shrink-0"
                                  >
                                    {isTl ? 'Bawiin' : 'Undo'}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 w-full">
                                  <button
                                    type="button"
                                    onClick={() => handleDoseAction(med, slot, 'taken')}
                                    className="flex-1 min-w-0 h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{isTl ? 'Ininom Na' : 'Mark Taken'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDoseAction(med, slot, 'snoozed')}
                                    className="h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                    title="Snooze 15 minutes"
                                  >
                                    <Moon className="w-3 h-3 text-slate-600 shrink-0" />
                                    <span className="text-[11px]">
                                      {isSnoozed && log?.snoozedUntil
                                        ? formatTime12h(log.snoozedUntil)
                                        : '+15m'}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      triggerMedicineNotification(
                                        med,
                                        slot,
                                        currentRoutine.language,
                                        profile?.name
                                      )
                                    }
                                    className="h-8 sm:h-8.5 w-8 sm:w-8.5 rounded-lg bg-slate-100 hover:bg-teal-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                    title={isTl ? 'Subukan ang Tunog at Alert' : 'Test Sound & Alert'}
                                    aria-label="Test Sound and Notification"
                                  >
                                    <Volume2 className="w-3.5 h-3.5 shrink-0" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation footer between periods (when not in 'all' view) */}
                  {selectedPeriod !== 'all' && (
                    <div className="flex items-center justify-between pt-1 px-1 text-xs">
                      {selectedPeriod === 'morning' ? (
                        <span />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const order: TimelinePeriod[] = ['morning', 'afternoon', 'evening', 'bedtime'];
                            const idx = order.indexOf(selectedPeriod);
                            if (idx > 0) setSelectedPeriod(order[idx - 1]);
                          }}
                          className="font-bold text-slate-500 hover:text-slate-900 cursor-pointer text-[11px] flex items-center gap-1"
                        >
                          ← {isTl ? 'Nakaraan' : 'Previous'}
                        </button>
                      )}

                      {selectedPeriod === 'bedtime' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('morning')}
                          className="font-bold text-teal-700 hover:text-teal-800 cursor-pointer text-[11px] flex items-center gap-1"
                        >
                          {isTl ? 'Umaga' : 'Morning'} ↺
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const order: TimelinePeriod[] = ['morning', 'afternoon', 'evening', 'bedtime'];
                            const idx = order.indexOf(selectedPeriod);
                            if (idx < order.length - 1) setSelectedPeriod(order[idx + 1]);
                          }}
                          className="font-bold text-teal-700 hover:text-teal-800 cursor-pointer text-[11px] flex items-center gap-1 ml-auto"
                        >
                          {isTl ? 'Susunod' : 'Next'} →
                        </button>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* TAB 2: MY MEDICINES & "TINGI" STOCK TRACKER */}
        {activeTab === 'medicines' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {isTl
                    ? 'Lahat ng Reseta at "Tingi" Stock Tracker'
                    : 'Active Prescriptions & Pill Inventory'}
                </h3>
                <p className="text-xs text-slate-600">
                  {isTl
                    ? 'Subaybayan kung ilang piraso pa ang kulang sa iyong reseta (#)'
                    : 'Track how many pills you have left vs. the total # prescribed by your doctor'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isTl ? 'I-reset' : 'Reset Demo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="h-9 px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTl ? 'Magdagdag' : 'Add Medicine'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedPrescriptions.length === 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3 col-span-full">
                  <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                    <Pill className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {isTl
                      ? `Walang nakalistang gamot para kay ${activeProfile?.name || 'pasyente'}`
                      : `No prescriptions found for ${activeProfile?.name || 'this member'}`}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isTl
                      ? 'Magdagdag ng reseta sa pamamagitan ng pag-click sa "+ Magdagdag" button.'
                      : 'Add a new prescription by clicking the "+ Add Medicine" button.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isTl ? 'Magdagdag ng Gamot' : 'Add Medicine'}</span>
                  </button>
                </div>
              )}

              {displayedPrescriptions.map((med) => {
                const totalNeeded = med.totalPrescribedQty;
                const stillToBuy = Math.max(
                  0,
                  totalNeeded - (med.dosesTakenTotal + med.stockOnHand)
                );
                const coursePercent = Math.min(
                  100,
                  Math.round((med.dosesTakenTotal / Math.max(1, totalNeeded)) * 100)
                );
                const medProfile = profileMap.get(med.profileId);
                const profileStyle = medProfile
                  ? PILL_COLOR_STYLES[medProfile.avatarColor] || PILL_COLOR_STYLES.teal
                  : null;

                return (
                  <div
                    key={med.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                              {med.category}
                            </span>
                            {medProfile && (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                                  profileStyle?.badge || 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    profileStyle?.dot || 'bg-teal-600'
                                  }`}
                                />
                                <span>{medProfile.name}</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-extrabold text-slate-900 mt-1">
                            {med.brandName}{' '}
                            <span className="text-sm font-bold text-slate-500">
                              ({med.strength})
                            </span>
                          </h4>
                          <p className="text-xs text-slate-600 font-medium">
                            Generic: {med.genericName} • {med.form}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePrescription(med.id)}
                          className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete prescription"
                          aria-label={`Remove ${med.brandName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Schedule Time Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {med.slots.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-1 rounded-xl"
                          >
                            <Clock className="w-3.5 h-3.5 text-teal-700" />
                            {formatTime12h(s.time24)}
                          </span>
                        ))}
                      </div>

                      {med.doctorNotes && (
                        <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700">
                          <strong>Reseta:</strong> {med.doctorNotes}
                        </div>
                      )}
                    </div>

                    {/* Tingi & Course Progress Box */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>{isTl ? 'Hawak mong Stock:' : 'Current Pill Stock:'}</span>{' '}
                          <strong className="text-teal-800 text-sm">{med.stockOnHand} pcs</strong>
                        </span>
                        <span className="text-slate-600 font-semibold">
                          {isTl ? 'Nainom na:' : 'Taken:'} {med.dosesTakenTotal} / #{totalNeeded}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full"
                          style={{ width: `${coursePercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-xs text-slate-600">
                          {stillToBuy > 0
                            ? isTl
                              ? `Kulang pa ng ${stillToBuy} piraso para mabuo ang #${totalNeeded}`
                              : `Need ${stillToBuy} more to complete #${totalNeeded}`
                            : isTl
                            ? 'Kumpleto na ang biniling stock!'
                            : 'Full prescription quantity covered!'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddTingiStock(med.id, 6)}
                            className="min-h-[38px] px-3 py-1 bg-white hover:bg-teal-50 border border-slate-300 rounded-xl text-xs font-bold text-teal-800 cursor-pointer"
                          >
                            +6 Tingi
                          </button>
                          {stillToBuy > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAddTingiStock(med.id, stillToBuy)}
                              className="min-h-[38px] px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              +{stillToBuy} {isTl ? 'Buuin' : 'Full'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: RESETATIME DECODER GUIDE & FDA PH DATABASE EXPLORER */}
        {activeTab === 'decoder' && (
          <div className="space-y-6">
            {/* Doctor's Reseta Shorthand Dictionary */}
            <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-amber-100 p-2.5 rounded-2xl text-amber-800">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {isTl
                      ? 'Diksyunaryo ng Sulat ng Doktor sa Reseta'
                      : "Doctor's Prescription (Reseta) Shorthand Decoder"}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {isTl
                      ? 'Ano ang ibig sabihin ng OD, BID, TID, PC, AC, HS, at # sa iyong reseta?'
                      : 'Plain-language guide to common medical abbreviations on Philippine prescriptions'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    code: 'OD / QD',
                    meaningEn: 'Once a day (1x daily)',
                    meaningTl: '1 beses sa isang araw',
                    example: 'e.g. 7:30 AM every morning'
                  },
                  {
                    code: 'BID / q12h',
                    meaningEn: 'Twice a day / Every 12 hours',
                    meaningTl: '2 beses sa isang araw (Umaga at Gabi)',
                    example: 'e.g. 7:30 AM & 7:30 PM'
                  },
                  {
                    code: 'TID / q8h',
                    meaningEn: '3x a day / Every 8 hours',
                    meaningTl: '3 beses sa isang araw',
                    example: 'Breakfast, Lunch & Dinner (or 8h gap)'
                  },
                  {
                    code: 'QID / q6h',
                    meaningEn: '4x a day / Every 6 hours',
                    meaningTl: '4 na beses sa isang araw (Kada 6 oras)',
                    example: 'e.g. 6 AM, 12 PM, 6 PM, 12 AM'
                  },
                  {
                    code: 'AC (Ante Cibum)',
                    meaningEn: '30–60 mins BEFORE meals',
                    meaningTl: '30–60 minuto BAGO kumain (walang laman tiyan)',
                    example: 'Common for Omeprazole / Pantoprazole'
                  },
                  {
                    code: 'PC (Post Cibum)',
                    meaningEn: 'AFTER meals (+30 mins)',
                    meaningTl: 'PAGKATAPOS kumain (proteksyon sa sikmura)',
                    example: 'Common for Antibiotics & Pain relievers'
                  },
                  {
                    code: 'HS (Hora Somni)',
                    meaningEn: 'At Bedtime (Before sleeping)',
                    meaningTl: 'Bago matulog sa gabi',
                    example: 'Common for Atorvastatin & Cetirizine'
                  },
                  {
                    code: 'PRN',
                    meaningEn: 'As Needed Only',
                    meaningTl: 'Kapag kailangan lang (hal. may lagnat o kirot)',
                    example: 'Stop taking once symptoms disappear'
                  },
                  {
                    code: '#14 / #21 / Sig.',
                    meaningEn: '# = Total pieces to buy; Sig = Directions',
                    meaningTl: '# = Kabuuang bilang na bibilhin; Sig = Paano inumin',
                    example: '#21 means 21 tablets for the full course'
                  }
                ].map((item) => (
                  <div
                    key={item.code}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1"
                  >
                    <div className="text-sm font-extrabold text-teal-800">{item.code}</div>
                    <div className="text-xs font-bold text-slate-900">
                      {isTl ? item.meaningTl : item.meaningEn}
                    </div>
                    <div className="text-[11px] text-slate-500">{item.example}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Offline FDA Philippines Drug Database Browser */}
            <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-700 shrink-0" />
                    <span>{isTl ? 'FDA Philippines Medicine Directory (Offline)' : 'FDA Philippines Offline Drug Directory'}</span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    {isTl
                      ? `May ${fdaMedicines.length} na gamot (Generic + Brand). I-tap ang "+ Gamitin" para agad mailagay sa iyong schedule.`
                      : `Showing ${fdaMedicines.length} FDA PH medicines (Generic + Brand). Tap "+ Schedule" on any drug to add it.`}
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fdaSearchFilter}
                    onChange={(e) => setFdaSearchFilter(e.target.value)}
                    placeholder={isTl ? 'Hanapin ang Brand o Generic...' : 'Search Brand or Generic...'}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {fdaCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                      selectedCategoryFilter === cat
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Medicine Directory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredFdaExplorer.map((med) => (
                  <div
                    key={med.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/60 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {med.brandName}
                        </span>
                        <span className="text-xs font-bold text-teal-700">{med.strength}</span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium">
                        Generic: <strong>{med.genericName}</strong> ({med.form})
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {isTl ? med.commonTipTl : med.commonTipEn}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const targetProfileId = activeProfile
                          ? activeProfile.id
                          : profiles[0]?.id || DEFAULT_SELF_PROFILE_ID;
                        const targetRoutine = activeProfile ? activeProfile.routine : currentRoutine;
                        const newRx: PrescriptionItem = {
                          id: `rx-${Date.now()}`,
                          profileId: targetProfileId,
                          genericName: med.genericName,
                          brandName: med.brandName.split('/')[0].trim(),
                          strength: med.strength,
                          form: med.form,
                          classification: med.classification,
                          category: med.category,
                          doseAmount: med.defaultDose,
                          frequency: med.defaultFrequency,
                          mealRule: med.defaultMealRule,
                          durationDays: med.category.includes('Maintenance') ? null : 7,
                          startDate: todayStr,
                          totalPrescribedQty: 14,
                          stockOnHand: 10,
                          dosesTakenTotal: 0,
                          slots: generateScheduleSlots(
                            targetRoutine,
                            med.defaultFrequency,
                            med.defaultMealRule
                          ),
                          tipEn: med.commonTipEn,
                          tipTl: med.commonTipTl,
                          pillColor: med.pillColor,
                          active: true
                        };
                        handleAddPrescription(newRx);
                        setActiveTab('timeline');
                      }}
                      className="min-h-[42px] px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      + {isTl ? 'Idagdag' : 'Schedule'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Bottom Sticky Mobile-Friendly Navigation Bar */}
      <nav
        aria-label="Primary Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg"
      >
        <div className="max-w-lg mx-auto px-2 sm:px-4 py-1.5 grid grid-cols-3 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`min-h-[48px] sm:min-h-[52px] px-1 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 font-bold text-[11px] sm:text-xs transition-colors cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-teal-50 text-teal-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate max-w-full text-center leading-tight">
              {isTl ? 'Schedule' : 'Schedule'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medicines')}
            className={`min-h-[48px] sm:min-h-[52px] px-1 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 font-bold text-[11px] sm:text-xs transition-colors cursor-pointer relative ${
              activeTab === 'medicines'
                ? 'bg-teal-50 text-teal-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate max-w-full text-center leading-tight">
              {isTl ? 'Mga Gamot' : 'Meds & Stock'}
            </span>
            {lowStockMeds.length > 0 && (
              <span className="absolute top-1 right-2 sm:right-5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decoder')}
            className={`min-h-[48px] sm:min-h-[52px] px-1 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 font-bold text-[11px] sm:text-xs transition-colors cursor-pointer ${
              activeTab === 'decoder'
                ? 'bg-teal-50 text-teal-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate max-w-full text-center leading-tight">
              {isTl ? 'Gabay & FDA' : 'Guide & FDA'}
            </span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AddResetaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        fdaMedicines={fdaMedicines}
        existingPrescriptions={prescriptions}
        onSavePrescription={handleAddPrescription}
        language={currentRoutine.language}
      />

      <RoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        routine={currentRoutine}
        onSaveRoutine={handleSaveRoutine}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={(id) => setActiveProfileId(id)}
        onSaveProfile={handleSaveProfile}
        onDeleteProfile={handleDeleteProfile}
        onRestoreBackup={handleRestoreBackup}
        language={currentRoutine.language}
      />
    </div>
  );
}

export default App;
