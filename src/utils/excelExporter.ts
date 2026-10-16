import * as XLSX from 'xlsx';
import { Student } from '../types';

/**
 * Exports all student data into a single formatted .xlsx Excel file.
 * Columns:
 * 1. Serial (সিরিয়াল)
 * 2. Roll (রোল নম্বর)
 * 3. Student Name (শিক্ষার্থীর নাম)
 * 4. Father's Name (পিতার নাম)
 * 5. Mother's Name (মাতার নাম)
 * 6. Class (শ্রেণী)
 * 7. School (স্কুলের নাম)
 * 8. Event(s) (ইভেন্টসমূহ)
 */
export function exportStudentsToExcel(students: Student[], institutionName: string): boolean {
  if (!students || students.length === 0) {
    return false;
  }

  // Format student records for Excel
  const excelRows = students.map((s, index) => ({
    'ক্রমিক': index + 1,
    'সিরিয়াল (Serial)': s.serialNumber || 'বরাদ্দ হয়নি',
    'রোল নম্বর (Roll)': s.roll,
    'শিক্ষার্থীর নাম (Student Name)': s.name,
    'পিতার নাম (Father\'s Name)': s.fatherName || '-',
    'মাতার নাম (Mother\'s Name)': s.motherName || '-',
    'শ্রেণী (Class)': s.className,
    'স্কুলের নাম (School)': s.schoolName,
    'স্কুল কোড': s.schoolCode,
    'ইভেন্টসমূহ (Events)': (s.events && s.events.length > 0) ? s.events.join(', ') : 'কোনোটি নয়',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 8 },  // ক্রমিক
    { wch: 16 }, // সিরিয়াল
    { wch: 14 }, // রোল
    { wch: 28 }, // নাম
    { wch: 24 }, // পিতা
    { wch: 24 }, // মাতা
    { wch: 18 }, // শ্রেণী
    { wch: 32 }, // স্কুল
    { wch: 10 }, // কোড
    { wch: 36 }, // ইভেন্ট
  ];

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'শিক্ষার্থী তালিকা');

  // Generate filename with date
  const today = new Date().toISOString().split('T')[0];
  const safeInstName = institutionName.replace(/[^\w\u0980-\u09FF]/gi, '_').substring(0, 25);
  const fileName = `Student_List_${safeInstName}_${today}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, fileName);
  return true;
}
