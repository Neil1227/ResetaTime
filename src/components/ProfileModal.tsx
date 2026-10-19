import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  CheckCircle2,
  Trash2,
  Edit3,
  Sun,
  Utensils,
  Moon,
  Clock,
  Sparkles,
  Info,
  Download,
  Upload,
  ShieldCheck
} from 'lucide-react';
import { DailyRoutine, PillColor, RelationshipRole, UserProfile } from '../types';
import {
  DEFAULT_ROUTINE,
  downloadBackupFile,
  parseAndRestoreBackup,
  ResetaTimeBackup
} from '../db/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onSaveProfile: (profile: UserProfile) => void;
  onDeleteProfile: (id: string) => void;
  onRestoreBackup?: (backup: ResetaTimeBackup) => void;
  language: 'taglish' | 'en';
}

const ROLE_OPTIONS: { role: RelationshipRole; labelEn: string; labelTl: string }[] = [
  { role: 'self', labelEn: 'Self (Ako)', labelTl: 'Sarili (Ako)' },
  { role: 'mother', labelEn: 'Mother (Nanay / Mommy)', labelTl: 'Nanay / Mommy' },
  { role: 'father', labelEn: 'Father (Tatay / Daddy)', labelTl: 'Tatay / Daddy' },
  { role: 'child', labelEn: 'Child (Anak)', labelTl: 'Anak (Bata o Dalaga/Binata)' },
  { role: 'grandparent', labelEn: 'Grandparent (Lola / Lolo)', labelTl: 'Lola / Lolo' },
  { role: 'spouse', labelEn: 'Spouse / Partner (Asawa)', labelTl: 'Asawa / Partner' },
  { role: 'sibling', labelEn: 'Sibling (Kapatid)', labelTl: 'Kapatid' },
  { role: 'other', labelEn: 'Other / Patient (Iba pa)', labelTl: 'Iba pa (Alaga / Pasyente)' }
];

const COLOR_OPTIONS: { color: PillColor; bg: string; dot: string; label: string }[] = [
  { color: 'teal', bg: 'bg-teal-100 text-teal-900 border-teal-300', dot: 'bg-teal-600', label: 'Teal' },
  { color: 'rose', bg: 'bg-rose-100 text-rose-900 border-rose-300', dot: 'bg-rose-600', label: 'Rose' },
  { color: 'blue', bg: 'bg-sky-100 text-sky-900 border-sky-300', dot: 'bg-sky-600', label: 'Sky' },
  { color: 'amber', bg: 'bg-amber-100 text-amber-950 border-amber-300', dot: 'bg-amber-500', label: 'Amber' },
  { color: 'violet', bg: 'bg-violet-100 text-violet-900 border-violet-300', dot: 'bg-violet-600', label: 'Violet' },
  { color: 'emerald', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-600', label: 'Emerald' }
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onSaveProfile,
  onDeleteProfile,
  onRestoreBackup,
  language
}) => {
  const isTl = language === 'taglish';
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<RelationshipRole>('mother');
  const [avatarColor, setAvatarColor] = useState<PillColor>('rose');
  const [notes, setNotes] = useState('');
  const [routine, setRoutine] = useState<DailyRoutine>(DEFAULT_ROUTINE);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    downloadBackupFile();
    setBackupStatusMsg(isTl ? 'Na-download na ang backup file!' : 'Backup file downloaded!');
    setTimeout(() => setBackupStatusMsg(null), 3500);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const restored = parseAndRestoreBackup(content);
        if (onRestoreBackup) {
          onRestoreBackup(restored);
        }
        setBackupStatusMsg(
          isTl
            ? `Na-restore ang ${restored.profiles.length} miyembro at ${restored.prescriptions.length} gamot!`
            : `Restored ${restored.profiles.length} members & ${restored.prescriptions.length} meds!`
        );
        setTimeout(() => setBackupStatusMsg(null), 4000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid backup file';
        alert(isTl ? `Error sa pag-restore: ${msg}` : `Restore error: ${msg}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startCreate = () => {
    setName('');
    setRole('mother');
    setAvatarColor('rose');
    setNotes('');
    setRoutine(DEFAULT_ROUTINE);
    setEditingProfile(null);
    setIsCreatingNew(true);
  };

  const startEdit = (p: UserProfile) => {
    setName(p.name);
    setRole(p.role);
    setAvatarColor(p.avatarColor);
    setNotes(p.notes || '');
    setRoutine(p.routine);
    setEditingProfile(p);
    setIsCreatingNew(false);
  };

  const handleCancelForm = () => {
    setEditingProfile(null);
    setIsCreatingNew(false);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const profileToSave: UserProfile = {
      id: editingProfile ? editingProfile.id : `prof-${Date.now()}`,
      name: name.trim(),
      role,
      avatarColor,
      routine,
      notes: notes.trim() || undefined,
      createdAt: editingProfile ? editingProfile.createdAt : new Date().toISOString()
    };

    onSaveProfile(profileToSave);
    handleCancelForm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-teal-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white/15 p-1.5 rounded-lg shrink-0">
              <Users className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-sm sm:text-base font-extrabold truncate">
                {isTl ? 'Miyembro ng Pamilya (Profiles)' : 'Family Members & Caregiver Profiles'}
              </h2>
              <p className="text-[10px] sm:text-xs text-teal-100 truncate">
                {isTl
                  ? 'I-manage ang mga gamot ng bawat kasama sa bahay'
                  : 'Manage medications separately for each family member'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5">
          {/* List Mode */}
          {!isCreatingNew && !editingProfile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {isTl ? 'Piliin o I-edit ang Miyembro:' : 'Select or Edit Member:'}
                </span>
                <button
                  type="button"
                  onClick={startCreate}
                  className="h-8 px-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isTl ? '+ Magdagdag' : '+ Add Member'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {/* Combined All Family View Option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectProfile('all');
                    onClose();
                  }}
                  className={`w-full p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2 text-left cursor-pointer ${
                    activeProfileId === 'all'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border shrink-0 bg-amber-100 text-amber-950 border-amber-300">
                      <Users className="w-4 h-4 text-amber-800" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {isTl ? 'Buong Pamilya (Lahat)' : 'All Family (Combined)'}
                        </h4>
                        {activeProfileId === 'all' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-amber-700" />
                            {isTl ? 'Aktibo' : 'Active'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                        {isTl
                          ? 'Tingnan ang pinagsama-samang schedule ng lahat'
                          : 'Combined view of all family member schedules'}
                      </p>
                    </div>
                  </div>
                </button>
                {profiles.map((p) => {
                  const isSelected = activeProfileId === p.id;
                  const colorObj = COLOR_OPTIONS.find((c) => c.color === p.avatarColor) || COLOR_OPTIONS[0];

                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Left: Avatar + Info */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfile(p.id);
                          onClose();
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border shrink-0 ${colorObj.bg}`}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {p.name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 whitespace-nowrap">
                              {ROLE_OPTIONS.find((r) => r.role === p.role)?.labelTl || p.role}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                {isTl ? 'Aktibo' : 'Active'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                            <span>
                              {isTl ? 'Almusal' : 'B-fast'}: <strong>{p.routine.breakfastTime}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              {isTl ? 'Hapunan' : 'Dinner'}: <strong>{p.routine.dinnerTime}</strong>
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 cursor-pointer"
                          title="Edit member details"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {profiles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  isTl
                                    ? `Sigurado ka bang nais mong alisin si ${p.name}?`
                                    : `Are you sure you want to remove ${p.name}?`
                                )
                              ) {
                                onDeleteProfile(p.id);
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete profile"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Philippine Caregiver Tip */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-950 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  {isTl
                    ? 'Magkahiwalay ang oras ng kainan at listahan ng gamot ng bawat miyembro ng pamilya upang hindi magkahalo ang kanilang mga reseta.'
                    : 'Each family member has their own wake/meal schedule and medicine tracker so their prescriptions never get mixed up.'}
                </span>
              </div>

              {/* Zero-Cloud Backup & Device Transfer Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <h4 className="font-extrabold text-xs text-slate-900">
                      {isTl ? 'Backup at Paglipat sa Ibang Cellphone' : 'Backup & Device Transfer'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded">
                    Zero-Cloud
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-600 leading-tight">
                  {isTl
                    ? 'I-save ang buong record ng pamilya sa isang file (.json) para ma-restore kung sakaling maglinis ng browser o kung lilipat sa bagong cellphone.'
                    : 'Save all family profiles and prescriptions to a file (.json) to protect against data loss or transfer to a new phone anytime.'}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex-1 h-8 px-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{isTl ? 'I-download (.json)' : 'Download Backup'}</span>
                  </button>

                  <label className="flex-1 h-8 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>{isTl ? 'I-restore (.json)' : 'Restore File'}</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileRestore}
                      className="hidden"
                    />
                  </label>
                </div>
                {backupStatusMsg && (
                  <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="leading-tight">{backupStatusMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Mode: Create or Edit */}
          {(isCreatingNew || editingProfile) && (
            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    {editingProfile
                      ? isTl
                        ? `I-edit si ${editingProfile.name}`
                        : `Edit ${editingProfile.name}`
                      : isTl
                      ? 'Bagong Miyembro ng Pamilya'
                      : 'Add New Family Member'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {isTl ? 'Bumalik' : 'Back'}
                </button>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTl ? 'Pangalan o Palayaw' : 'Name or Nickname'} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isTl ? 'Hal: Nanay Rosa, Tatay Carding, Kuya Mark...' : 'e.g. Nanay Rosa, Dad, Mark...'}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold focus:border-teal-600 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              {/* Relationship Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTl ? 'Relasyon sa Bahay' : 'Relationship / Role'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RelationshipRole)}
                  className="w-full h-9 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 focus:bg-white focus:outline-none"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {isTl ? opt.labelTl : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Tag */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTl ? 'Kulay ng Tag / Avatar' : 'Tag Color'}
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setAvatarColor(c.color)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        c.dot
                      } ${avatarColor === c.color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-70'}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Individual Routine Timers */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>
                    {isTl ? `Oras ng Kainan ni ${name || 'Miyembro'}:` : `Meal Routine for ${name || 'Member'}:`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      {isTl ? 'Almusal (Breakfast)' : 'Breakfast'}
                    </label>
                    <input
                      type="time"
                      value={routine.breakfastTime}
                      onChange={(e) => setRoutine({ ...routine, breakfastTime: e.target.value })}
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs font-bold text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      {isTl ? 'Tanghalian (Lunch)' : 'Lunch'}
                    </label>
                    <input
                      type="time"
                      value={routine.lunchTime}
                      onChange={(e) => setRoutine({ ...routine, lunchTime: e.target.value })}
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs font-bold text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      {isTl ? 'Hapunan (Dinner)' : 'Dinner'}
                    </label>
                    <input
                      type="time"
                      value={routine.dinnerTime}
                      onChange={(e) => setRoutine({ ...routine, dinnerTime: e.target.value })}
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs font-bold text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      {isTl ? 'Tulog (Bedtime)' : 'Bedtime'}
                    </label>
                    <input
                      type="time"
                      value={routine.bedTime}
                      onChange={(e) => setRoutine({ ...routine, bedTime: e.target.value })}
                      className="w-full h-8 px-2 bg-white border border-slate-300 rounded text-xs font-bold text-center"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTl ? 'Espesyal na Paalala (Opsyonal)' : 'Medical Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isTl ? 'Hal: Senior Citizen, May Allergy sa Penicillin...' : 'e.g. Senior Citizen, Penicillin Allergy...'}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {isTl ? 'Kanselahin' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isTl ? 'I-save ang Miyembro' : 'Save Member'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
