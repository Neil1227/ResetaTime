export type LanguageMode = 'taglish' | 'en';

export type FrequencyCode =
  | 'OD'    // Once a day
  | 'BID'   // 2x a day (Morning & Evening)
  | 'TID'   // 3x a day (Morning, Afternoon, Evening)
  | 'QID'   // 4x a day
  | 'Q12H'  // Strict Every 12 hours
  | 'Q8H'   // Strict Every 8 hours
  | 'Q6H'   // Strict Every 6 hours
  | 'Q4H'   // Every 4 hours (or PRN fever)
  | 'PRN';  // As needed (masakit ulo / lagnat)

export type MealRuleCode =
  | 'PC'        // After meals (30 mins after eating)
  | 'WITH_FOOD' // With meals (habang kumakain)
  | 'AC'        // Before meals (30-60 mins before eating)
  | 'EMPTY'     // Empty stomach (1 hr before breakfast / 2 hrs after food)
  | 'HS'        // At bedtime (bago matulog)
  | 'MORNING'   // First thing in the morning
  | 'ANY';      // Anytime / No food restriction

export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export type PillColor = 'teal' | 'blue' | 'amber' | 'rose' | 'violet' | 'emerald' | 'slate';

export interface DailyRoutine {
  wakeTime: string;      // e.g. "06:30"
  breakfastTime: string; // e.g. "07:00"
  lunchTime: string;     // e.g. "12:00"
  dinnerTime: string;    // e.g. "19:00"
  bedTime: string;       // e.g. "22:00"
  language: LanguageMode;
}

export interface FdaPhMedicine {
  id: string;
  genericName: string;
  brandName: string;
  manufacturer: string;
  strength: string;
  form: 'Tablet' | 'Capsule' | 'Syrup / Suspension' | 'Sachet / Powder' | 'Drops / Nebule';
  classification: 'Rx' | 'OTC';
  category: string;
  defaultFrequency: FrequencyCode;
  defaultMealRule: MealRuleCode;
  defaultDose: string;
  commonTipEn: string;
  commonTipTl: string;
  pillColor: PillColor;
  fdaRegNo?: string;
}

export interface ScheduledSlot {
  id: string;
  time24: string; // "08:00"
  timeBlock: TimeBlock;
  labelEn: string;
  labelTl: string;
  reasonEn: string;
  reasonTl: string;
  conflictAdjusted?: boolean;
}

export type RelationshipRole =
  | 'self'        // Ako (Self)
  | 'mother'      // Nanay / Mommy
  | 'father'      // Tatay / Daddy
  | 'child'       // Anak
  | 'grandparent' // Lola / Lolo
  | 'spouse'      // Asawa / Partner
  | 'sibling'     // Kapatid
  | 'other';      // Iba pa

export interface UserProfile {
  id: string;
  name: string;
  role: RelationshipRole;
  avatarColor: PillColor;
  routine: DailyRoutine;
  notes?: string;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  profileId: string; // References UserProfile.id
  genericName: string;
  brandName: string;
  strength: string;
  form: string;
  classification: 'Rx' | 'OTC';
  category: string;
  doseAmount: string; // e.g. "1 tablet", "5 mL (1 tsp)"
  frequency: FrequencyCode;
  mealRule: MealRuleCode;
  durationDays: number | null; // null = ongoing maintenance
  startDate: string; // YYYY-MM-DD
  totalPrescribedQty: number; // The "#" on PH Reseta (e.g. #21)
  stockOnHand: number; // How many bought ("Tingi" tracker, e.g. 6)
  dosesTakenTotal: number;
  slots: ScheduledSlot[];
  tipEn: string;
  tipTl: string;
  doctorNotes?: string;
  pillColor: PillColor;
  active: boolean;
}

export type DoseStatus = 'pending' | 'taken' | 'snoozed' | 'skipped';

export interface DoseLog {
  id: string; // `${date}_${profileId}_${prescriptionId}_${slotId}`
  date: string; // YYYY-MM-DD
  profileId?: string;
  prescriptionId: string;
  slotId: string;
  status: DoseStatus;
  takenAt?: string;
  snoozedUntil?: string;
}
