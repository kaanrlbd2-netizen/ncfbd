import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Edit3,
  X,
  Check,
  ChevronDown,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ClassItem, EventItem, School, Student } from '../types';

interface StudentFormProps {
  classes: ClassItem[];
  schools: School[];
  events: EventItem[];
  editingStudent: Student | null;
  onSaveStudent: (studentData: Omit<Student, 'id' | 'createdAt' | 'orderIndex' | 'serialNumber'>) => void;
  onUpdateStudent: (id: string, updatedData: Partial<Student>) => void;
  onCancelEdit: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  classes,
  schools,
  events,
  editingStudent,
  onSaveStudent,
  onUpdateStudent,
  onCancelEdit,
}) => {
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [roll, setRoll] = useState('');
  const [permanentId, setPermanentId] = useState('');
  const [classId, setClassId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eventDropdownRef = useRef<HTMLDivElement>(null);

  // Close event dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target as Node)) {
        setIsEventDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update form fields when editing student changes
  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name || '');
      setFatherName(editingStudent.fatherName || '');
      setMotherName(editingStudent.motherName || '');
      setRoll(editingStudent.roll || '');
      setPermanentId(editingStudent.permanentId || '');
      setClassId(editingStudent.classId || '');
      setSchoolId(editingStudent.schoolId || '');
      setSelectedEvents(editingStudent.events || []);
      setErrors({});
    } else {
      resetForm();
    }
  }, [editingStudent]);

  // Set default class and school if none selected
  useEffect(() => {
    if (!editingStudent) {
      if (classes.length > 0 && !classId) {
        setClassId(classes[0].id);
      }
      if (schools.length > 0 && !schoolId) {
        setSchoolId(schools[0].id);
      }
    }
  }, [classes, schools]);

  const resetForm = () => {
    setName('');
    setFatherName('');
    setMotherName('');
    setRoll('');
    setPermanentId('');
    if (classes.length > 0) setClassId(classes[0].id);
    if (schools.length > 0) setSchoolId(schools[0].id);
    setSelectedEvents([]);
    setErrors({});
  };

  const toggleEvent = (eventName: string) => {
    if (selectedEvents.includes(eventName)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== eventName));
    } else {
      if (selectedEvents.length >= 5) {
        alert('সর্বোচ্চ ৫টি ইভেন্ট নির্বাচন করা যাবে।');
        return;
      }
      setSelectedEvents([...selectedEvents, eventName]);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'শিক্ষার্থীর নাম আবশ্যক';
    }
    if (!roll.trim()) {
      newErrors.roll = 'রোল নম্বর আবশ্যক';
    }
    if (!classId) {
      newErrors.classId = 'শ্রেণী নির্বাচন আবশ্যক';
    }
    if (!schoolId) {
      newErrors.schoolId = 'স্কুল নির্বাচন আবশ্যক';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedClass = classes.find((c) => c.id === classId);
    const selectedSchool = schools.find((s) => s.id === schoolId);

    const studentPayload = {
      name: name.trim(),
      fatherName: fatherName.trim() || undefined,
      motherName: motherName.trim() || undefined,
      roll: roll.trim(),
      permanentId: permanentId.trim().toUpperCase() || undefined,
      classId: classId,
      className: selectedClass?.name || 'শ্রেণী',
      schoolId: schoolId,
      schoolName: selectedSchool?.name || 'স্কুল',
      schoolCode: selectedSchool?.code || 'GEN',
      events: selectedEvents,
    };

    if (editingStudent) {
      onUpdateStudent(editingStudent.id, studentPayload);
    } else {
      onSaveStudent(studentPayload);
      resetForm();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            {editingStudent ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {editingStudent ? 'শিক্ষার্থীর তথ্য সম্পাদনা' : 'নতুন শিক্ষার্থী নিবন্ধন ফরম'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editingStudent
                ? `রোল: ${editingStudent.roll} (${editingStudent.name}) এর তথ্য সংশোধন করা হচ্ছে`
                : 'সকল প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করে তালিকায় যুক্ত করুন'}
            </p>
          </div>
        </div>

        {editingStudent && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>সম্পাদনা বাতিল</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Student Name (required) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              শিক্ষার্থীর নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: তানভীর আহমেদ"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border ${
                errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
              } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
          </div>

          {/* Roll Number (required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              রোল নম্বর <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="যেমন: ১০১ বা 101"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border ${
                errors.roll ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
              } rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all`}
            />
            {errors.roll && <p className="mt-1 text-xs text-rose-500">{errors.roll}</p>}
          </div>

          {/* Permanent ID (optional / auto) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Permanent ID <span className="text-slate-400 font-normal">(ঐচ্ছিক: AA, AB...)</span>
            </label>
            <input
              type="text"
              value={permanentId}
              onChange={(e) => setPermanentId(e.target.value.toUpperCase())}
              placeholder="যেমন: AA, AB"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all"
            />
          </div>

          {/* Class Dropdown (required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              শ্রেণী (Class) <span className="text-rose-500">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all cursor-pointer"
            >
              {classes.length === 0 ? (
                <option value="">কোনো শ্রেণী পাওয়া যায়নি (সেটিংস থেকে যোগ করুন)</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))
              )}
            </select>
            {errors.classId && <p className="mt-1 text-xs text-rose-500">{errors.classId}</p>}
          </div>

          {/* Father's Name (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              পিতার নাম <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              placeholder="পিতার নাম লিখুন"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all"
            />
          </div>

          {/* Mother's Name (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              মাতার নাম <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
              placeholder="মাতার নাম লিখুন"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all"
            />
          </div>

          {/* School Dropdown (required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              স্কুলের নাম (School) <span className="text-rose-500">*</span>
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all cursor-pointer"
            >
              {schools.length === 0 ? (
                <option value="">কোনো স্কুল পাওয়া যায়নি (সেটিংস থেকে যোগ করুন)</option>
              ) : (
                schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} [{sch.code}]
                  </option>
                ))
              )}
            </select>
            {errors.schoolId && <p className="mt-1 text-xs text-rose-500">{errors.schoolId}</p>}
          </div>

          {/* Event Multi-Select Dropdown (max 5) */}
          <div className="relative" ref={eventDropdownRef}>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>ইভেন্টসমূহ (Events)</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {selectedEvents.length}/৫ নির্বাচিত
              </span>
            </label>

            <button
              type="button"
              onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-left flex items-center justify-between text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <span className="truncate">
                {selectedEvents.length === 0
                  ? 'ইভেন্ট নির্বাচন করুন (সর্বোচ্চ ৫টি)'
                  : selectedEvents.join(', ')}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 text-slate-400 shrink-0" />
            </button>

            {isEventDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">কোনো ইভেন্ট যুক্ত নেই</p>
                ) : (
                  events.map((evt) => {
                    const isSelected = selectedEvents.includes(evt.name);
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => toggleEvent(evt.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{evt.name}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-3" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Event Badges */}
        {selectedEvents.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">নির্বাচিত:</span>
            {selectedEvents.map((evt) => (
              <span
                key={evt}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md"
              >
                {evt}
                <button
                  type="button"
                  onClick={() => toggleEvent(evt)}
                  className="text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Submit & Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            রিসেট
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
          >
            {editingStudent ? (
              <>
                <Check className="w-4 h-4" />
                <span>হালনাগাদ করুন</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>যোগ করুন (Add Student)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
