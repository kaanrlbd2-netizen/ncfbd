import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Download,
  Users,
  Sparkles,
  RotateCcw,
  Tag,
  GraduationCap,
  School as SchoolIcon,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { ClassItem, EventItem, School, Student } from '../types';

interface StudentTableProps {
  students: Student[];
  schools: School[];
  classes: ClassItem[];
  events: EventItem[];
  onEditStudent: (student: Student) => void;
  onRequestDeleteStudent: (student: Student) => void;
  onRequestGenerateSerials: () => void;
  onOpenPdf: () => void;
  onExportExcel: () => void;
  onLoadSampleData: () => void;
  onRequestClearAll: () => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  schools,
  classes,
  events,
  onEditStudent,
  onRequestDeleteStudent,
  onRequestGenerateSerials,
  onOpenPdf,
  onExportExcel,
  onLoadSampleData,
  onRequestClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.serialNumber && s.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.fatherName && s.fatherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.motherName && s.motherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.schoolName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSchool = !filterSchool || s.schoolName === filterSchool;
      const matchesClass = !filterClass || s.className === filterClass;
      const matchesEvent = !filterEvent || (s.events && s.events.includes(filterEvent));

      return matchesSearch && matchesSchool && matchesClass && matchesEvent;
    });
  }, [students, searchTerm, filterSchool, filterClass, filterEvent]);

  // Statistics
  const totalStudents = students.length;
  const serialAssignedCount = students.filter((s) => Boolean(s.serialNumber)).length;
  const uniqueSchoolsCount = new Set(students.map((s) => s.schoolName)).size;
  const uniqueClassesCount = new Set(students.map((s) => s.className)).size;

  const resetFilters = () => {
    setSearchTerm('');
    setFilterSchool('');
    setFilterClass('');
    setFilterEvent('');
  };

  return (
    <div className="space-y-5">
      {/* Action Toolbar & Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>মোট শিক্ষার্থী</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalStudents}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>সিরিয়াল বরাদ্দ</span>
            <Tag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {serialAssignedCount} <span className="text-xs font-normal text-slate-400">/ {totalStudents}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>স্কুল সংখ্যা</span>
            <SchoolIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {uniqueSchoolsCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>শ্রেণী সংখ্যা</span>
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {uniqueClassesCount}
          </div>
        </div>
      </div>

      {/* Main Operations Bar (Serial Generation, PDF, Excel) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Serial Generation Button (Requirement 4) */}
            <button
              onClick={onRequestGenerateSerials}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors"
              title="প্রশাসক পিন যাচাইকরণের মাধ্যমে সিরিয়াল তৈরি করুন"
            >
              <KeyRound className="w-4 h-4" />
              <span>সিরিয়াল তৈরি করুন</span>
            </button>

            {/* PDF Generation Button (Requirement 6) */}
            <button
              onClick={onOpenPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
              title="এ ফোর পেজে স্কুলভিত্তিক সিঙ্গেল PDF তৈরি করুন"
            >
              <FileText className="w-4 h-4" />
              <span>PDF তৈরি করুন</span>
            </button>

            {/* Excel Download Button (Requirement 7) */}
            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-xl shadow-xs transition-colors"
              title="সকল শিক্ষার্থীর তথ্য এক্সেল ফাইলে ডাউনলোড করুন"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Download করুন</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* Quick Sample Data Loader */}
            <button
              type="button"
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="২৫ জন ডেমো শিক্ষার্থী যোগ করুন"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>নমুনা ডেটা যুক্ত করুন</span>
            </button>

            {/* Clear All Data */}
            {students.length > 0 && (
              <button
                type="button"
                onClick={onRequestClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors"
                title="সকল শিক্ষার্থী মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব মুছুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Section */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Live Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="নাম, রোল, সিরিয়াল দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* School Filter */}
          <div>
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">সকল স্কুল ({schools.length})</option>
              {schools.map((sch) => (
                <option key={sch.id} value={sch.name}>
                  {sch.name} [{sch.code}]
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">সকল শ্রেণী ({classes.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Event Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">সকল ইভেন্ট</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.name}>
                  {evt.name}
                </option>
              ))}
            </select>

            {(searchTerm || filterSchool || filterClass || filterEvent) && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors shrink-0"
                title="ফিল্টার রিসেট করুন"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              নিবন্ধিত শিক্ষার্থী তালিকা
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredStudents.length} জন প্রদর্শিত
            </span>
          </div>

          {filteredStudents.length !== students.length && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              (মোট {students.length} জনের মধ্যে ফিল্টারকৃত)
            </span>
          )}
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {students.length === 0 ? 'কোনো শিক্ষার্থী এখনও নিবন্ধিত হয়নি' : 'ফিল্টারের সাথে কোনো শিক্ষার্থী মিলেনি'}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {students.length === 0
                ? 'উপরের ফরম থেকে নতুন শিক্ষার্থী যুক্ত করুন অথবা "নমুনা ডেটা যুক্ত করুন" বোতামে ক্লিক করুন।'
                : 'অন্য কোনো নাম, রোল বা ফিল্টার নির্বাচন করে চেষ্টা করুন।'}
            </p>
            {students.length === 0 ? (
              <button
                type="button"
                onClick={onLoadSampleData}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>নমুনা ডেটা দিয়ে পরীক্ষা করুন</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ফিল্টার মুছুন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">ক্রমিক</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-center">Permanent ID</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">সিরিয়াল নম্বর</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">রোল</th>
                  <th className="py-3 px-3.5">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-3.5">পিতা / মাতার নাম</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">শ্রেণী</th>
                  <th className="py-3 px-3.5">স্কুলের নাম</th>
                  <th className="py-3 px-3.5">ইভেন্টসমূহ</th>
                  <th className="py-3 px-3.5 text-right w-24">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredStudents.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3.5 text-center font-mono tabular-nums text-slate-400 dark:text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Permanent ID */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                        {student.permanentId || '-'}
                      </span>
                    </td>

                    {/* Serial Number */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {student.serialNumber ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          {student.serialNumber}
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                          অপেক্ষমাণ
                        </span>
                      )}
                    </td>

                    {/* Roll */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200">
                      {student.roll}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-3.5 font-medium text-slate-900 dark:text-white">
                      {student.name}
                    </td>

                    {/* Parents */}
                    <td className="py-3 px-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <div>{student.fatherName ? `পিতা: ${student.fatherName}` : '-'}</div>
                      {student.motherName && (
                        <div className="text-slate-400 dark:text-slate-500">
                          মাতা: {student.motherName}
                        </div>
                      )}
                    </td>

                    {/* Class */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {student.className}
                      </span>
                    </td>

                    {/* School */}
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {student.schoolName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        কোড: {student.schoolCode}
                      </div>
                    </td>

                    {/* Events */}
                    <td className="py-3 px-3.5">
                      {student.events && student.events.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.events.map((evt, eIdx) => (
                            <span
                              key={eIdx}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-tight"
                            >
                              {evt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEditStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRequestDeleteStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
