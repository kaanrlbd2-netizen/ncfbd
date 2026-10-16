import React, { useRef, useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  School as SchoolIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { ClassItem, InstitutionConfig, Student } from '../types';
import { preparePdfData } from '../utils/pdfHelper';

interface PdfPreviewModalProps {
  students: Student[];
  classes: ClassItem[];
  institution: InstitutionConfig;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  students,
  classes,
  institution,
  onClose,
  onShowToast,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Group and structure data according to all requirements:
  // - Grouped by School
  // - Starts each School on a new page
  // - Maximum 20 students per page
  // - Sorted by Class in ascending order
  // - Shuffled sequence preserved within class
  const schoolGroups = preparePdfData(students, classes);

  // Calculate total pages across all schools
  const totalPagesAcrossAllSchools = schoolGroups.reduce(
    (acc, group) => acc + group.pages.length,
    0
  );

  // Handle direct PDF Download via html2pdf.js
  const handleDownloadPdf = async () => {
    if (!printContainerRef.current) return;
    setIsExporting(true);
    onShowToast('পিডিএফ ফাইল প্রস্তুত করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...', 'info');

    try {
      // Dynamic import to prevent SSR/bundle issues
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printContainerRef.current;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Exam_Sheet_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] as ('css' | 'legacy')[], before: '.pdf-page-break' },
      };

      await html2pdf().set(opt).from(element).save();
      onShowToast('পিডিএফ সফলভাবে ডাউনলোড হয়েছে!', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback message encouraging browser print
      onShowToast(
        'সরাসরি পিডিএফ উৎপাদনে সমস্যা হয়েছে। ব্রাউজারের "প্রিন্ট / PDF সংরক্ষণ" বোতাম ব্যবহার করুন।',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Handle native browser print / save-as-pdf
  const handleBrowserPrint = () => {
    window.print();
  };

  if (students.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full text-center border border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            তালিকায় কোনো শিক্ষার্থী নেই
          </h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            পিডিএফ তৈরি করার জন্য অনুগ্রহ করে প্রথমে শিক্ষার্থী যুক্ত করুন বা নমুনা ডেটা লোড করুন।
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-in fade-in">
      {/* Top Action Bar (hidden in print) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              অফিসিয়াল পরীক্ষা শিট (PDF প্রিভিউ ও প্রিন্ট)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              মোট স্কুল: {schoolGroups.length} টি · মোট পৃষ্ঠা: {totalPagesAcrossAllSchools} টি (সর্বোচ্চ ২০ জন/পৃষ্ঠা)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download PDF File Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
            title="পিডিএফ ফাইল ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'তৈরি হচ্ছে...' : 'PDF ফাইল ডাউনলোড'}</span>
          </button>

          {/* Direct Browser Print / PDF Button */}
          <button
            onClick={handleBrowserPrint}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-xs transition-colors"
            title="সরাসরি প্রিন্ট বা ব্রাউজার থেকে সেভ করুন"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF সেভ</span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors ml-1"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sheet Preview Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/90 flex justify-center">
        {/* Printable Root Container */}
        <div
          ref={printContainerRef}
          className="w-full max-w-[210mm] space-y-6 print:space-y-0 print:w-full print:max-w-none"
        >
          {schoolGroups.map((group, groupIdx) => (
            <div key={group.schoolName} className={groupIdx > 0 ? 'pdf-page-break' : ''}>
              {group.pages.map((page, pageIdx) => {
                const isFirstPageOfSchool = pageIdx === 0;

                return (
                  <div
                    key={`${group.schoolName}-page-${page.pageNumber}`}
                    className={`bg-white text-slate-900 border border-slate-300 shadow-lg print:shadow-none print:border-none p-6 sm:p-8 rounded-xl print:rounded-none min-h-[297mm] flex flex-col justify-between mb-8 print:mb-0 print:p-0 ${
                      pageIdx > 0 ? 'pdf-page-break print:break-before-page' : ''
                    }`}
                    style={{ pageBreakBefore: pageIdx > 0 || groupIdx > 0 ? 'always' : 'auto' }}
                  >
                    {/* Page Header */}
                    <div>
                      {/* Top Institution Branding */}
                      <div className="text-center pb-3 border-b-2 border-slate-900">
                        {institution.logo && (
                          <div className="mb-2.5 flex justify-center">
                            <img
                              src={institution.logo}
                              alt="প্রতিষ্ঠানের লোগো"
                              className="h-14 sm:h-16 w-auto object-contain max-w-[180px]"
                            />
                          </div>
                        )}
                        <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-wide font-serif uppercase">
                          {institution.name || 'পরীক্ষা নিয়ন্ত্রণ সিস্টেম'}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
                          {institution.tagline || 'বার্ষিক মেধা ও বৃত্তি মূল্যায়ন পরীক্ষা'}
                        </p>
                      </div>

                      {/* School Name as Large Bold Header (Mandatory Requirement 6) */}
                      <div className="my-4 p-3 bg-slate-100 print:bg-slate-100/50 rounded-lg border border-slate-300 text-center">
                        <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
                          স্কুলের নাম ও কোড
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-0.5">
                          {group.schoolName}
                        </h2>
                        <div className="mt-1 flex items-center justify-center gap-4 text-xs font-mono text-slate-700">
                          <span>স্কুল কোড: <strong className="font-bold text-slate-900">{group.schoolCode || 'N/A'}</strong></span>
                          <span>•</span>
                          <span>
                            পৃষ্ঠা: {page.pageNumber} / {page.totalPagesForSchool}
                          </span>
                        </div>
                      </div>

                      {/* Student Table */}
                      <table className="w-full text-left text-xs border-collapse border border-slate-900">
                        <thead>
                          <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900">
                            <th className="border border-slate-900 p-2 text-center w-10">ক্র.</th>
                            <th className="border border-slate-900 p-2 whitespace-nowrap text-center">সিরিয়াল নং</th>
                            <th className="border border-slate-900 p-2 whitespace-nowrap text-center">রোল</th>
                            <th className="border border-slate-900 p-2">শিক্ষার্থীর নাম</th>
                            <th className="border border-slate-900 p-2">পিতার নাম</th>
                            <th className="border border-slate-900 p-2">মাতার নাম</th>
                            <th className="border border-slate-900 p-2 whitespace-nowrap text-center">শ্রেণী</th>
                            <th className="border border-slate-900 p-2">ইভেন্ট(সমূহ)</th>
                            {/* Blank Marks Obtained Column (Mandatory Requirement 6) */}
                            <th className="border border-slate-900 p-2 text-center w-24 whitespace-nowrap">
                              প্রাপ্ত নম্বর
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {page.students.map((student, sIdx) => {
                            const globalRowIndex = (page.pageNumber - 1) * 20 + sIdx + 1;
                            return (
                              <tr key={student.id} className="border-b border-slate-400">
                                <td className="border border-slate-900 p-2 text-center font-mono tabular-nums">
                                  {globalRowIndex}
                                </td>
                                <td className="border border-slate-900 p-2 text-center font-mono font-bold text-slate-950 whitespace-nowrap">
                                  {student.serialNumber || '-'}
                                </td>
                                <td className="border border-slate-900 p-2 text-center font-mono font-bold text-slate-950 whitespace-nowrap">
                                  {student.roll}
                                </td>
                                <td className="border border-slate-900 p-2 font-semibold text-slate-950">
                                  {student.name}
                                </td>
                                <td className="border border-slate-900 p-2 text-slate-800">
                                  {student.fatherName || '-'}
                                </td>
                                <td className="border border-slate-900 p-2 text-slate-800">
                                  {student.motherName || '-'}
                                </td>
                                <td className="border border-slate-900 p-2 text-center text-slate-900 font-medium whitespace-nowrap">
                                  {student.className}
                                </td>
                                <td className="border border-slate-900 p-2 text-slate-800 text-[11px] leading-tight">
                                  {student.events && student.events.length > 0
                                    ? student.events.join(', ')
                                    : '-'}
                                </td>
                                {/* Blank Cell for handwritten marks */}
                                <td className="border border-slate-900 p-2 bg-slate-50/50 print:bg-white"></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Page Footer & Official Signatures */}
                    <div className="mt-8 pt-4 border-t border-slate-400">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-8 font-mono">
                        <span>এই পৃষ্ঠায় মোট শিক্ষার্থী: {page.students.length} জন</span>
                        <span>মুদ্রণের তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-800 pt-6">
                        <div>
                          <div className="border-t border-dotted border-slate-700 pt-1.5 font-semibold">
                            কক্ষ পরিদর্শকের স্বাক্ষর
                          </div>
                        </div>
                        <div>
                          <div className="border-t border-dotted border-slate-700 pt-1.5 font-semibold">
                            প্রধান পরীক্ষকের স্বাক্ষর
                          </div>
                        </div>
                        <div>
                          <div className="border-t border-dotted border-slate-700 pt-1.5 font-semibold">
                            কেন্দ্র সচিব / পরীক্ষা নিয়ন্ত্রক
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
