import React, { useRef, useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  Trophy,
  School as SchoolIcon,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { InstitutionConfig, MarkRecord } from '../types';

interface MeritPdfModalProps {
  type: 'overall' | 'schoolwise';
  eventName: string;
  marks: MarkRecord[];
  institution: InstitutionConfig;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const MeritPdfModal: React.FC<MeritPdfModalProps> = ({
  type,
  eventName,
  marks,
  institution,
  onClose,
  onShowToast,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Overall sorted marks (descending)
  const overallSorted = React.useMemo(() => {
    return [...marks].sort((a, b) => b.marks - a.marks);
  }, [marks]);

  // School-wise grouped and sorted marks
  const schoolWiseGroups = React.useMemo(() => {
    const map = new Map<string, MarkRecord[]>();
    marks.forEach((m) => {
      const sch = m.schoolName || 'অন্যান্য স্কুল';
      if (!map.has(sch)) map.set(sch, []);
      map.get(sch)!.push(m);
    });

    const result: { schoolName: string; records: MarkRecord[] }[] = [];
    map.forEach((records, schoolName) => {
      records.sort((a, b) => b.marks - a.marks);
      result.push({ schoolName, records });
    });
    result.sort((a, b) => a.schoolName.localeCompare(b.schoolName, 'bn'));
    return result;
  }, [marks]);

  // Handle direct PDF Download via html2pdf.js
  const handleDownloadPdf = async () => {
    if (!printContainerRef.current) return;
    setIsExporting(true);
    onShowToast('মেধা তালিকার পিডিএফ প্রস্তুত করা হচ্ছে...', 'info');

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printContainerRef.current;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${type === 'overall' ? 'Overall_Merit' : 'Schoolwise_Merit'}_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] as ('css' | 'legacy')[], before: '.pdf-page-break' },
      };

      await html2pdf().set(opt).from(element).save();
      onShowToast('পিডিএফ সফলভাবে ডাউনলোড হয়েছে!', 'success');
    } catch (err) {
      console.error('PDF error:', err);
      onShowToast('সরাসরি পিডিএফ তৈরি ব্যাহত হয়েছে। ব্রাউজারের প্রিন্ট বোতাম ব্যবহার করুন।', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-in fade-in">
      {/* Top Bar (hidden in print) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {type === 'overall' ? 'সার্বিক মেধা তালিকা PDF' : 'স্কুলভিত্তিক মেধা তালিকা PDF'} — {eventName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              মোট শিক্ষার্থী: {marks.length} জন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
          </button>

          <button
            onClick={handleBrowserPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / সেভ</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sheet View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/90 flex justify-center">
        <div
          ref={printContainerRef}
          className="w-full max-w-[210mm] bg-white text-slate-900 p-8 rounded-xl shadow-lg print:shadow-none print:border-none print:p-0 min-h-[297mm] flex flex-col justify-between"
        >
          <div>
            {/* Institution Header with Logo */}
            <div className="text-center pb-4 border-b-2 border-slate-900">
              {institution.logo && (
                <div className="mb-2 flex justify-center">
                  <img
                    src={institution.logo}
                    alt="লোগো"
                    className="h-14 w-auto object-contain max-w-[180px]"
                  />
                </div>
              )}
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase font-serif">
                {institution.name || 'পরীক্ষা নিয়ন্ত্রণ সিস্টেম'}
              </h1>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                {institution.tagline || 'স্বচ্ছ ও নির্ভুল ফলাফল ব্যবস্থাপনা'}
              </p>
            </div>

            {/* Title Banner */}
            <div className="my-4 p-3 bg-slate-100 rounded-lg border border-slate-300 text-center">
              <h2 className="text-lg font-black text-slate-950">
                {type === 'overall' ? 'সার্বিক মেধা তালিকা (Overall Merit List)' : 'স্কুলভিত্তিক মেধা তালিকা (School-wise Merit List)'}
              </h2>
              <div className="mt-1 flex items-center justify-center gap-4 text-xs text-slate-700 font-semibold">
                <span>ইভেন্ট: <strong className="text-slate-950">{eventName}</strong></span>
                <span>•</span>
                <span>তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
                <span>•</span>
                <span>মোট পরীক্ষার্থী: {marks.length} জন</span>
              </div>
            </div>

            {/* Tables */}
            {type === 'overall' ? (
              <table className="w-full text-left text-xs border-collapse border border-slate-900 mt-4">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900">
                    <th className="border border-slate-900 p-2 text-center w-14">মেধাক্রম</th>
                    <th className="border border-slate-900 p-2 text-center whitespace-nowrap">Permanent ID</th>
                    <th className="border border-slate-900 p-2">শিক্ষার্থীর নাম</th>
                    <th className="border border-slate-900 p-2">স্কুলের নাম</th>
                    <th className="border border-slate-900 p-2 text-center whitespace-nowrap">শ্রেণী</th>
                    <th className="border border-slate-900 p-2 text-center whitespace-nowrap font-bold">প্রাপ্ত মার্কস</th>
                  </tr>
                </thead>
                <tbody>
                  {overallSorted.map((record, index) => {
                    const rank = index + 1;
                    return (
                      <tr key={record.id} className="border-b border-slate-400">
                        <td className="border border-slate-900 p-2 text-center font-bold font-mono">
                          {rank === 1 ? '১ম' : rank === 2 ? '২য়' : rank === 3 ? '৩য়' : `${rank}ম`}
                        </td>
                        <td className="border border-slate-900 p-2 text-center font-mono font-bold whitespace-nowrap">
                          {record.permanentId}
                        </td>
                        <td className="border border-slate-900 p-2 font-bold text-slate-950">
                          {record.studentName}
                        </td>
                        <td className="border border-slate-900 p-2 text-slate-800">
                          {record.schoolName}
                        </td>
                        <td className="border border-slate-900 p-2 text-center">
                          {record.className}
                        </td>
                        <td className="border border-slate-900 p-2 text-center font-mono font-black text-sm text-slate-950">
                          {record.marks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="space-y-6 mt-4">
                {schoolWiseGroups.map((group) => (
                  <div key={group.schoolName}>
                    <div className="bg-slate-200 px-3 py-1.5 font-bold text-xs text-slate-950 border border-slate-900">
                      স্কুল: {group.schoolName} (মোট: {group.records.length} জন)
                    </div>
                    <table className="w-full text-left text-xs border-collapse border border-slate-900">
                      <thead>
                        <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900">
                          <th className="border border-slate-900 p-2 text-center w-14">মেধাক্রম</th>
                          <th className="border border-slate-900 p-2 text-center whitespace-nowrap">Permanent ID</th>
                          <th className="border border-slate-900 p-2">শিক্ষার্থীর নাম</th>
                          <th className="border border-slate-900 p-2 text-center whitespace-nowrap">শ্রেণী</th>
                          <th className="border border-slate-900 p-2 text-center whitespace-nowrap font-bold">প্রাপ্ত মার্কস</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.records.map((record, rIdx) => {
                          const rank = rIdx + 1;
                          return (
                            <tr key={record.id} className="border-b border-slate-400">
                              <td className="border border-slate-900 p-2 text-center font-bold font-mono">
                                {rank === 1 ? '১ম' : rank === 2 ? '২য়' : rank === 3 ? '৩য়' : `${rank}ম`}
                              </td>
                              <td className="border border-slate-900 p-2 text-center font-mono font-bold whitespace-nowrap">
                                {record.permanentId}
                              </td>
                              <td className="border border-slate-900 p-2 font-bold text-slate-950">
                                {record.studentName}
                              </td>
                              <td className="border border-slate-900 p-2 text-center">
                                {record.className}
                              </td>
                              <td className="border border-slate-900 p-2 text-center font-mono font-black text-sm text-slate-950">
                                {record.marks}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Official Signatures */}
          <div className="mt-12 pt-4 border-t border-slate-400">
            <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-800 pt-8">
              <div>
                <div className="border-t border-dotted border-slate-700 pt-1.5 font-semibold">
                  ফলাফল মূল্যায়নকারীর স্বাক্ষর
                </div>
              </div>
              <div>
                <div className="border-t border-dotted border-slate-700 pt-1.5 font-semibold">
                  প্রধান পরীক্ষকের স্বাক্ষর
                </div>
              </div>
              <div>
                <div className="border-t border-dotted border-slate-700 pt-1.5 font-semibold">
                  পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
