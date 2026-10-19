import {
  DailyRoutine,
  FrequencyCode,
  MealRuleCode,
  PrescriptionItem,
  ScheduledSlot,
  TimeBlock,
  UserProfile
} from '../types';

export interface FrequencyMeta {
  code: FrequencyCode;
  shortLabel: string;
  doctorShorthand: string;
  titleEn: string;
  titleTl: string;
  descEn: string;
  descTl: string;
  dosesPerDay: number;
}

export interface MealRuleMeta {
  code: MealRuleCode;
  icon?: string;
  doctorShorthand: string;
  titleEn: string;
  titleTl: string;
  descEn: string;
  descTl: string;
}

export const FREQUENCY_OPTIONS: FrequencyMeta[] = [
  {
    code: 'OD',
    shortLabel: '1x a day',
    doctorShorthand: 'OD / QD / Once daily',
    titleEn: 'Once a day',
    titleTl: '1 beses sa isang araw',
    descEn: 'Taken once every day at the same time',
    descTl: 'Iniinom isang beses araw-araw sa parehong oras',
    dosesPerDay: 1
  },
  {
    code: 'BID',
    shortLabel: '2x a day',
    doctorShorthand: 'BID / Twice daily',
    titleEn: '2 times a day (Morning & Evening)',
    titleTl: '2 beses sa isang araw (Umaga at Gabi)',
    descEn: 'Matched to your Breakfast and Dinner routine',
    descTl: 'Nakatapat sa iyong Almusal at Hapunan',
    dosesPerDay: 2
  },
  {
    code: 'TID',
    shortLabel: '3x a day',
    doctorShorthand: 'TID / 3x daily',
    titleEn: '3 times a day (Breakfast, Lunch, Dinner)',
    titleTl: '3 beses sa isang araw (Almusal, Tanghalian, Hapunan)',
    descEn: 'Matched to your 3 daily meals while awake',
    descTl: 'Nakatapat sa 3 kainan mo sa maghapon',
    dosesPerDay: 3
  },
  {
    code: 'Q12H',
    shortLabel: 'Every 12 hrs',
    doctorShorthand: 'q12h / Every 12 hours',
    titleEn: 'Strict Every 12 Hours (Antibiotic gap)',
    titleTl: 'Eksaktong Kada 12 Oras (Pang-Antibiotic)',
    descEn: 'Exact 12-hour spacing (e.g. 7:30 AM and 7:30 PM)',
    descTl: 'Eksaktong 12 oras ang pagitan (hal. 7:30 AM at 7:30 PM)',
    dosesPerDay: 2
  },
  {
    code: 'Q8H',
    shortLabel: 'Every 8 hrs',
    doctorShorthand: 'q8h / Every 8 hours',
    titleEn: 'Strict Every 8 Hours (3x / 24h)',
    titleTl: 'Eksaktong Kada 8 Oras (3 beses sa 24 oras)',
    descEn: 'Even 8-hour intervals so medicine stays active 24/7',
    descTl: 'Pantay na 8 oras ang pagitan para tuloy-tuloy ang bisa ng gamot',
    dosesPerDay: 3
  },
  {
    code: 'Q6H',
    shortLabel: 'Every 6 hrs',
    doctorShorthand: 'q6h / QID / Every 6 hours',
    titleEn: 'Every 6 Hours (4x a day)',
    titleTl: 'Kada 6 na Oras (4 beses sa isang araw)',
    descEn: 'Spaced 4 times across your day (6-hour intervals)',
    descTl: '4 na beses sa isang araw na may 6 oras na pagitan',
    dosesPerDay: 4
  },
  {
    code: 'Q4H',
    shortLabel: 'Every 4 hrs',
    doctorShorthand: 'q4h / Every 4–6h',
    titleEn: 'Every 4 Hours (Fever / Acute Pain)',
    titleTl: 'Kada 4 na Oras (Para sa Lagnat / Kirot)',
    descEn: 'Spaced every 4 hours during waking hours',
    descTl: 'Kada 4 na oras habang gising (hal. para sa lagnat)',
    dosesPerDay: 4
  },
  {
    code: 'PRN',
    shortLabel: 'As needed (PRN)',
    doctorShorthand: 'PRN / Pag kailangan lang',
    titleEn: 'As Needed Only (Fever / Pain / Allergy)',
    titleTl: 'Kapag Kailangan Lang (Kung may lagnat o sakit)',
    descEn: 'No fixed alarm; logs safe minimum gap after you take a dose',
    descTl: 'Inumin lang kapag may sintomas (hal. masakit ang ulo o nilalagnat)',
    dosesPerDay: 1
  }
];

export const MEAL_RULE_OPTIONS: MealRuleMeta[] = [
  {
    code: 'PC',
    doctorShorthand: 'PC / After meals',
    titleEn: 'After Meals (+30 mins)',
    titleTl: 'Pagkatapos Kumain (+30 mins)',
    descEn: 'Protects your stomach; scheduled 30 mins after eating',
    descTl: 'Para hindi mahapdi sa sikmura; 30 minuto pagkatapos kumain'
  },
  {
    code: 'WITH_FOOD',
    doctorShorthand: 'With food / Habang kumakain',
    titleEn: 'With Meals (Right at mealtime)',
    titleTl: 'Kasabay ng Pagkain',
    descEn: 'Taken together with your meal for best absorption',
    descTl: 'Iniinom kasabay mismo ng iyong pagkain'
  },
  {
    code: 'AC',
    doctorShorthand: 'AC / Before meals',
    titleEn: 'Before Meals (30 mins before eating)',
    titleTl: 'Bago Kumain (30 mins bago kumain)',
    descEn: 'Scheduled 30 minutes before your meal starts',
    descTl: '30 minuto bago ka kumain para gumana agad sa tiyan'
  },
  {
    code: 'EMPTY',
    doctorShorthand: 'Empty stomach / Walang laman tiyan',
    titleEn: 'Empty Stomach (Upon waking)',
    titleTl: 'Walang Laman ang Tiyan (Pagkagising)',
    descEn: 'Scheduled 45–60 mins before breakfast with water only',
    descTl: 'Pagkagising sa umaga, 45–60 minuto bago magkape o mag-almusal'
  },
  {
    code: 'HS',
    doctorShorthand: 'HS / At bedtime',
    titleEn: 'At Bedtime (Before sleeping)',
    titleTl: 'Bago Matulog sa Gabi',
    descEn: 'Scheduled at your bedtime (ideal for cholesterol or allergy meds)',
    descTl: 'Nakatapat sa oras ng iyong pagtulog sa gabi'
  },
  {
    code: 'MORNING',
    doctorShorthand: 'AM / Every morning',
    titleEn: 'Every Morning (After breakfast)',
    titleTl: 'Tuwing Umaga',
    descEn: 'Scheduled in the morning so you start your day protected',
    descTl: 'Iniinom tuwing umaga para hindi makalimutan'
  },
  {
    code: 'ANY',
    doctorShorthand: 'No food rule / Anytime',
    titleEn: 'Can Take With or Without Food',
    titleTl: 'Kahit Kumain o Hindi',
    descEn: 'Safe to take even on an empty stomach with water',
    descTl: 'Ligtas inumin kahit walang laman ang tiyan'
  }
];

export function timeToMinutes(time24: string): number {
  const [h, m] = time24.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutes(time24: string, deltaMinutes: number): string {
  return minutesToTime(timeToMinutes(time24) + deltaMinutes);
}

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getTimeBlock(time24: string): TimeBlock {
  const mins = timeToMinutes(time24);
  if (mins >= 240 && mins < 720) return 'morning';     // 4:00 AM - 11:59 AM
  if (mins >= 720 && mins < 1050) return 'afternoon';  // 12:00 PM - 5:29 PM
  if (mins >= 1050 && mins < 1260) return 'evening';   // 5:30 PM - 8:59 PM
  return 'bedtime';                                    // 9:00 PM - 3:59 AM
}

function getMealOffset(mealRule: MealRuleCode): number {
  switch (mealRule) {
    case 'PC':
      return 30; // 30 mins after meal
    case 'WITH_FOOD':
      return 0;  // Right with meal
    case 'AC':
      return -30; // 30 mins before meal
    case 'EMPTY':
      return -45; // 45 mins before meal
    default:
      return 15;
  }
}

function getMealReason(
  mealNameEn: string,
  mealNameTl: string,
  mealTime24: string,
  mealRule: MealRuleCode
): { en: string; tl: string } {
  const formattedMeal = formatTime12h(mealTime24);
  switch (mealRule) {
    case 'PC':
      return {
        en: `30 mins after ${mealNameEn} (${formattedMeal}) to protect your stomach`,
        tl: `30 mins pagkatapos ng ${mealNameTl} (${formattedMeal}) para hindi mahapdi ang tiyan`
      };
    case 'WITH_FOOD':
      return {
        en: `Taken right with ${mealNameEn} (${formattedMeal})`,
        tl: `Kasabay mismo ng ${mealNameTl} (${formattedMeal})`
      };
    case 'AC':
      return {
        en: `30 mins BEFORE ${mealNameEn} (${formattedMeal}) so it works before you eat`,
        tl: `30 mins BAGO mag-${mealNameTl} (${formattedMeal}) para gumana bago kumain`
      };
    case 'EMPTY':
      return {
        en: `On an empty stomach upon waking, before ${mealNameEn} (${formattedMeal})`,
        tl: `Walang laman ang tiyan pagkagising, bago mag-${mealNameTl} (${formattedMeal})`
      };
    case 'HS':
      return {
        en: `Right before Bedtime (${formattedMeal})`,
        tl: `Bago matulog sa gabi (${formattedMeal})`
      };
    default:
      return {
        en: `Anchored to your ${mealNameEn} routine (${formattedMeal})`,
        tl: `Nakatapat sa oras ng iyong ${mealNameTl} (${formattedMeal})`
      };
  }
}

/**
 * Translates (User Routine + Doctor's Frequency + Meal Rule) into human-friendly clock slots.
 */
export function generateScheduleSlots(
  routine: DailyRoutine,
  frequency: FrequencyCode,
  mealRule: MealRuleCode
): ScheduledSlot[] {
  const offset = getMealOffset(mealRule);

  // 1. ONCE A DAY (OD)
  if (frequency === 'OD') {
    if (mealRule === 'HS') {
      const t = routine.bedTime;
      return [
        {
          id: 'slot-1',
          time24: t,
          timeBlock: 'bedtime',
          labelEn: 'Bedtime Dose',
          labelTl: 'Inom Bago Matulog',
          reasonEn: `At your bedtime (${formatTime12h(routine.bedTime)})`,
          reasonTl: `Sa oras ng iyong pagtulog (${formatTime12h(routine.bedTime)})`
        }
      ];
    }
    if (mealRule === 'EMPTY') {
      const wakeMins = timeToMinutes(routine.wakeTime);
      const bfastMins = timeToMinutes(routine.breakfastTime);
      // Schedule upon waking or 45m before breakfast
      const targetMins = Math.min(wakeMins + 10, bfastMins - 30);
      const t = minutesToTime(targetMins);
      return [
        {
          id: 'slot-1',
          time24: t,
          timeBlock: 'morning',
          labelEn: 'Early Morning (Empty Stomach)',
          labelTl: 'Pagkagising (Walang Laman ang Tiyan)',
          reasonEn: `Upon waking (${formatTime12h(t)}), before Breakfast at ${formatTime12h(routine.breakfastTime)}`,
          reasonTl: `Pagkagising (${formatTime12h(t)}), bago mag-Almusal nang ${formatTime12h(routine.breakfastTime)}`
        }
      ];
    }

    const t = addMinutes(routine.breakfastTime, offset);
    const reason = getMealReason('Breakfast', 'Almusal', routine.breakfastTime, mealRule);
    return [
      {
        id: 'slot-1',
        time24: t,
        timeBlock: getTimeBlock(t),
        labelEn: 'Morning Dose',
        labelTl: 'Inom sa Umaga',
        reasonEn: reason.en,
        reasonTl: reason.tl
      }
    ];
  }

  // 2. TWICE A DAY (BID - Routine-based Morning & Evening)
  if (frequency === 'BID') {
    const t1 = addMinutes(routine.breakfastTime, offset);
    const t2 = addMinutes(routine.dinnerTime, offset);
    const r1 = getMealReason('Breakfast', 'Almusal', routine.breakfastTime, mealRule);
    const r2 = getMealReason('Dinner', 'Hapunan', routine.dinnerTime, mealRule);

    return [
      {
        id: 'slot-1',
        time24: t1,
        timeBlock: getTimeBlock(t1),
        labelEn: 'Morning Dose (1 of 2)',
        labelTl: 'Unang Inom sa Umaga (1 of 2)',
        reasonEn: r1.en,
        reasonTl: r1.tl
      },
      {
        id: 'slot-2',
        time24: t2,
        timeBlock: getTimeBlock(t2),
        labelEn: 'Evening Dose (2 of 2)',
        labelTl: 'Pangalawang Inom sa Gabi (2 of 2)',
        reasonEn: r2.en,
        reasonTl: r2.tl
      }
    ];
  }

  // 3. STRICT EVERY 12 HOURS (Q12H)
  if (frequency === 'Q12H') {
    const t1 = addMinutes(routine.breakfastTime, offset);
    const t2 = addMinutes(t1, 12 * 60); // Exact +12 hours
    const r1 = getMealReason('Breakfast', 'Almusal', routine.breakfastTime, mealRule);

    return [
      {
        id: 'slot-1',
        time24: t1,
        timeBlock: getTimeBlock(t1),
        labelEn: '1st Dose (Morning)',
        labelTl: 'Unang Inom (Umaga)',
        reasonEn: r1.en,
        reasonTl: r1.tl
      },
      {
        id: 'slot-2',
        time24: t2,
        timeBlock: getTimeBlock(t2),
        labelEn: '2nd Dose (+12 Hours)',
        labelTl: 'Pangalawang Inom (+12 Oras)',
        reasonEn: `Exact 12-hour interval after your ${formatTime12h(t1)} dose`,
        reasonTl: `Eksaktong 12 oras pagkatapos ng ${formatTime12h(t1)} na inom`
      }
    ];
  }

  // 4. THREE TIMES A DAY (TID - Meal-Anchored)
  if (frequency === 'TID') {
    const t1 = addMinutes(routine.breakfastTime, offset);
    const t2 = addMinutes(routine.lunchTime, offset);
    const t3 = addMinutes(routine.dinnerTime, offset);

    const r1 = getMealReason('Breakfast', 'Almusal', routine.breakfastTime, mealRule);
    const r2 = getMealReason('Lunch', 'Tanghalian', routine.lunchTime, mealRule);
    const r3 = getMealReason('Dinner', 'Hapunan', routine.dinnerTime, mealRule);

    return [
      {
        id: 'slot-1',
        time24: t1,
        timeBlock: getTimeBlock(t1),
        labelEn: 'Morning Dose (1 of 3)',
        labelTl: 'Inom sa Umaga (1 of 3)',
        reasonEn: r1.en,
        reasonTl: r1.tl
      },
      {
        id: 'slot-2',
        time24: t2,
        timeBlock: getTimeBlock(t2),
        labelEn: 'Lunch Dose (2 of 3)',
        labelTl: 'Inom sa Tanghali (2 of 3)',
        reasonEn: r2.en,
        reasonTl: r2.tl
      },
      {
        id: 'slot-3',
        time24: t3,
        timeBlock: getTimeBlock(t3),
        labelEn: 'Dinner Dose (3 of 3)',
        labelTl: 'Inom sa Gabi (3 of 3)',
        reasonEn: r3.en,
        reasonTl: r3.tl
      }
    ];
  }

  // 5. STRICT EVERY 8 HOURS (Q8H - 3 doses spaced by 8 hours)
  if (frequency === 'Q8H') {
    // Anchor first dose to Wake/Breakfast so 3rd dose lands around bedtime instead of 3 AM
    const baseMorning = mealRule === 'AC' || mealRule === 'EMPTY'
      ? routine.wakeTime
      : addMinutes(routine.breakfastTime, 0);
    const t1 = baseMorning;
    const t2 = addMinutes(t1, 8 * 60);
    const t3 = addMinutes(t1, 16 * 60);

    return [
      {
        id: 'slot-1',
        time24: t1,
        timeBlock: getTimeBlock(t1),
        labelEn: 'Dose 1 (Morning Start)',
        labelTl: 'Unang Inom (Umaga)',
        reasonEn: `Starts at Breakfast (${formatTime12h(t1)}) to keep all 3 doses within reasonable hours`,
        reasonTl: `Simula sa Almusal (${formatTime12h(t1)}) para hindi alanganin sa madaling-araw ang ika-3 inom`
      },
      {
        id: 'slot-2',
        time24: t2,
        timeBlock: getTimeBlock(t2),
        labelEn: 'Dose 2 (+8 Hours)',
        labelTl: 'Pangalawang Inom (+8 Oras)',
        reasonEn: `Exact 8 hours after ${formatTime12h(t1)} (take a light snack/biscuit if needed)`,
        reasonTl: `Eksaktong 8 oras mula ${formatTime12h(t1)} (kumain ng tinapay/biskwit kung kailangan may laman ang tiyan)`
      },
      {
        id: 'slot-3',
        time24: t3,
        timeBlock: getTimeBlock(t3),
        labelEn: 'Dose 3 (+16 Hours)',
        labelTl: 'Pangatlong Inom (+8 Oras)',
        reasonEn: `Exact 8 hours after ${formatTime12h(t2)} before sleeping`,
        reasonTl: `Eksaktong 8 oras mula ${formatTime12h(t2)} bago matulog`
      }
    ];
  }

  // 6. EVERY 6 HOURS / 4x A DAY (Q6H / QID)
  if (frequency === 'Q6H' || frequency === 'QID') {
    const t1 = routine.wakeTime;
    const t2 = addMinutes(t1, 6 * 60);
    const t3 = addMinutes(t1, 12 * 60);
    const t4 = addMinutes(t1, 18 * 60);

    return [t1, t2, t3, t4].map((t, idx) => ({
      id: `slot-${idx + 1}`,
      time24: t,
      timeBlock: getTimeBlock(t),
      labelEn: `Dose ${idx + 1} of 4 (Every 6h)`,
      labelTl: `Ika-${idx + 1} na Inom (Kada 6 Oras)`,
      reasonEn: idx === 0
        ? `Starts upon waking (${formatTime12h(t)})`
        : `6 hours after previous dose (${formatTime12h(t)})`,
      reasonTl: idx === 0
        ? `Simula pagkagising (${formatTime12h(t)})`
        : `6 na oras pagkatapos ng naunang inom (${formatTime12h(t)})`
    }));
  }

  // 7. EVERY 4 HOURS (Q4H - Waking hours fever/pain schedule)
  if (frequency === 'Q4H') {
    const t1 = routine.breakfastTime;
    const t2 = addMinutes(t1, 4 * 60);
    const t3 = addMinutes(t1, 8 * 60);
    const t4 = addMinutes(t1, 12 * 60);

    return [t1, t2, t3, t4].map((t, idx) => ({
      id: `slot-${idx + 1}`,
      time24: t,
      timeBlock: getTimeBlock(t),
      labelEn: `Dose ${idx + 1} (4-Hour Gap)`,
      labelTl: `Ika-${idx + 1} na Inom (4-Oras Pagitan)`,
      reasonEn: `Minimum 4-hour safe gap (${formatTime12h(t)})`,
      reasonTl: `Ligtas na 4-oras na pagitan (${formatTime12h(t)})`
    }));
  }

  // 8. AS NEEDED (PRN)
  return [
    {
      id: 'slot-prn',
      time24: routine.breakfastTime,
      timeBlock: 'morning',
      labelEn: 'As Needed (PRN)',
      labelTl: 'Kapag Kailangan Lang (PRN)',
      reasonEn: 'Take only when symptoms occur (e.g., fever or pain)',
      reasonTl: 'Inumin lamang kapag may nararamdamang sintomas (hal. lagnat o kirot)'
    }
  ];
}

export interface DecodedResetaText {
  frequency?: FrequencyCode;
  mealRule?: MealRuleCode;
  durationDays?: number;
  totalPrescribedQty?: number;
  doseAmount?: string;
  matchedTerms: string[];
}

/**
 * Decodes doctor's clinical shorthand typed by the user
 * e.g., "1 tab TID PC x 7 days #21" or "q8h after meals"
 */
export function decodeDoctorShorthand(rawText: string): DecodedResetaText {
  const text = rawText.trim();
  if (!text) return { matchedTerms: [] };

  const lower = text.toLowerCase();
  const result: DecodedResetaText = { matchedTerms: [] };

  // 1. Detect # Quantity (e.g. #14, #21, #30)
  const qtyMatch = text.match(/#\s*(\d+)/);
  if (qtyMatch) {
    result.totalPrescribedQty = Number(qtyMatch[1]);
    result.matchedTerms.push(`#${qtyMatch[1]} = Buy ${qtyMatch[1]} pcs total`);
  }

  // 2. Detect Duration (e.g. "x 7 days", "for 5 days", "7d")
  const durMatch = lower.match(/(?:for|x)\s*(\d+)\s*(?:d|day|days)\b|\b(\d+)\s*(?:days|day)\b/);
  if (durMatch) {
    const days = Number(durMatch[1] || durMatch[2]);
    if (days > 0 && days <= 365) {
      result.durationDays = days;
      result.matchedTerms.push(`${days} days course`);
    }
  }

  // 3. Detect Frequency
  if (/\b(q12h|q\s*12|every\s*12\s*h)/i.test(lower)) {
    result.frequency = 'Q12H';
    result.matchedTerms.push('q12h = Every 12 hours');
  } else if (/\b(q8h|q\s*8|every\s*8\s*h)/i.test(lower)) {
    result.frequency = 'Q8H';
    result.matchedTerms.push('q8h = Every 8 hours');
  } else if (/\b(q6h|q\s*6|every\s*6\s*h)/i.test(lower)) {
    result.frequency = 'Q6H';
    result.matchedTerms.push('q6h = Every 6 hours');
  } else if (/\b(q4h|q\s*4|every\s*4\s*h)/i.test(lower)) {
    result.frequency = 'Q4H';
    result.matchedTerms.push('q4h = Every 4 hours');
  } else if (/\b(tid|t\.i\.d|3\s*x|3\s*times|three\s*times|tatlong\s*beses)/i.test(lower)) {
    result.frequency = 'TID';
    result.matchedTerms.push('TID = 3 times a day');
  } else if (/\b(bid|b\.i\.d|2\s*x|twice|two\s*times|dalawang\s*beses)/i.test(lower)) {
    result.frequency = 'BID';
    result.matchedTerms.push('BID = 2 times a day');
  } else if (/\b(qid|q\.i\.d|4\s*x|four\s*times)/i.test(lower)) {
    result.frequency = 'Q6H';
    result.matchedTerms.push('QID = 4 times a day');
  } else if (/\b(prn|p\.r\.n|as\s*needed|pag\s*masakit|pag\s*may\s*lagnat)/i.test(lower)) {
    result.frequency = 'PRN';
    result.matchedTerms.push('PRN = As needed only');
  } else if (/\b(od|o\.d|qd|q\.d|once\s*daily|once\s*a\s*day|isang\s*beses)/i.test(lower)) {
    result.frequency = 'OD';
    result.matchedTerms.push('OD/QD = Once a day');
  }

  // 4. Detect Meal Rule
  if (/\b(pc|p\.c|after\s*meal|after\s*food|pagkatapos\s*kumain)/i.test(lower)) {
    result.mealRule = 'PC';
    result.matchedTerms.push('PC = After meals (+30m)');
  } else if (/\b(ac|a\.c|before\s*meal|before\s*food|bago\s*kumain)/i.test(lower)) {
    result.mealRule = 'AC';
    result.matchedTerms.push('AC = Before meals (-30m)');
  } else if (/\b(hs|h\.s|bedtime|before\s*sleep|bago\s*matulog)/i.test(lower)) {
    result.mealRule = 'HS';
    result.matchedTerms.push('HS = At bedtime');
  } else if (/\b(empty\s*stomach|walang\s*laman)/i.test(lower)) {
    result.mealRule = 'EMPTY';
    result.matchedTerms.push('Empty stomach = 45m before breakfast');
  } else if (/\b(with\s*meal|with\s*food|kasabay\s*ng\s*pagkain)/i.test(lower)) {
    result.mealRule = 'WITH_FOOD';
    result.matchedTerms.push('With meals');
  }

  // 5. Detect Dose Amount
  const doseMatch = lower.match(/\b(\d+(?:\/\d+)?)\s*(tab|tablet|cap|capsule|ml|tsp|tbsp|sachet|nebule)s?\b/i);
  if (doseMatch) {
    const num = doseMatch[1];
    const unitRaw = doseMatch[2].toLowerCase();
    const unitMap: Record<string, string> = {
      tab: 'tablet',
      tablet: 'tablet',
      cap: 'capsule',
      capsule: 'capsule',
      ml: 'mL',
      tsp: 'tsp (5 mL)',
      tbsp: 'tbsp (15 mL)',
      sachet: 'sachet',
      nebule: 'nebule'
    };
    result.doseAmount = `${num} ${unitMap[unitRaw] || unitRaw}`;
  }

  return result;
}

/**
 * Checks if a new medicine has timing/interaction warnings with existing active prescriptions
 */
export function checkScheduleConflicts(
  candidateGeneric: string,
  candidateMealRule: MealRuleCode,
  existingMeds: PrescriptionItem[]
): { en: string; tl: string }[] {
  const warnings: { en: string; tl: string }[] = [];
  const lowerCand = candidateGeneric.toLowerCase();

  for (const med of existingMeds) {
    if (!med.active) continue;
    const lowerExist = med.genericName.toLowerCase();

    // Duplicate Paracetamol check (very common in PH: Biogesic + Bioflu / Alaxan / Neozep)
    if (lowerCand.includes('paracetamol') && lowerExist.includes('paracetamol')) {
      warnings.push({
        en: `Duplicate Paracetamol Alert: Both this medicine and "${med.brandName || med.genericName}" contain Paracetamol. Taking them together can cause overdose.`,
        tl: `Babala sa Dobleng Paracetamol: Parehong may Paracetamol ito at ang "${med.brandName || med.genericName}". Huwag pagsabayin para maiwasan ang overdose.`
      });
    }

    // Antacid / Iron / Calcium vs Antibiotic or Thyroid
    const isMineralOrAntacid = (name: string) =>
      /aluminum|magnesium|calcium|ferrous|iron|gaviscon|kremil|zinc/.test(name);
    const isSensitiveMed = (name: string) =>
      /ciprofloxacin|levothyroxine|azithromycin|tetracycline/.test(name);

    if (
      (isMineralOrAntacid(lowerCand) && isSensitiveMed(lowerExist)) ||
      (isSensitiveMed(lowerCand) && isMineralOrAntacid(lowerExist))
    ) {
      warnings.push({
        en: `Spacing Needed: Keep at least a 2-hour gap between this and "${med.brandName || med.genericName}" so minerals/antacids don't block absorption.`,
        tl: `Kailangan ng Pagitan: Maglaan ng 2 oras na pagitan sa "${med.brandName || med.genericName}" para hindi maharangan ang bisa ng gamot.`
      });
    }
  }

  if (candidateMealRule === 'AC' || candidateMealRule === 'EMPTY') {
    warnings.push({
      en: `Automatically scheduled BEFORE food so it doesn't mix with your after-meal medicines.`,
      tl: `Awtomatikong inilagay BAGO kumain para hindi makahalo sa mga gamot na pagkatapos kumain.`
    });
  }

  return warnings;
}

/**
 * Generates an .ics Calendar file with native phone alarms for 100% reliable offline wake-up alerts
 */
export function downloadIcsAlarms(
  prescriptions: PrescriptionItem[],
  lang: 'en' | 'taglish',
  profiles?: UserProfile[]
): void {
  const activeMeds = prescriptions.filter((p) => p.active && p.frequency !== 'PRN');
  if (activeMeds.length === 0) return;

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.name]));
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ResetaTime PH//Medication Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const med of activeMeds) {
    const countDays = med.durationDays || 30;
    const memberName = med.profileId ? profileMap.get(med.profileId) : undefined;
    const memberPrefix = memberName ? `[${memberName}] ` : '';

    for (const slot of med.slots) {
      const [hour, minute] = slot.time24.split(':');
      const dtStart = `${yyyy}${mm}${dd}T${hour}${minute}00`;
      const summary = `${memberPrefix}Inom ng Gamot: ${med.brandName || med.genericName} (${med.strength})`;
      const desc =
        lang === 'taglish'
          ? `${memberName ? `Miyembro: ${memberName}\\n` : ''}Dosis: ${med.doseAmount}\\nPaalala: ${slot.reasonTl}\\nTip: ${med.tipTl}`
          : `${memberName ? `Member: ${memberName}\\n` : ''}Dose: ${med.doseAmount}\\nSchedule: ${slot.reasonEn}\\nTip: ${med.tipEn}`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:resetatime-${med.id}-${slot.id}@resetatime.ph`,
        `DTSTAMP:${dtStart}`,
        `DTSTART:${dtStart}`,
        `RRULE:FREQ=DAILY;COUNT=${countDays}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${desc}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT0M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${summary}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }
  }

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ResetaTime-PH-Alarms.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
