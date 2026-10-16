import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Award,
  Search,
  CheckCircle2,
  FileText,
  Printer,
  Download,
  School as SchoolIcon,
  Users,
  Save,
  Trash2,
  Edit2,
  AlertCircle,
  HelpCircle,
  Trophy,
  Filter,
  Lock,
  KeyRound,
  ShieldAlert,
  X,
  AlertTriangle,
} from 'lucide-react';
import { EventItem, InstitutionConfig, MarkRecord, Student } from '../types';

interface ResultManagerProps {
  students: Student[];
  events: EventItem[];
  marks: MarkRecord[];
  institution: InstitutionConfig;
  onSaveMark: (mark: MarkRecord) => Promise<void>;
  onDeleteMark: (markId: string) => Promise<void>;
  onDeleteAllMarks?: (eventId: string, eventName: string, markIds: string[]) => Promise<void>;
  onOpenMeritPdf: (type: 'overall' | 'schoolwise', eventName: string, marks: MarkRecord[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ResultManager: React.FC<ResultManagerProps> = ({
  students,
  events,
  marks,
  institution,
  onSaveMark,
  onDeleteMark,
  onDeleteAllMarks,
  onOpenMeritPdf,
  onShowToast,
}) => {
  // Selected Event
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return events[0]?.id || '';
  });

  // Permanent ID Input
  const [inputPermanentId, setInputPermanentId] = useState('');
  const [inputMarks, setInputMarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Active view tab for Merit lists
  const [meritTab, setMeritTab] = useState<'overall' | 'schoolwise' | 'entries'>('overall');

  // "পুরো রেজাল্ট ডিলিট করুন" PIN Modal States
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllPin, setDeleteAllPin] = useState('');
  const [deleteAllPinError, setDeleteAllPinError] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Focus PIN input when modal opens
  useEffect(() => {
    if (isDeleteAllModalOpen) {
      setDeleteAllPin('');
      setDeleteAllPinError('');
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }
  }, [isDeleteAllModalOpen]);

  // Selected event object
  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  // Match student based on entered Permanent ID (case insensitive, trimmed)
  const matchedStudent = useMemo(() => {
    const cleanId = inputPermanentId.trim().toUpperCase();
    if (!cleanId) return null;

    // Search by permanentId or serialNumber or roll as fallback
    return (
      students.find(
        (s) =>
          (s.permanentId && s.permanentId.trim().toUpperCase() === cleanId) ||
          (s.serialNumber && s.serialNumber.trim().toUpperCase() === cleanId) ||
          s.roll.trim() === cleanId
      ) || null
    );
  }, [students, inputPermanentId]);

  // Marks for the selected event only
  const eventMarks = useMemo(() => {
    if (!currentEvent) return [];
    return marks.filter((m) => m.eventId === currentEvent.id || m.eventName === currentEvent.name);
  }, [marks, currentEvent]);

  // Check if matched student already has a mark in this event
  const existingStudentMark = useMemo(() => {
    if (!matchedStudent || !currentEvent) return null;
    return eventMarks.find((m) => m.studentId === matchedStudent.id) || null;
  }, [matchedStudent, currentEvent, eventMarks]);

  // When matched student changes, if they already have marks, preload it into the marks input
  useEffect(() => {
    if (existingStudentMark) {
      setInputMarks(String(existingStudentMark.marks));
    }
  }, [existingStudentMark]);

  // Overall Merit List: Sorted by marks descending
  const overallMeritList = useMemo(() => {
    return [...eventMarks].sort((a, b) => b.marks - a.marks);
  }, [eventMarks]);

  // School-wise Merit List: Grouped by school, inside each sorted by marks descending
  const schoolWiseMeritList = useMemo(() => {
    const map = new Map<string, MarkRecord[]>();
    eventMarks.forEach((m) => {
      const sch = m.schoolName || 'অন্যান্য স্কুল';
      if (!map.has(sch)) map.set(sch, []);
      map.get(sch)!.push(m);
    });

    const result: { schoolName: string; records: MarkRecord[] }[] = [];
    map.forEach((records, schoolName) => {
      records.sort((a, b) => b.marks - a.marks);
      result.push({ schoolName, records });
    });

    // Sort schools alphabetically
    result.sort((a, b) => a.schoolName.localeCompare(b.schoolName, 'bn'));
    return result;
  }, [eventMarks]);

  // Handle Mark Save
  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) {
      onShowToast('অনুগ্রহ করে প্রথমে একটি ইভেন্ট নির্বাচন করুন!', 'error');
      return;
    }
    if (!matchedStudent) {
      onShowToast('সঠিক Permanent ID দিন!', 'error');
      return;
    }
    const marksNum = parseFloat(inputMarks);
    if (isNaN(marksNum) || marksNum < 0) {
      onShowToast('অনুগ্রহ করে বৈধ নম্বর (Marks) ইনপুট দিন!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const markId = `${currentEvent.id}_${matchedStudent.id}`;
      const record: MarkRecord = {
        id: markId,
        eventId: currentEvent.id,
        eventName: currentEvent.name,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        permanentId: matchedStudent.permanentId || matchedStudent.serialNumber || matchedStudent.roll,
        roll: matchedStudent.roll,
        schoolName: matchedStudent.schoolName,
        schoolCode: matchedStudent.schoolCode,
        className: matchedStudent.className,
        marks: marksNum,
        updatedAt: Date.now(),
      };

      await onSaveMark(record);
      onShowToast(`শিক্ষার্থী "${matchedStudent.name}" এর জন্য ${marksNum} মার্কস সংরক্ষিত হয়েছে!`, 'success');

      // Clear input and focus for next student
      setInputPermanentId('');
      setInputMarks('');
    } catch (err) {
      console.error('Error saving mark:', err);
      onShowToast('মার্কস সংরক্ষণে সমস্যা হয়েছে!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Individual Result Delete (Direct - No PIN required)
  const handleDirectIndividualDelete = async (markId: string, studentName?: string) => {
    try {
      await onDeleteMark(markId);
      // If the currently matched student's mark was deleted, clear the mark input
      if (existingStudentMark && existingStudentMark.id === markId) {
        setInputMarks('');
      }
    } catch (err) {
      console.error('Error deleting individual mark:', err);
      onShowToast('মার্কস মুছতে সমস্যা হয়েছে!', 'error');
    }
  };

  // 2. পুরো Result Delete - Trigger PIN Modal
  const handleRequestDeleteAll = () => {
    if (eventMarks.length === 0) {
      onShowToast('এই ইভেন্টে মুছে ফেলার মতো কোনো মার্কস নেই!', 'info');
      return;
    }
    setDeleteAllPin('');
    setDeleteAllPinError('');
    setIsDeleteAllModalOpen(true);
  };

  // 2. পুরো Result Delete - Submit PIN & Delete All Marks
  const handleConfirmDeleteAllMarks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentEvent) return;

    // PIN strictly checked against 1971 (Internal secret - NEVER shown in UI)
    if (deleteAllPin.trim() !== '1971') {
      setDeleteAllPinError('ভুল পিন কোড! অনুগ্রহ করে সঠিক পিন দিয়ে আবার চেষ্টা করুন।');
      setDeleteAllPin('');
      pinInputRef.current?.focus();
      return;
    }

    setIsDeletingAll(true);
    try {
      const markIds = eventMarks.map((m) => m.id);
      if (onDeleteAllMarks) {
        await onDeleteAllMarks(currentEvent.id, currentEvent.name, markIds);
      } else {
        // Fallback
        for (const id of markIds) {
          await onDeleteMark(id);
        }
      }
      setIsDeleteAllModalOpen(false);
      setDeleteAllPin('');
      setDeleteAllPinError('');
      setInputPermanentId('');
      setInputMarks('');
    } catch (err) {
      console.error('Error deleting all marks:', err);
      onShowToast('সকল মার্কস মুছতে সমস্যা হয়েছে!', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Open dedicated PDF preview modal for Merit lists
  const handlePrintOverallPdf = () => {
    if (eventMarks.length === 0) {
      onShowToast('এই ইভেন্টে কোনো মার্কস পাওয়া যায়নি!', 'error');
      return;
    }
    onOpenMeritPdf('overall', currentEvent?.name || 'ইভেন্ট', eventMarks);
  };

  const handlePrintSchoolwisePdf = () => {
    if (eventMarks.length === 0) {
      onShowToast('এই ইভেন্টে কোনো মার্কস পাওয়া যায়নি!', 'error');
      return;
    }
    onOpenMeritPdf('schoolwise', currentEvent?.name || 'ইভেন্ট', eventMarks);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                রেজাল্ট ও মেধা তালিকা প্রস্তুতকরণ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                ইভেন্ট নির্বাচন করে Permanent ID দিয়ে দ্রুত মার্কস ইনপুট দিন এবং সার্বিক ও স্কুলভিত্তিক মেধা তালিকা তৈরি করুন
              </p>
            </div>
          </div>

          {/* Event Selector */}
          <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ইভেন্ট নির্বাচন করুন:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setInputPermanentId('');
                setInputMarks('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white cursor-pointer"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">বর্তমান ইভেন্ট</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
              {currentEvent?.name || 'নির্বাচিত নেই'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">মার্কস এন্ট্রি সম্পন্ন</div>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {eventMarks.length} জন শিক্ষার্থী
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">অংশগ্রহণকারী স্কুল</div>
            <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {schoolWiseMeritList.length} টি
            </div>
          </div>
        </div>
      </div>

      {/* Marks Input Box (Flow 1, 2, 3, 4, 5) */}
      <div className="bg-gradient-to-r from-emerald-950/20 via-teal-950/20 to-slate-900/20 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-slate-900/40 border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>মার্কস এন্ট্রি ফরম (Marks Input)</span>
          </h3>
          {existingStudentMark && (
            <div className="flex items-center gap-2 bg-emerald-100/70 dark:bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-xs">
              <span className="text-emerald-800 dark:text-emerald-200">
                পূর্বে সংরক্ষিত মার্কস: <strong className="font-mono">{existingStudentMark.marks}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleDirectIndividualDelete(existingStudentMark.id, existingStudentMark.studentName)}
                className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium hover:underline ml-1"
                title="কোনো পিন ছাড়া সরাসরি মার্কস ডিলিট করুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>মার্কস মুছুন</span>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveMarks} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Step 2: Permanent ID Input */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ১. Permanent ID ইনপুট দিন <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={inputPermanentId}
                onChange={(e) => setInputPermanentId(e.target.value.toUpperCase())}
                placeholder="যেমন: AA, AB, AAA..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono uppercase font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-slate-400">
                (আইডি, সিরিয়াল নম্বর বা রোল দিয়েও খোঁজা যাবে)
              </p>
            </div>

            {/* Step 3: Verified Student Name Indicator */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ২. শিক্ষার্থীর নাম ও তথ্য
              </label>
              {matchedStudent ? (
                <div className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl min-h-[46px] flex flex-col justify-center animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100 truncate">
                      {matchedStudent.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mt-0.5">
                    <span>{matchedStudent.schoolName}</span>
                    <span>•</span>
                    <span>{matchedStudent.className}</span>
                    <span>•</span>
                    <span>রোল: {matchedStudent.roll}</span>
                  </div>
                </div>
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl min-h-[46px] flex items-center text-xs text-slate-400">
                  {inputPermanentId.trim() ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      এই Permanent ID বিশিষ্ট শিক্ষার্থী পাওয়া যায়নি!
                    </span>
                  ) : (
                    'সঠিক Permanent ID টাইপ করলে শিক্ষার্থীর নাম এখানে ভেসে উঠবে...'
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Marks Input Field */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ৩. প্রাপ্ত মার্কস <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="1000"
                  value={inputMarks}
                  onChange={(e) => setInputMarks(e.target.value)}
                  disabled={!matchedStudent}
                  placeholder="নম্বর"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                />
                <button
                  type="submit"
                  disabled={!matchedStudent || !inputMarks.trim() || isSaving}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'সংরক্ষণ...' : 'সেভ'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Merit Lists Navigation & Action Buttons */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setMeritTab('overall')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                meritTab === 'overall'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              সার্বিক মেধা তালিকা (Overall Merit)
            </button>

            <button
              onClick={() => setMeritTab('schoolwise')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                meritTab === 'schoolwise'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              স্কুলভিত্তিক মেধা তালিকা (School-wise Merit)
            </button>

            <button
              onClick={() => setMeritTab('entries')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                meritTab === 'entries'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              এন্ট্রি তালিকা ({eventMarks.length})
            </button>
          </div>

          {/* Action Print / PDF & Delete All Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {meritTab === 'overall' && (
              <button
                type="button"
                onClick={handlePrintOverallPdf}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                title="সার্বিক মেধা তালিকা প্রিন্ট / PDF সংরক্ষণ করুন"
              >
                <Printer className="w-4 h-4" />
                <span>সার্বিক মেধা তালিকা PDF</span>
              </button>
            )}

            {meritTab === 'schoolwise' && (
              <button
                type="button"
                onClick={handlePrintSchoolwisePdf}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
                title="স্কুলভিত্তিক মেধা তালিকা প্রিন্ট / PDF সংরক্ষণ করুন"
              >
                <Printer className="w-4 h-4" />
                <span>স্কুলভিত্তিক মেধা তালিকা PDF</span>
              </button>
            )}

            {/* ২. পুরো রেজাল্ট ডিলিট করুন বাটন (PIN Protected) */}
            <button
              type="button"
              onClick={handleRequestDeleteAll}
              disabled={eventMarks.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-900 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title="এই ইভেন্টের সকল শিক্ষার্থীর সংরক্ষিত রেজাল্ট মুছে ফেলুন (PIN আবশ্যক)"
            >
              <Trash2 className="w-4 h-4" />
              <span>পুরো রেজাল্ট ডিলিট করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERALL MERIT LIST */}
      {meritTab === 'overall' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs print:shadow-none print:border-none">
          {/* Printable Sheet Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  সার্বিক মেধা তালিকা (Overall Merit List) — {currentEvent?.name}
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                প্রাপ্ত সর্বোচ্চ নম্বরের ভিত্তিতে ক্রমবিন্যাসকৃত মেধা তালিকা
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-lg self-start sm:self-auto font-bold">
              মোট পরীক্ষার্থী: {overallMeritList.length} জন
            </span>
          </div>

          {overallMeritList.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">এই ইভেন্টে এখনও কোনো শিক্ষার্থীর মার্কস ইনপুট দেওয়া হয়নি।</p>
              <p className="text-xs text-slate-400 mt-1">উপরের ফরম থেকে Permanent ID দিয়ে মার্কস এন্ট্রি দিন।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center">মেধাক্রম</th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">Permanent ID</th>
                    <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-4">স্কুলের নাম</th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">শ্রেণী</th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">রোল</th>
                    <th className="py-3 px-3 text-center font-bold">প্রাপ্ত মার্কস</th>
                    <th className="py-3 px-3 text-center w-16">মুছুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overallMeritList.map((record, index) => {
                    const rank = index + 1;
                    return (
                      <tr
                        key={record.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          rank === 1
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 font-semibold'
                            : rank === 2
                            ? 'bg-slate-100/40 dark:bg-slate-800/20'
                            : rank === 3
                            ? 'bg-amber-50/20 dark:bg-amber-950/10'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold font-mono text-xs ${
                              rank === 1
                                ? 'bg-amber-500 text-white shadow-xs'
                                : rank === 2
                                ? 'bg-slate-400 text-white'
                                : rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {record.permanentId}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {record.studentName}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {record.schoolName}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                          {record.className}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                          {record.roll}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {record.marks}
                        </td>
                        {/* 1. Individual Result Delete: সরাসরি ডিলিট, কোনো PIN লাগবে না */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDirectIndividualDelete(record.id, record.studentName)}
                            className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title={`"${record.studentName}" এর মার্কস সরাসরি মুছুন (কোনো পিন আবশ্যক নয়)`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHOOL-WISE MERIT LIST */}
      {meritTab === 'schoolwise' && (
        <div className="space-y-6">
          {schoolWiseMeritList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400">
              <SchoolIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">এই ইভেন্টে এখনও কোনো স্কুলের শিক্ষার্থীর মার্কস ইনপুট দেওয়া হয়নি।</p>
            </div>
          ) : (
            schoolWiseMeritList.map((group) => (
              <div
                key={group.schoolName}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
              >
                <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SchoolIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {group.schoolName}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    মোট শিক্ষার্থী: {group.records.length} জন
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100/60 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-14 text-center">মেধাক্রম</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-center">Permanent ID</th>
                        <th className="py-2.5 px-4">শিক্ষার্থীর নাম</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-center">শ্রেণী</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-center">রোল</th>
                        <th className="py-2.5 px-3 text-center font-bold">প্রাপ্ত মার্কস</th>
                        <th className="py-2.5 px-3 text-center w-16">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.records.map((record, rIdx) => {
                        const rank = rIdx + 1;
                        return (
                          <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-center font-bold font-mono text-xs">
                              {rank === 1 ? '১ম' : rank === 2 ? '২য়' : rank === 3 ? '৩য়' : `${rank}ম`}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                              {record.permanentId}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {record.studentName}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">
                              {record.className}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                              {record.roll}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {record.marks}
                            </td>
                            {/* 1. Individual Result Delete: সরাসরি ডিলিট, কোনো PIN লাগবে না */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDirectIndividualDelete(record.id, record.studentName)}
                                className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                title={`"${record.studentName}" এর মার্কস সরাসরি মুছুন (কোনো পিন আবশ্যক নয়)`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ENTRIES AND EDIT/DELETE */}
      {meritTab === 'entries' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {currentEvent?.name} এর সংরক্ষিত মার্কস তালিকা
            </h4>
            <span className="text-xs text-slate-500 font-mono">{eventMarks.length} জন শিক্ষার্থী</span>
          </div>

          {eventMarks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">কোনো মার্কস এন্ট্রি নেই।</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Permanent ID</th>
                    <th className="py-2.5 px-4">শিক্ষার্থীর নাম</th>
                    <th className="py-2.5 px-4">স্কুল</th>
                    <th className="py-2.5 px-4 text-center">শ্রেণী</th>
                    <th className="py-2.5 px-4 text-center">মার্কস</th>
                    <th className="py-2.5 px-4 text-center w-16">মুছুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {eventMarks.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold">{rec.permanentId}</td>
                      <td className="py-2.5 px-4 font-medium">{rec.studentName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{rec.schoolName}</td>
                      <td className="py-2.5 px-4 text-center text-slate-500">{rec.className}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {rec.marks}
                      </td>
                      {/* 1. Individual Result Delete: সরাসরি ডিলিট, কোনো PIN লাগবে না */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDirectIndividualDelete(rec.id, rec.studentName)}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title={`"${rec.studentName}" এর মার্কস সরাসরি মুছুন (কোনো পিন আবশ্যক নয়)`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ২. "পুরো রেজাল্ট ডিলিট করুন" PIN MODAL (Strictly Secret PIN - Never shown in UI) */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-950/80 p-6 overflow-hidden">
            <button
              onClick={() => {
                if (!isDeletingAll) {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllPin('');
                  setDeleteAllPinError('');
                }
              }}
              disabled={isDeletingAll}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  পুরো রেজাল্ট ডিলিট করুন
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ইভেন্ট: <strong className="text-slate-700 dark:text-slate-300">"{currentEvent?.name}"</strong>
                </p>
              </div>
            </div>

            <div className="mb-5 space-y-2 text-xs text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 leading-relaxed">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>সতর্কবার্তা: স্থায়ীভাবে মুছে ফেলা হবে!</span>
              </div>
              <p>
                • এই ইভেন্টের মোট <strong className="font-mono text-rose-600 dark:text-rose-400">{eventMarks.length}</strong> জন শিক্ষার্থীর সকল সংরক্ষিত মার্কস ও রেজাল্ট ক্লাউড থেকে স্থায়ীভাবে মুছে যাবে।
              </p>
              <p>
                • রেজাল্ট মুছে ফেলার পর আর ফিরিয়ে আনা সম্ভব হবে না। নিশ্চিত হতে প্রশাসক পিন (PIN) প্রদান করুন।
              </p>
            </div>

            <form onSubmit={handleConfirmDeleteAllMarks} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রশাসক পিন (Admin PIN) প্রবেশ করান:
                </label>
                <input
                  ref={pinInputRef}
                  type="password"
                  maxLength={6}
                  value={deleteAllPin}
                  onChange={(e) => {
                    setDeleteAllPin(e.target.value);
                    if (deleteAllPinError) setDeleteAllPinError('');
                  }}
                  placeholder=""
                  autoComplete="off"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-slate-900 dark:text-white"
                />
                {deleteAllPinError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{deleteAllPinError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteAllModalOpen(false);
                    setDeleteAllPin('');
                    setDeleteAllPinError('');
                  }}
                  disabled={isDeletingAll}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={deleteAllPin.length === 0 || isDeletingAll}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeletingAll ? 'মুছে ফেলা হচ্ছে...' : 'পুরো রেজাল্ট মুছুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
