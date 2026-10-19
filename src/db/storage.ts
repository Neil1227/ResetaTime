import {
  DailyRoutine,
  DoseLog,
  FdaPhMedicine,
  PrescriptionItem,
  UserProfile
} from '../types';
import { FDA_PH_MEDICINES } from '../data/fdaPhMedicines';
import { generateScheduleSlots } from '../utils/scheduleEngine';

const KEYS = {
  PROFILES: 'resetatime_ph_profiles_v2',
  ACTIVE_PROFILE_ID: 'resetatime_ph_active_profile_v2',
  PRESCRIPTIONS: 'resetatime_ph_prescriptions_v2',
  DOSE_LOGS: 'resetatime_ph_logs_v2',
  CUSTOM_MEDS: 'resetatime_ph_custom_meds_v1',
  // Legacy v1 keys for auto-migration
  LEGACY_ROUTINE: 'resetatime_ph_routine_v1',
  LEGACY_PRESCRIPTIONS: 'resetatime_ph_prescriptions_v1',
  LEGACY_DOSE_LOGS: 'resetatime_ph_logs_v1'
};

export const DEFAULT_ROUTINE: DailyRoutine = {
  wakeTime: '06:30',
  breakfastTime: '07:00',
  lunchTime: '12:00',
  dinnerTime: '19:00',
  bedTime: '22:00',
  language: 'taglish'
};

export const DEFAULT_SELF_PROFILE_ID = 'prof-self';

export const INITIAL_FAMILY_PROFILES: UserProfile[] = [
  {
    id: DEFAULT_SELF_PROFILE_ID,
    name: 'Ako (Self)',
    role: 'self',
    avatarColor: 'teal',
    routine: DEFAULT_ROUTINE,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prof-nanay',
    name: 'Nanay Rosa',
    role: 'mother',
    avatarColor: 'rose',
    routine: {
      ...DEFAULT_ROUTINE,
      wakeTime: '05:30',
      breakfastTime: '06:30',
      lunchTime: '11:30',
      dinnerTime: '18:30',
      bedTime: '21:30'
    },
    notes: 'Senior Citizen • Hypertensive & GERD care',
    createdAt: new Date().toISOString()
  }
];

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ----------------------------------------------------
// PROFILES API (Family / Caregiver Multi-Profile)
// ----------------------------------------------------

export function loadProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(KEYS.PROFILES);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return migrateFromV1();
}

export function saveProfiles(profiles: UserProfile[]): void {
  localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
}

export function loadActiveProfileId(): string {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVE_PROFILE_ID);
    if (raw) return raw;
  } catch {
    // fallback
  }
  return DEFAULT_SELF_PROFILE_ID;
}

export function saveActiveProfileId(id: string): void {
  localStorage.setItem(KEYS.ACTIVE_PROFILE_ID, id);
}

// ----------------------------------------------------
// AUTO-MIGRATION FROM V1 TO V2
// ----------------------------------------------------

function migrateFromV1(): UserProfile[] {
  let legacyRoutine = DEFAULT_ROUTINE;
  try {
    const legacyRaw = localStorage.getItem(KEYS.LEGACY_ROUTINE);
    if (legacyRaw) {
      legacyRoutine = { ...DEFAULT_ROUTINE, ...JSON.parse(legacyRaw) };
    }
  } catch {
    // ignore
  }

  const initialProfiles: UserProfile[] = [
    {
      id: DEFAULT_SELF_PROFILE_ID,
      name: 'Ako (Self)',
      role: 'self',
      avatarColor: 'teal',
      routine: legacyRoutine,
      createdAt: new Date().toISOString()
    },
    {
      id: 'prof-nanay',
      name: 'Nanay Rosa',
      role: 'mother',
      avatarColor: 'rose',
      routine: {
        ...legacyRoutine,
        wakeTime: '05:30',
        breakfastTime: '06:30',
        lunchTime: '11:30',
        dinnerTime: '18:30',
        bedTime: '21:30'
      },
      notes: 'Senior Citizen',
      createdAt: new Date().toISOString()
    }
  ];

  saveProfiles(initialProfiles);
  saveActiveProfileId(DEFAULT_SELF_PROFILE_ID);

  // Migrate legacy prescriptions if any
  try {
    const legacyRxRaw = localStorage.getItem(KEYS.LEGACY_PRESCRIPTIONS);
    if (legacyRxRaw) {
      const legacyRx: PrescriptionItem[] = JSON.parse(legacyRxRaw);
      const migratedRx: PrescriptionItem[] = legacyRx.map((rx) => ({
        ...rx,
        profileId: rx.profileId || DEFAULT_SELF_PROFILE_ID
      }));
      savePrescriptions(migratedRx);
    } else {
      const demos = buildDemoPrescriptions(initialProfiles);
      savePrescriptions(demos);
    }
  } catch {
    const demos = buildDemoPrescriptions(initialProfiles);
    savePrescriptions(demos);
  }

  // Migrate legacy logs
  try {
    const legacyLogsRaw = localStorage.getItem(KEYS.LEGACY_DOSE_LOGS);
    if (legacyLogsRaw) {
      const legacyLogs: Record<string, DoseLog> = JSON.parse(legacyLogsRaw);
      saveDoseLogs(legacyLogs);
    }
  } catch {
    // ignore
  }

  return initialProfiles;
}

// ----------------------------------------------------
// PRESCRIPTIONS & DEMO BUILDER
// ----------------------------------------------------

export function buildDemoPrescriptions(profiles: UserProfile[]): PrescriptionItem[] {
  const today = getTodayDateString();
  const selfProfile = profiles.find((p) => p.id === DEFAULT_SELF_PROFILE_ID) || profiles[0];
  const nanayProfile = profiles.find((p) => p.id === 'prof-nanay') || profiles[1] || selfProfile;

  const selfRoutine = selfProfile.routine;
  const nanayRoutine = nanayProfile.routine;

  return [
    // Nanay's Meds: Omeprazole (GERD) & Augmentin (Antibiotic Course)
    {
      id: 'demo-omeprazole',
      profileId: nanayProfile.id,
      genericName: 'Omeprazole',
      brandName: 'Omepron / RiteMED Omeprazole',
      strength: '20 mg',
      form: 'Capsule',
      classification: 'Rx',
      category: 'Acid / Ulcer / GERD',
      doseAmount: '1 capsule',
      frequency: 'OD',
      mealRule: 'AC',
      durationDays: 14,
      startDate: today,
      totalPrescribedQty: 14,
      stockOnHand: 10,
      dosesTakenTotal: 4,
      slots: generateScheduleSlots(nanayRoutine, 'OD', 'AC'),
      tipEn: 'Take 30 to 60 minutes BEFORE breakfast on an empty stomach so it works when you eat.',
      tipTl: 'Inumin 30 minuto BAGO mag-almusal (walang laman ang tiyan) para gumana nang tama.',
      doctorNotes: 'Sig: 1 cap OD AC (30 mins before breakfast) #14',
      pillColor: 'violet',
      active: true
    },
    {
      id: 'demo-coamoxiclav',
      profileId: nanayProfile.id,
      genericName: 'Co-Amoxiclav (Amoxicillin + Clavulanate)',
      brandName: 'Augmentin / Natravox',
      strength: '625 mg',
      form: 'Tablet',
      classification: 'Rx',
      category: 'Antibiotic',
      doseAmount: '1 tablet',
      frequency: 'Q12H',
      mealRule: 'PC',
      durationDays: 7,
      startDate: today,
      totalPrescribedQty: 14,
      stockOnHand: 3, // Low Tingi stock example!
      dosesTakenTotal: 5,
      slots: generateScheduleSlots(nanayRoutine, 'Q12H', 'PC'),
      tipEn: 'Take right after meals. Finish the entire #14 prescribed course to prevent bacterial resistance.',
      tipTl: 'Inumin agad pagkatapos kumain. Ubusin ang buong #14 sa reseta para hindi lumakas ang impeksyon.',
      doctorNotes: 'Sig: 1 tab q12h PC for 7 days #14',
      pillColor: 'amber',
      active: true
    },
    // Self Meds: Solmux & Atorvastatin
    {
      id: 'demo-solmux',
      profileId: selfProfile.id,
      genericName: 'Carbocisteine',
      brandName: 'Solmux',
      strength: '500 mg',
      form: 'Capsule',
      classification: 'OTC',
      category: 'Cough with Phlegm',
      doseAmount: '1 capsule',
      frequency: 'TID',
      mealRule: 'PC',
      durationDays: 5,
      startDate: today,
      totalPrescribedQty: 15,
      stockOnHand: 12,
      dosesTakenTotal: 3,
      slots: generateScheduleSlots(selfRoutine, 'TID', 'PC'),
      tipEn: 'Drink plenty of water throughout the day to help thin and loosen phlegm.',
      tipTl: 'Uminom ng maraming tubig sa buong araw para madaling mailabas ang plema.',
      doctorNotes: 'Sig: 1 cap TID PC #15',
      pillColor: 'emerald',
      active: true
    },
    {
      id: 'demo-atorvastatin',
      profileId: selfProfile.id,
      genericName: 'Atorvastatin Calcium',
      brandName: 'Lipitor / Avamax',
      strength: '20 mg',
      form: 'Tablet',
      classification: 'Rx',
      category: 'Cholesterol / Maintenance',
      doseAmount: '1 tablet',
      frequency: 'OD',
      mealRule: 'HS',
      durationDays: null,
      startDate: today,
      totalPrescribedQty: 30,
      stockOnHand: 18,
      dosesTakenTotal: 12,
      slots: generateScheduleSlots(selfRoutine, 'OD', 'HS'),
      tipEn: 'Taken at bedtime because the body produces most cholesterol at night.',
      tipTl: 'Iniinom bago matulog dahil sa gabi gumagawa ng cholesterol ang katawan.',
      doctorNotes: 'Sig: 1 tab OD HS #30',
      pillColor: 'blue',
      active: true
    }
  ];
}

export function loadPrescriptions(profiles?: UserProfile[]): PrescriptionItem[] {
  try {
    const raw = localStorage.getItem(KEYS.PRESCRIPTIONS);
    if (!raw) {
      const activeProfiles = profiles || loadProfiles();
      const demos = buildDemoPrescriptions(activeProfiles);
      savePrescriptions(demos);
      return demos;
    }
    const parsed: PrescriptionItem[] = JSON.parse(raw);
    // Ensure all prescriptions have a profileId
    const defaultId = (profiles && profiles[0]?.id) || DEFAULT_SELF_PROFILE_ID;
    return parsed.map((item) => ({
      ...item,
      profileId: item.profileId || defaultId
    }));
  } catch {
    const activeProfiles = profiles || loadProfiles();
    return buildDemoPrescriptions(activeProfiles);
  }
}

export function savePrescriptions(items: PrescriptionItem[]): void {
  localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(items));
}

// ----------------------------------------------------
// DOSE LOGS API
// ----------------------------------------------------

export function loadDoseLogs(): Record<string, DoseLog> {
  try {
    const raw = localStorage.getItem(KEYS.DOSE_LOGS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveDoseLogs(logs: Record<string, DoseLog>): void {
  localStorage.setItem(KEYS.DOSE_LOGS, JSON.stringify(logs));
}

// ----------------------------------------------------
// FDA MEDICINE DIRECTORY API
// ----------------------------------------------------

export function loadAllFdaMedicines(): FdaPhMedicine[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_MEDS);
    const custom: FdaPhMedicine[] = raw ? JSON.parse(raw) : [];
    return [...custom, ...FDA_PH_MEDICINES];
  } catch {
    return FDA_PH_MEDICINES;
  }
}

export function saveCustomFdaMedicine(med: FdaPhMedicine): void {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_MEDS);
    const custom: FdaPhMedicine[] = raw ? JSON.parse(raw) : [];
    const updated = [med, ...custom.filter((c) => c.id !== med.id)];
    localStorage.setItem(KEYS.CUSTOM_MEDS, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

// ----------------------------------------------------
// ZERO-CLOUD BACKUP & RESTORE (.JSON) API
// ----------------------------------------------------

export interface ResetaTimeBackup {
  app: 'resetatime-ph';
  version: number;
  exportedAt: string;
  profiles: UserProfile[];
  activeProfileId: string;
  prescriptions: PrescriptionItem[];
  doseLogs: Record<string, DoseLog>;
  customMeds?: FdaPhMedicine[];
}

export function createBackupData(): ResetaTimeBackup {
  let customMeds: FdaPhMedicine[] = [];
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_MEDS);
    if (raw) customMeds = JSON.parse(raw);
  } catch {
    // ignore
  }

  return {
    app: 'resetatime-ph',
    version: 2,
    exportedAt: new Date().toISOString(),
    profiles: loadProfiles(),
    activeProfileId: loadActiveProfileId(),
    prescriptions: loadPrescriptions(),
    doseLogs: loadDoseLogs(),
    customMeds
  };
}

export function downloadBackupFile(): void {
  const data = createBackupData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = getTodayDateString();

  const link = document.createElement('a');
  link.href = url;
  link.download = `resetatime-ph-family-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseAndRestoreBackup(jsonString: string): ResetaTimeBackup {
  const parsed = JSON.parse(jsonString) as Partial<ResetaTimeBackup>;
  if (!parsed || !Array.isArray(parsed.profiles) || !Array.isArray(parsed.prescriptions)) {
    throw new Error('Invalid ResetaTime PH backup file. Missing profiles or prescriptions.');
  }

  saveProfiles(parsed.profiles);
  if (parsed.activeProfileId) {
    saveActiveProfileId(parsed.activeProfileId);
  }
  savePrescriptions(parsed.prescriptions);
  if (parsed.doseLogs) {
    saveDoseLogs(parsed.doseLogs);
  }
  if (Array.isArray(parsed.customMeds)) {
    localStorage.setItem(KEYS.CUSTOM_MEDS, JSON.stringify(parsed.customMeds));
  }

  return {
    app: 'resetatime-ph',
    version: parsed.version || 2,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    profiles: parsed.profiles,
    activeProfileId: parsed.activeProfileId || parsed.profiles[0]?.id || DEFAULT_SELF_PROFILE_ID,
    prescriptions: parsed.prescriptions,
    doseLogs: parsed.doseLogs || {},
    customMeds: parsed.customMeds || []
  };
}

