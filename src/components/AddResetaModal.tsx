import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
  Pill,
  Plus,
  Info,
  Utensils,
  Moon,
  Sun,
  Sunrise,
  Users
} from 'lucide-react';
import {
  DailyRoutine,
  FdaPhMedicine,
  FrequencyCode,
  MealRuleCode,
  PillColor,
  PrescriptionItem,
  ScheduledSlot,
  UserProfile
} from '../types';
import { DEFAULT_ROUTINE } from '../db/storage';
import {
  FREQUENCY_OPTIONS,
  MEAL_RULE_OPTIONS,
  generateScheduleSlots,
  decodeDoctorShorthand,
  checkScheduleConflicts,
  formatTime12h,
  getTimeBlock
} from '../utils/scheduleEngine';

interface AddResetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  activeProfileId: string;
  fdaMedicines: FdaPhMedicine[];
  existingPrescriptions: PrescriptionItem[];
  onSavePrescription: (item: PrescriptionItem, newCustomMed?: FdaPhMedicine) => void;
  language: 'taglish' | 'en';
}

const DOSE_PRESETS = [
  '1 tablet',
  '1 capsule',
  '1/2 tablet',
  '2 tablets',
  '5 mL (1 tsp)',
  '10 mL (2 tsp)',
  '1 sachet',
  '1 nebule'
];

const getMealRuleIcon = (code: MealRuleCode) => {
  switch (code) {
    case 'PC':
    case 'WITH_FOOD':
      return <Utensils className="w-4 h-4 text-teal-700 shrink-0 inline mr-1.5 align-text-bottom" />;
    case 'AC':
      return <Clock className="w-4 h-4 text-teal-700 shrink-0 inline mr-1.5 align-text-bottom" />;
    case 'EMPTY':
      return <Sunrise className="w-4 h-4 text-amber-600 shrink-0 inline mr-1.5 align-text-bottom" />;
    case 'HS':
      return <Moon className="w-4 h-4 text-indigo-600 shrink-0 inline mr-1.5 align-text-bottom" />;
    case 'MORNING':
      return <Sun className="w-4 h-4 text-amber-500 shrink-0 inline mr-1.5 align-text-bottom" />;
    case 'ANY':
    default:
      return <Clock className="w-4 h-4 text-sky-600 shrink-0 inline mr-1.5 align-text-bottom" />;
  }
};

export const AddResetaModal: React.FC<AddResetaModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  fdaMedicines,
  existingPrescriptions,
  onSavePrescription,
  language
}) => {
  const isTl = language === 'taglish';

  // Family Member Assignment State
  const [selectedProfileId, setSelectedProfileId] = useState<string>(() => {
    if (activeProfileId && activeProfileId !== 'all') return activeProfileId;
    return profiles[0]?.id || 'prof-self';
  });

  useEffect(() => {
    if (activeProfileId && activeProfileId !== 'all') {
      setSelectedProfileId(activeProfileId);
    } else if (profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [activeProfileId, profiles]);

  const targetProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  }, [profiles, selectedProfileId]);

  const activeRoutine = targetProfile ? targetProfile.routine : DEFAULT_ROUTINE;

  // Search & Medicine Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFdaMed, setSelectedFdaMed] = useState<FdaPhMedicine | null>(null);

  // Medicine Details
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('500 mg');
  const [form, setForm] = useState<FdaPhMedicine['form']>('Tablet');
  const [classification, setClassification] = useState<'Rx' | 'OTC'>('Rx');
  const [category, setCategory] = useState('General Medicine');
  const [pillColor, setPillColor] = useState<PillColor>('teal');

  // Schedule & Decoder State
  const [shorthandInput, setShorthandInput] = useState('');
  const [decodedBadges, setDecodedBadges] = useState<string[]>([]);
  const [doseAmount, setDoseAmount] = useState('1 tablet');
  const [frequency, setFrequency] = useState<FrequencyCode>('TID');
  const [mealRule, setMealRule] = useState<MealRuleCode>('PC');
  const [customSlots, setCustomSlots] = useState<ScheduledSlot[]>([]);

  // PH Reseta "#" & Tingi Stock State
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [totalPrescribedQty, setTotalPrescribedQty] = useState<number>(21);
  const [stockOnHand, setStockOnHand] = useState<number>(10);

  // Tips
  const [tipEn, setTipEn] = useState('Take with a full glass of water as directed by your doctor.');
  const [tipTl, setTipTl] = useState('Inumin nang may isang basong tubig ayon sa payo ng doktor.');

  // Recalculate schedule slots whenever activeRoutine, frequency, or mealRule changes
  useEffect(() => {
    const generated = generateScheduleSlots(activeRoutine, frequency, mealRule);
    setCustomSlots(generated);

    // Auto-estimate total # quantity if not maintenance
    const freqMeta = FREQUENCY_OPTIONS.find((f) => f.code === frequency);
    if (freqMeta && !isMaintenance) {
      const estTotal = freqMeta.dosesPerDay * durationDays;
      setTotalPrescribedQty(estTotal);
    }
  }, [activeRoutine, frequency, mealRule, durationDays, isMaintenance]);

  // Filter FDA PH Medicines by Generic, Brand, or Category
  const filteredMeds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return fdaMedicines.slice(0, 12);
    return fdaMedicines
      .filter(
        (m) =>
          m.genericName.toLowerCase().includes(q) ||
          m.brandName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [searchQuery, fdaMedicines]);

  // Select an FDA PH medicine from autocomplete
  const handleSelectMedicine = (med: FdaPhMedicine) => {
    setSelectedFdaMed(med);
    setGenericName(med.genericName);
    setBrandName(med.brandName.split('/')[0].trim());
    setStrength(med.strength);
    setForm(med.form);
    setClassification(med.classification);
    setCategory(med.category);
    setDoseAmount(med.defaultDose);
    setFrequency(med.defaultFrequency);
    setMealRule(med.defaultMealRule);
    setPillColor(med.pillColor);
    setTipEn(med.commonTipEn);
    setTipTl(med.commonTipTl);
    setSearchQuery(`${med.brandName.split('/')[0].trim()} (${med.genericName})`);
    setShowDropdown(false);

    if (med.category.toLowerCase().includes('maintenance')) {
      setIsMaintenance(true);
      setTotalPrescribedQty(30);
      setStockOnHand(15);
    } else {
      setIsMaintenance(false);
    }
  };

  // Decode Doctor's Shorthand Input
  const handleShorthandChange = (val: string) => {
    setShorthandInput(val);
    const decoded = decodeDoctorShorthand(val);
    setDecodedBadges(decoded.matchedTerms);
    if (decoded.frequency) setFrequency(decoded.frequency);
    if (decoded.mealRule) setMealRule(decoded.mealRule);
    if (decoded.durationDays) {
      setIsMaintenance(false);
      setDurationDays(decoded.durationDays);
    }
    if (decoded.totalPrescribedQty) {
      setTotalPrescribedQty(decoded.totalPrescribedQty);
    }
    if (decoded.doseAmount) {
      setDoseAmount(decoded.doseAmount);
    }
  };

  // Adjust an individual slot's time if the user tweaks it manually
  const handleSlotTimeChange = (slotId: string, newTime24: string) => {
    setCustomSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              time24: newTime24,
              timeBlock: getTimeBlock(newTime24),
              reasonEn: `Manually adjusted to ${formatTime12h(newTime24)}`,
              reasonTl: `Manu-manong inayos sa ${formatTime12h(newTime24)}`
            }
          : slot
      )
    );
  };

  // Check for conflicts with existing medicines
  const warnings = useMemo(
    () => checkScheduleConflicts(genericName || searchQuery, mealRule, existingPrescriptions),
    [genericName, searchQuery, mealRule, existingPrescriptions]
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGeneric = genericName.trim() || searchQuery.trim() || 'Custom Medicine';
    const finalBrand = brandName.trim() || finalGeneric;

    let customFdaToSave: FdaPhMedicine | undefined;
    if (!selectedFdaMed && finalGeneric) {
      customFdaToSave = {
        id: `custom-${Date.now()}`,
        genericName: finalGeneric,
        brandName: finalBrand,
        manufacturer: 'Custom Entry (Saved Locally)',
        strength: strength || 'Standard',
        form,
        classification,
        category: 'Custom / User Added',
        defaultFrequency: frequency,
        defaultMealRule: mealRule,
        defaultDose: doseAmount,
        commonTipEn: tipEn,
        commonTipTl: tipTl,
        pillColor
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const newItem: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      profileId: selectedProfileId,
      genericName: finalGeneric,
      brandName: finalBrand,
      strength,
      form,
      classification,
      category,
      doseAmount,
      frequency,
      mealRule,
      durationDays: isMaintenance ? null : durationDays,
      startDate: today,
      totalPrescribedQty,
      stockOnHand,
      dosesTakenTotal: 0,
      slots: customSlots,
      tipEn,
      tipTl,
      doctorNotes: shorthandInput.trim() || undefined,
      pillColor,
      active: true
    };

    onSavePrescription(newItem, customFdaToSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-reseta-title"
    >
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="bg-teal-700 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/15 p-2 rounded-xl">
              <Pill className="w-6 h-6 text-teal-100" />
            </div>
            <div>
              <h2 id="add-reseta-title" className="text-lg font-bold leading-tight">
                {isTl ? 'Magdagdag ng Gamot / Reseta' : 'Add Prescription (Reseta Decoder)'}
              </h2>
              <p className="text-xs text-teal-100">
                {isTl
                  ? 'FDA PH Database • Awtomatikong nagku-compute ng tamang oras ng inom'
                  : 'FDA PH Database • Automatically calculates exact clock times'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5">
          {/* STEP 0: Family Member Assignment (Caregiver & Multi-Profile Support) */}
          {profiles.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>{isTl ? 'Para kanino itong reseta?' : 'Who is this prescription for?'}</span>
                </label>
                <span className="text-[10px] sm:text-[11px] bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded-full shrink-0">
                  {targetProfile?.name} ({targetProfile?.routine.breakfastTime} b-fast)
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {profiles.map((p) => {
                  const isChosen = selectedProfileId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`h-8 px-3 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                        isChosen
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: FDA PH Medicine Dual Search */}
          <div className="space-y-2 relative">
            <label htmlFor="med-search" className="block text-sm font-bold text-slate-800">
              1. {isTl ? 'Hanapin ang Gamot (FDA PH Brand o Generic)' : 'Search FDA PH Medicine (Brand or Generic)'}
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="med-search"
                type="text"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedFdaMed(null);
                  setShowDropdown(true);
                }}
                placeholder={
                  isTl
                    ? 'Hal. Biogesic, Co-Amoxiclav, Solmux, Losartan, Omeprazole...'
                    : 'e.g. Biogesic, Co-Amoxiclav, Solmux, Losartan, Omeprazole...'
                }
                className="w-full min-h-[50px] pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-base text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                aria-expanded={showDropdown}
                aria-controls="fda-med-listbox"
                autoComplete="off"
                required
              />
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <div
                id="fda-med-listbox"
                role="listbox"
                className="bg-white border-2 border-teal-600 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 z-30"
              >
                {filteredMeds.map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => handleSelectMedicine(med)}
                    className="w-full text-left px-4 py-3 hover:bg-teal-50/80 transition-colors flex items-start justify-between gap-2 cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        {med.brandName}{' '}
                        <span className="font-semibold text-teal-700">({med.strength})</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Generic: <span className="font-medium text-slate-800">{med.genericName}</span> • {med.form}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span
                        className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                          med.classification === 'Rx'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {med.classification === 'Rx' ? 'Rx Reseta' : 'OTC'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500">{med.category}</span>
                    </div>
                  </button>
                ))}

                {searchQuery.trim().length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setGenericName(searchQuery.trim());
                      setBrandName(searchQuery.trim());
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {isTl
                      ? `Gamitin ang "${searchQuery.trim()}" bilang Custom na Gamot`
                      : `Use "${searchQuery.trim()}" as Custom Medicine`}
                  </button>
                )}
              </div>
            )}

            {/* Quick Pill Chips for Popular PH Meds */}
            {!selectedFdaMed && !searchQuery && (
              <div className="flex flex-wrap gap-1.5 pt-1 items-center">
                <span className="text-[11px] sm:text-xs text-slate-500 shrink-0 mr-1">
                  {isTl ? 'Madalas i-reseta:' : 'Popular PH Meds:'}
                </span>
                {['fda-ph-001', 'fda-ph-030', 'fda-ph-009', 'fda-ph-023', 'fda-ph-037', 'fda-ph-019'].map(
                  (id) => {
                    const med = fdaMedicines.find((m) => m.id === id);
                    if (!med) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectMedicine(med)}
                        className="text-[11px] sm:text-xs bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-900 font-medium px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        + {med.brandName.split('/')[0].trim()} {med.strength}
                      </button>
                    );
                  }
                )}
              </div>
            )}

            {/* Editable Generic / Brand / Strength Row once chosen or typed */}
            {(selectedFdaMed || searchQuery) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isTl ? 'Pangalan (Brand)' : 'Brand Name'}
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Biogesic"
                    className="w-full min-h-[42px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isTl ? 'Generic Name' : 'Generic Name'}
                  </label>
                  <input
                    type="text"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="e.g. Paracetamol"
                    className="w-full min-h-[42px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isTl ? 'Grams / Lakas (Strength)' : 'Dosage Strength'}
                  </label>
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full min-h-[42px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* OPTIONAL: Smart Doctor Shorthand Decoder Box */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="shorthand-decoder" className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                {isTl
                  ? 'Hindi maintindihan ang sulat sa reseta? I-type dito (Optional):'
                  : 'Confused by doctor abbreviations? Type what is written (Optional):'}
              </label>
            </div>
            <input
              id="shorthand-decoder"
              type="text"
              value={shorthandInput}
              onChange={(e) => handleShorthandChange(e.target.value)}
              placeholder='Hal: "1 tab TID PC for 7 days #21" o "1 cap q8h after meals"'
              className="w-full min-h-[48px] px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-amber-800 font-medium">
                {isTl ? 'Subukan i-tap:' : 'Try sample:'}
              </span>
              {[
                '1 tab TID PC x 7 days #21',
                '1 cap q8h after meals #21',
                '1 cap OD AC before breakfast #14',
                '1 tab OD HS at bedtime #30'
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleShorthandChange(sample)}
                  className="text-[11px] bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-md font-medium transition-colors cursor-pointer"
                >
                  "{sample}"
                </button>
              ))}
            </div>
            {decodedBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {decodedBadges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full shrink-0"
                  >
                    <CheckCircle2 className="w-3 h-3 text-amber-800 shrink-0" />
                    <span>{b}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: Dose Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              2. {isTl ? 'Gaano karami sa bawat inom? (Dose)' : 'How much per dose?'}
            </label>
            <div className="flex flex-wrap gap-2">
              {DOSE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDoseAmount(preset)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    doseAmount === preset
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-teal-500'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: Frequency (Gaano Kadalas) */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              3. {isTl ? 'Gaano kadalas inumin sa isang araw?' : 'How often to take? (Frequency)'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FREQUENCY_OPTIONS.map((opt) => {
                const selected = frequency === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setFrequency(opt.code)}
                    className={`min-h-[60px] text-left p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selected
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-bold text-sm text-slate-900">
                        {isTl ? opt.titleTl : opt.titleEn}
                      </span>
                      <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md shrink-0">
                        {opt.doctorShorthand.split('/')[0]}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 mt-1">
                      {isTl ? opt.descTl : opt.descEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: Food & Meal Rule (Paano Inumin) */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              4. {isTl ? 'Bago o Pagkatapos Kumain? (Meal Rule)' : 'Food & Timing Instruction'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MEAL_RULE_OPTIONS.map((rule) => {
                const selected = mealRule === rule.code;
                return (
                  <button
                    key={rule.code}
                    type="button"
                    onClick={() => setMealRule(rule.code)}
                    className={`min-h-[54px] text-left p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selected
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 flex items-center">
                        {getMealRuleIcon(rule.code)}
                        <span>{isTl ? rule.titleTl : rule.titleEn}</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {rule.doctorShorthand.split('/')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isTl ? rule.descTl : rule.descEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 5: Live Auto-Translated Clock Schedule Preview */}
          <div className="bg-teal-900 text-white rounded-2xl p-3 sm:p-4 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300 shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm md:text-base leading-tight">
                  {isTl
                    ? 'Awtomatikong Oras ng Pag-inom'
                    : 'Your Translated Daily Clock Schedule'}
                </h3>
              </div>
              <span className="text-[10px] sm:text-xs bg-teal-800/90 border border-teal-700/60 text-teal-200 px-2 py-0.5 rounded-full font-semibold shrink-0 whitespace-nowrap">
                {isTl ? 'Pwedeng baguhin ang oras' : 'Tap time to adjust'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {customSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-teal-300">
                      {isTl ? slot.labelTl : slot.labelEn}
                    </div>
                    <div className="text-[11px] sm:text-xs text-teal-50">
                      {isTl ? slot.reasonTl : slot.reasonEn}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="time"
                      value={slot.time24}
                      onChange={(e) => handleSlotTimeChange(slot.id, e.target.value)}
                      aria-label={isTl ? slot.labelTl : slot.labelEn}
                      className="min-h-[40px] sm:min-h-[44px] bg-white text-slate-900 font-bold text-sm sm:text-base px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border-2 border-teal-400 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Warnings / Conflict Solver Alerts */}
            {warnings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-400/20 border border-amber-300/40 rounded-xl p-2.5 text-xs text-amber-100 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span>{isTl ? w.tl : w.en}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Clinical Tip */}
            <div className="bg-teal-950/60 rounded-xl p-3 text-xs text-teal-100 flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
              <span>
                <strong>{isTl ? 'Payo sa Pag-inom:' : 'Pharmacist Tip:'}</strong>{' '}
                {isTl ? tipTl : tipEn}
              </span>
            </div>
          </div>

          {/* STEP 6: PH Reseta "#" & "Tingi" Stock Tracker */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  5. {isTl ? 'Bilang ng Gamot at "Tingi" Stock Tracker' : 'Duration & "Tingi" Pill Stock Tracker'}
                </h3>
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isMaintenance}
                  onChange={(e) => setIsMaintenance(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
                <span>{isTl ? 'Pang-Maintenance (Tuloy-tuloy)' : 'Ongoing Maintenance'}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {!isMaintenance && (
                <div>
                  <label htmlFor="duration-days" className="block text-xs font-semibold text-slate-700 mb-1">
                    {isTl ? 'Ilang Araw Iinumin? (Days)' : 'How Many Days?'}
                  </label>
                  <input
                    id="duration-days"
                    type="number"
                    min={1}
                    max={365}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                    className="w-full min-h-[48px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900"
                  />
                </div>
              )}
              <div>
                <label htmlFor="total-rx-qty" className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTl ? 'Kabuuang # sa Reseta (Total #)' : 'Total # on Reseta'}
                </label>
                <input
                  id="total-rx-qty"
                  type="number"
                  min={1}
                  max={500}
                  value={totalPrescribedQty}
                  onChange={(e) => setTotalPrescribedQty(Math.max(1, Number(e.target.value)))}
                  className="w-full min-h-[48px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="stock-on-hand" className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTl ? 'Ilan ang Nabili Mo Ngayon? (Stock)' : 'How Many Bought Today?'}
                </label>
                <input
                  id="stock-on-hand"
                  type="number"
                  min={0}
                  max={500}
                  value={stockOnHand}
                  onChange={(e) => setStockOnHand(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[48px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-bold text-teal-800"
                />
              </div>
            </div>
            {stockOnHand < totalPrescribedQty && (
              <div className="text-xs text-amber-900 bg-amber-100/70 px-3 py-2 rounded-xl font-medium flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <span>
                  {isTl
                    ? `Tingi Mode: Nabili mo ay ${stockOnHand} piraso mula sa #${totalPrescribedQty} na reseta. Paaalalahanan ka ng app bago maubos ang stock mo para makabili pa ng kulang na ${totalPrescribedQty - stockOnHand}.`
                    : `Partial Purchase (Tingi): You have ${stockOnHand} of #${totalPrescribedQty} prescribed. We'll alert you before you run out so you can buy the remaining ${totalPrescribedQty - stockOnHand}.`}
                </span>
              </div>
            )}
          </div>

          {/* Submit Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center text-sm"
            >
              {isTl ? 'Kanselahin' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="h-11 px-5 rounded-xl font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isTl ? 'I-save sa Aking Schedule' : 'Save to My Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
