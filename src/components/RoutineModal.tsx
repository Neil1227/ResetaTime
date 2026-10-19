import React, { useState } from 'react';
import { X, Sun, Utensils, Moon, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { DailyRoutine } from '../types';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: DailyRoutine;
  onSaveRoutine: (updated: DailyRoutine) => void;
}

export const RoutineModal: React.FC<RoutineModalProps> = ({
  isOpen,
  onClose,
  routine,
  onSaveRoutine
}) => {
  const [form, setForm] = useState<DailyRoutine>(routine);
  const isTl = form.language === 'taglish';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRoutine(form);
    onClose();
  };

  const fields: {
    key: keyof Omit<DailyRoutine, 'language'>;
    labelEn: string;
    labelTl: string;
    subEn: string;
    subTl: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'wakeTime',
      labelEn: 'Wake-Up Time',
      labelTl: 'Oras ng Gising sa Umaga',
      subEn: 'Used for empty-stomach medicines & strict interval start',
      subTl: 'Basehan ng gamot na iniinom nang walang laman ang tiyan',
      icon: <Sun className="w-4 h-4 text-amber-500" />
    },
    {
      key: 'breakfastTime',
      labelEn: 'Breakfast (Almusal)',
      labelTl: 'Oras ng Almusal (Breakfast)',
      subEn: 'Anchors morning before/after meal medicines',
      subTl: 'Basehan ng gamot sa umaga (bago o pagkatapos kumain)',
      icon: <Utensils className="w-4 h-4 text-teal-600" />
    },
    {
      key: 'lunchTime',
      labelEn: 'Lunch (Tanghalian)',
      labelTl: 'Oras ng Tanghalian (Lunch)',
      subEn: 'Anchors 3x-a-day (TID) midday medicines',
      subTl: 'Basehan ng gamot sa tanghali (3x a day / TID)',
      icon: <Utensils className="w-4 h-4 text-sky-600" />
    },
    {
      key: 'dinnerTime',
      labelEn: 'Dinner (Hapunan)',
      labelTl: 'Oras ng Hapunan (Dinner)',
      subEn: 'Anchors evening before/after meal medicines',
      subTl: 'Basehan ng gamot sa gabi (2x o 3x a day)',
      icon: <Utensils className="w-4 h-4 text-indigo-600" />
    },
    {
      key: 'bedTime',
      labelEn: 'Bedtime (Tulog)',
      labelTl: 'Oras ng Pagtulog (Bedtime)',
      subEn: 'Anchors bedtime (HS) cholesterol & allergy medicines',
      subTl: 'Basehan ng gamot na iniinom bago matulog (HS)',
      icon: <Moon className="w-4 h-4 text-violet-600" />
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="routine-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white px-3.5 sm:px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-500/20 p-1.5 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 text-teal-300" />
            </div>
            <div className="min-w-0">
              <h2 id="routine-modal-title" className="text-sm sm:text-base font-bold truncate">
                {isTl ? 'Ang Iyong Daily Routine' : 'Your Daily Routine & Meal Times'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-300 truncate">
                {isTl
                  ? 'Dito ibinabase ang oras ng pag-inom ng gamot'
                  : 'We use your meal times to translate doctor instructions'}
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

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 overflow-y-auto space-y-2.5">
          <div className="space-y-2">
            {fields.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-2 p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="p-1.5 bg-white rounded-lg shadow-2xs border border-slate-100 shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`routine-${item.key}`}
                      className="block text-xs sm:text-sm font-bold text-slate-900 truncate"
                    >
                      {isTl ? item.labelTl : item.labelEn}
                    </label>
                    <p className="text-[10px] text-slate-500 truncate hidden xs:block">{isTl ? item.subTl : item.subEn}</p>
                  </div>
                </div>
                <input
                  id={`routine-${item.key}`}
                  type="time"
                  value={form[item.key]}
                  onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                  className="h-9 px-2 bg-white border border-slate-300 focus:border-teal-600 rounded-lg font-bold text-slate-900 text-xs sm:text-sm shrink-0 w-[105px] text-center"
                  required
                />
              </div>
            ))}
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 text-xs text-teal-900 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-tight">
              {isTl
                ? 'Kapag binago mo ang oras ng iyong kainan dito, awtomatikong mag-a-adjust ang schedule ng iyong mga gamot!'
                : 'When you update your meal times here, all meal-based prescriptions automatically update to match!'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-lg font-semibold text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {isTl ? 'Kanselahin' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg font-bold text-xs bg-teal-700 hover:bg-teal-800 text-white shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isTl ? 'I-update ang Oras' : 'Update Routine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
