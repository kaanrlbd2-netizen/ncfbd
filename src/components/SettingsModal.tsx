import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  GraduationCap,
  School as SchoolIcon,
  Award,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Save,
  RotateCcw,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  KeyRound,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import { AppSettings, ClassItem, EventItem, InstitutionConfig, School } from '../types';

interface SettingsProps {
  institution: InstitutionConfig;
  classes: ClassItem[];
  schools: School[];
  events: EventItem[];
  adminPassword: string;
  onSaveAllSettings: (settings: AppSettings) => Promise<void>;
  onResetDefaults: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Settings: React.FC<SettingsProps> = ({
  institution,
  classes,
  schools,
  events,
  adminPassword,
  onSaveAllSettings,
  onResetDefaults,
  onShowToast,
}) => {
  // Local Draft States (No automatic saving to Firebase until "সেভ করুন" is clicked)
  const [draftInstitution, setDraftInstitution] = useState<InstitutionConfig>(institution);
  const [draftClasses, setDraftClasses] = useState<ClassItem[]>(classes);
  const [draftSchools, setDraftSchools] = useState<School[]>(schools);
  const [draftEvents, setDraftEvents] = useState<EventItem[]>(events);
  const [draftPassword, setDraftPassword] = useState<string>(adminPassword || '1971');
  const [confirmPassword, setConfirmPassword] = useState<string>(adminPassword || '1971');

  // Saving indicator
  const [isSaving, setIsSaving] = useState(false);

  // Class Management local UI state
  const [newClassName, setNewClassName] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassNameVal, setEditClassNameVal] = useState('');

  // School Management local UI state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editSchoolNameVal, setEditSchoolNameVal] = useState('');
  const [editSchoolCodeVal, setEditSchoolCodeVal] = useState('');

  // Event Management local UI state
  const [newEventName, setNewEventName] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventNameVal, setEditEventNameVal] = useState('');

  // Detect whether there are unsaved local modifications compared to currently synced props
  const hasUnsavedChanges = useMemo(() => {
    const isInstChanged =
      draftInstitution.name !== institution.name ||
      draftInstitution.tagline !== institution.tagline ||
      draftInstitution.logo !== institution.logo;

    const isClassesChanged = JSON.stringify(draftClasses) !== JSON.stringify(classes);
    const isSchoolsChanged = JSON.stringify(draftSchools) !== JSON.stringify(schools);
    const isEventsChanged = JSON.stringify(draftEvents) !== JSON.stringify(events);
    const isPassChanged = draftPassword !== (adminPassword || '1971');

    return isInstChanged || isClassesChanged || isSchoolsChanged || isEventsChanged || isPassChanged;
  }, [draftInstitution, institution, draftClasses, classes, draftSchools, schools, draftEvents, events, draftPassword, adminPassword]);

  // Sync draft state with incoming remote Firestore updates if the user has no pending unsaved edits
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setDraftInstitution(institution);
      setDraftClasses(classes);
      setDraftSchools(schools);
      setDraftEvents(events);
      setDraftPassword(adminPassword || '1971');
      setConfirmPassword(adminPassword || '1971');
    }
  }, [institution, classes, schools, events, adminPassword, hasUnsavedChanges]);

  // Discard all unsaved changes
  const handleDiscardChanges = () => {
    setDraftInstitution(institution);
    setDraftClasses(classes);
    setDraftSchools(schools);
    setDraftEvents(events);
    setDraftPassword(adminPassword || '1971');
    setConfirmPassword(adminPassword || '1971');
    setEditingClassId(null);
    setEditingSchoolId(null);
    setEditingEventId(null);
    onShowToast('সকল পরিবর্তন বাতিল করে আগের অবস্থায় ফিরিয়ে আনা হয়েছে।', 'info');
  };

  // MASTER SAVE HANDLER: ONLY triggers Firebase write upon explicit click
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Validation: Institution Name
    if (!draftInstitution.name.trim()) {
      onShowToast('প্রতিষ্ঠানের নাম খালি রাখা যাবে না!', 'error');
      return;
    }

    // 2. Validation: Classes
    if (draftClasses.length === 0) {
      onShowToast('কমপক্ষে একটি শ্রেণী থাকতে হবে!', 'error');
      return;
    }

    // 3. Validation: Schools
    if (draftSchools.length === 0) {
      onShowToast('কমপক্ষে একটি স্কুল থাকতে হবে!', 'error');
      return;
    }
    const emptySchool = draftSchools.find((s) => !s.name.trim() || !s.code.trim());
    if (emptySchool) {
      onShowToast('সকল স্কুলের নাম ও কোড উভয়ই পূরণ থাকতে হবে!', 'error');
      return;
    }

    // 4. Validation: Password
    if (!draftPassword.trim()) {
      onShowToast('অ্যাডমিন পাসওয়ার্ড খালি রাখা যাবে না!', 'error');
      return;
    }
    if (draftPassword.trim() !== confirmPassword.trim()) {
      onShowToast('পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড হুবহু একই হতে হবে!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: AppSettings = {
        institution: {
          name: draftInstitution.name.trim(),
          tagline: draftInstitution.tagline.trim(),
          logo: draftInstitution.logo,
        },
        classes: draftClasses,
        schools: draftSchools.map((s) => ({
          ...s,
          name: s.name.trim(),
          code: s.code.trim().toUpperCase(),
        })),
        events: draftEvents.map((ev) => ({
          ...ev,
          name: ev.name.trim(),
        })),
        adminPassword: draftPassword.trim(),
      };

      await onSaveAllSettings(payload);
      onShowToast('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
    } catch (err) {
      console.error('Failed to save settings to Firestore:', err);
      onShowToast('সেটিংস সংরক্ষণে সমস্যা হয়েছে! আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Logo file upload handler (Updates local draft only)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onShowToast('ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setDraftInstitution((prev) => ({ ...prev, logo: base64 }));
      onShowToast('লোগো নির্বাচিত হয়েছে। ক্লাউডে সেভ করতে "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Class Handlers (max 10 - local draft only)
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftClasses.length >= 10) {
      onShowToast('সর্বোচ্চ ১০টি শ্রেণী যোগ করা সম্ভব!', 'error');
      return;
    }
    if (!newClassName.trim()) {
      onShowToast('শ্রেণীর নাম লিখুন!', 'error');
      return;
    }
    const newClass: ClassItem = {
      id: `cls-${Date.now()}`,
      name: newClassName.trim(),
      order: draftClasses.length + 1,
    };
    setDraftClasses((prev) => [...prev, newClass]);
    setNewClassName('');
    onShowToast('শ্রেণী যোগ করা হয়েছে। ক্লাউডে সংরক্ষণে "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
  };

  const handleUpdateClass = (id: string) => {
    if (!editClassNameVal.trim()) return;
    setDraftClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editClassNameVal.trim() } : c))
    );
    setEditingClassId(null);
    onShowToast('শ্রেণীর নাম সংশোধন হয়েছে। "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
  };

  const handleDeleteClass = (id: string) => {
    if (draftClasses.length <= 1) {
      onShowToast('অন্তত একটি শ্রেণী থাকা আবশ্যক!', 'error');
      return;
    }
    setDraftClasses((prev) => prev.filter((c) => c.id !== id));
    onShowToast('শ্রেণী তালিকা থেকে বাদ দেওয়া হয়েছে। "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
  };

  // School Handlers (max 30 - local draft only)
  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftSchools.length >= 30) {
      onShowToast('সর্বোচ্চ ৩০টি স্কুল যোগ করা সম্ভব!', 'error');
      return;
    }
    if (!newSchoolName.trim() || !newSchoolCode.trim()) {
      onShowToast('স্কুলের নাম ও কোড উভয়ই আবশ্যক!', 'error');
      return;
    }
    const cleanCode = newSchoolCode.trim().toUpperCase();
    const newSchool: School = {
      id: `sch-${Date.now()}`,
      name: newSchoolName.trim(),
      code: cleanCode,
    };
    setDraftSchools((prev) => [...prev, newSchool]);
    setNewSchoolName('');
    setNewSchoolCode('');
    onShowToast(`স্কুল "${newSchool.name}" যোগ হয়েছে। সেভ করতে "সেভ করুন" বাটনে ক্লিক করুন।`, 'info');
  };

  const handleUpdateSchool = (id: string) => {
    if (!editSchoolNameVal.trim() || !editSchoolCodeVal.trim()) return;
    const cleanCode = editSchoolCodeVal.trim().toUpperCase();
    setDraftSchools((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, name: editSchoolNameVal.trim(), code: cleanCode } : s
      )
    );
    setEditingSchoolId(null);
    onShowToast('স্কুলের তথ্য পরিবর্তন হয়েছে। "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
  };

  const handleDeleteSchool = (id: string) => {
    if (draftSchools.length <= 1) {
      onShowToast('অন্তত একটি স্কুল থাকা আবশ্যক!', 'error');
      return;
    }
    setDraftSchools((prev) => prev.filter((s) => s.id !== id));
    onShowToast('স্কুল বাদ দেওয়া হয়েছে। "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
  };

  // Event Handlers (max 5 - local draft only)
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftEvents.length >= 5) {
      onShowToast('সর্বোচ্চ ৫টি ইভেন্ট যোগ করা সম্ভব!', 'error');
      return;
    }
    if (!newEventName.trim()) {
      onShowToast('ইভেন্টের নাম লিখুন!', 'error');
      return;
    }
    const newEvt: EventItem = {
      id: `evt-${Date.now()}`,
      name: newEventName.trim(),
    };
    setDraftEvents((prev) => [...prev, newEvt]);
    setNewEventName('');
    onShowToast('ইভেন্ট যোগ হয়েছে। সংরক্ষণে "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
  };

  const handleUpdateEvent = (id: string) => {
    if (!editEventNameVal.trim()) return;
    setDraftEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, name: editEventNameVal.trim() } : e))
    );
    setEditingEventId(null);
    onShowToast('ইভেন্টের নাম সংশোধন হয়েছে। "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
  };

  const handleDeleteEvent = (id: string) => {
    setDraftEvents((prev) => prev.filter((e) => e.id !== id));
    onShowToast('ইভেন্ট বাদ দেওয়া হয়েছে। "সেভ করুন" বাটনে ক্লিক করুন।', 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Top Header & Prominent Save Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>সিস্টেম কনফিগারেশন ও সেটিংস</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              প্রতিষ্ঠান, লোগো, শ্রেণী, স্কুল, ইভেন্ট ও অ্যাডমিন পাসওয়ার্ড পরিচালনা করুন। কোনো পরিবর্তন স্বয়ংক্রিয়ভাবে সেভ হবে না — পরিবর্তন শেষে <strong className="text-emerald-600 dark:text-emerald-400">"সেভ করুন"</strong> বাটনে ক্লিক করুন।
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={onResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="সকল ডিফল্ট ডেটা পুনরায় সেট করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ডিফল্ট সেটিংস</span>
            </button>
          </div>
        </div>

        {/* Action Callout Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>অসংরক্ষিত পরিবর্তন রয়েছে!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>সকল পরিবর্তন ক্লাউডে সংরক্ষিত</span>
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
              {hasUnsavedChanges
                ? 'ক্লাউডে আপডেট পাঠাতে "সেভ করুন" বাটনে ক্লিক করুন।'
                : 'নতুন পরিবর্তন এনে "সেভ করুন" চাপলে অন্য ডিভাইসে সাথে সাথে দেখাবে।'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                পরিবর্তন বাতিল
              </button>
            )}

            {/* THE EXPLICIT "সেভ করুন" BUTTON */}
            <button
              type="button"
              onClick={() => handleSaveAll()}
              disabled={isSaving}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all active:scale-95 ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 shadow-emerald-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              } ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>সেভ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>সেভ করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* A. Institution Settings (Requirement 3A + Logo) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ক. প্রতিষ্ঠানের তথ্য ও ব্র্যান্ডিং (Institution Settings)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                অ্যাপের শীর্ষে ও সকল প্রিন্ট/পিডিএফ কপিতে এই নাম ও ট্যাগলাইন প্রদর্শিত হবে
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
            * পরিবর্তন শেষে "সেভ করুন" চাপুন
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                প্রতিষ্ঠানের নাম (Institution Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={draftInstitution.name}
                onChange={(e) =>
                  setDraftInstitution((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="যেমন: পরীক্ষা নিয়ন্ত্রণ সিস্টেম"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ট্যাগলাইন (Tagline)
              </label>
              <input
                type="text"
                value={draftInstitution.tagline}
                onChange={(e) =>
                  setDraftInstitution((prev) => ({ ...prev, tagline: e.target.value }))
                }
                placeholder="যেমন: সততা, স্বচ্ছতা ও শৃঙ্খলার সাথে মেধা বিকাশ"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Institution Logo Upload Option */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              প্রতিষ্ঠানের লোগো (Institution Logo)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {draftInstitution.logo ? (
                <div className="relative group w-24 h-24 rounded-2xl border-2 border-dashed border-emerald-500 bg-white dark:bg-slate-950 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  <img
                    src={draftInstitution.logo}
                    alt="প্রতিষ্ঠানের লোগো"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDraftInstitution((prev) => ({ ...prev, logo: undefined }))
                    }
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition-all"
                    title="লোগো মুছে ফেলুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-8 h-8 opacity-60" />
                  <span className="text-[10px] mt-1">লোগো নেই</span>
                </div>
              )}

              <div className="space-y-1.5 flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{draftInstitution.logo ? 'নতুন লোগো পরিবর্তন করুন' : 'লোগো ফাইল আপলোড করুন'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  • ফরম্যাট: PNG, JPG, JPEG বা WebP (সর্বোচ্চ সাইজ ২ মেগাবাইট)।
                  <br />
                  • এই লোগোটি PDF পরীক্ষা শিটের একদম শীর্ষে প্রতিটি স্কুলের হেডারের উপরে প্রদর্শিত হবে।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B. Class Management (Requirement 3B - up to 10 classes) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                খ. শ্রেণী ব্যবস্থাপনা (Class Management)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সর্বোচ্চ ১০টি শ্রেণী যোগ করতে পারবেন (ফরমের শ্রেণী ড্রপডাউনে আসবে)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            {draftClasses.length}/১০ টি শ্রেণী
          </span>
        </div>

        {/* Add Class Form */}
        {draftClasses.length < 10 && (
          <form onSubmit={handleAddClass} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="নতুন শ্রেণীর নাম লিখুন (যেমন: তৃতীয় শ্রেণী বা Class 3)"
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>শ্রেণী যোগ করুন</span>
            </button>
          </form>
        )}

        {/* Class List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {draftClasses.map((cls, idx) => (
            <div
              key={cls.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {editingClassId === cls.id ? (
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editClassNameVal}
                    onChange={(e) => setEditClassNameVal(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateClass(cls.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="সংরক্ষণ"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingClassId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                    title="বাতিল"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400 w-5">{idx + 1}.</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    {cls.name}
                  </span>
                </div>
              )}

              {editingClassId !== cls.id && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClassId(cls.id);
                      setEditClassNameVal(cls.name);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(cls.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* C. School Management (Requirement 3C - up to 30 schools, mandatory School Code) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <SchoolIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                গ. স্কুল ও স্কুল কোড ব্যবস্থাপনা (School Management)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সর্বোচ্চ ৩০টি স্কুল। প্রতিটি স্কুলের নামের পাশে কোড (যেমন: BB, CC, XYZ) থাকা বাধ্যতামূলক, যা সিরিয়াল তৈরিতে ব্যবহৃত হবে।
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
            {draftSchools.length}/৩০ টি স্কুল
          </span>
        </div>

        {/* Add School Form */}
        {draftSchools.length < 30 && (
          <form onSubmit={handleAddSchool} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-4">
            <div className="sm:col-span-7">
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="স্কুলের পুরো নাম লিখুন"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                maxLength={6}
                value={newSchoolCode}
                onChange={(e) => setNewSchoolCode(e.target.value.toUpperCase())}
                placeholder="স্কুল কোড (যেমন: BB, CC)"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>স্কুল যোগ</span>
              </button>
            </div>
          </form>
        )}

        {/* School List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {draftSchools.map((school, idx) => (
            <div
              key={school.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {editingSchoolId === school.id ? (
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editSchoolNameVal}
                    onChange={(e) => setEditSchoolNameVal(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-sky-500 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={editSchoolCodeVal}
                    onChange={(e) => setEditSchoolCodeVal(e.target.value.toUpperCase())}
                    className="w-20 px-2 py-1 text-xs font-mono uppercase bg-white dark:bg-slate-900 border border-sky-500 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateSchool(school.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="সংরক্ষণ"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSchoolId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                    title="বাতিল"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-slate-400 w-5 shrink-0">{idx + 1}.</span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">
                      {school.name}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      কোড: {school.code}
                    </span>
                  </div>
                </div>
              )}

              {editingSchoolId !== school.id && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSchoolId(school.id);
                      setEditSchoolNameVal(school.name);
                      setEditSchoolCodeVal(school.code);
                    }}
                    className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchool(school.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* D. Event Management (Requirement 3D - up to 5 events) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ঘ. ইভেন্ট ব্যবস্থাপনা (Event Management)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সর্বোচ্চ ৫টি ইভেন্ট যোগ করতে পারবেন (শিক্ষার্থী ফরমের মাল্টি-সিলেক্ট ড্রপডাউনে আসবে)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            {draftEvents.length}/৫ টি ইভেন্ট
          </span>
        </div>

        {/* Add Event Form */}
        {draftEvents.length < 5 && (
          <form onSubmit={handleAddEvent} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="নতুন ইভেন্টের নাম লিখুন (যেমন: ক্যালিগ্রাফি বা বিতর্ক)"
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>ইভেন্ট যোগ করুন</span>
            </button>
          </form>
        )}

        {/* Event List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {draftEvents.map((evt, idx) => (
            <div
              key={evt.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {editingEventId === evt.id ? (
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editEventNameVal}
                    onChange={(e) => setEditEventNameVal(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-amber-500 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateEvent(evt.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="সংরক্ষণ"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEventId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                    title="বাতিল"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400 w-5">{idx + 1}.</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    {evt.name}
                  </span>
                </div>
              )}

              {editingEventId !== evt.id && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEventId(evt.id);
                      setEditEventNameVal(evt.name);
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* E. Admin Password Security (Requirement 1) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ঙ. অ্যাডমিন পাসওয়ার্ড পরিবর্তন (Admin Password Settings)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সকল ডিভাইসের অ্যাডমিনদের লগইন করার একক পাসওয়ার্ড (ডিফল্ট: 1971)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
            * পরিবর্তন শেষে "সেভ করুন" চাপুন
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                নতুন পাসওয়ার্ড
              </label>
              <input
                type="text"
                value={draftPassword}
                onChange={(e) => setDraftPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড লিখুন"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <input
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Save Floating Bar - Always accessible while scrolling */}
      <div className="fixed bottom-4 left-4 right-4 max-w-5xl mx-auto z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500/40 dark:border-emerald-500/40 shadow-2xl rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-3">
          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              অসংরক্ষিত পরিবর্তন রয়েছে!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <Check className="w-3.5 h-3.5" />
              সকল সেটিংস ক্লাউডে সিঙ্ক করা
            </span>
          )}
          <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:inline">
            {hasUnsavedChanges
              ? 'পরিবর্তন স্থায়ী করতে "সেভ করুন" বাটনে ক্লিক করুন।'
              : 'কোনো পরিবর্তন করলে এই বাটনে ক্লিক করতে হবে।'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              পরিবর্তন বাতিল
            </button>
          )}

          {/* EXPLICIT MASTER "সেভ করুন" BUTTON */}
          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className={`inline-flex items-center justify-center gap-2 px-7 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900 shadow-emerald-600/40'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            } ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ক্লাউডে সেভ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>সেভ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
