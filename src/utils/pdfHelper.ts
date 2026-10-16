import { ClassItem, Student } from '../types';

export interface SchoolPdfGroup {
  schoolName: string;
  schoolCode: string;
  pages: {
    pageNumber: number;
    totalPagesForSchool: number;
    students: Student[];
  }[];
}

/**
 * Extracts a numeric rank for a class to ensure strict ascending order.
 * Example: Class 3 < Class 4 < Class 5.
 */
export function getClassRank(className: string, classItems: ClassItem[]): number {
  // Check if class exists in settings with order
  const found = classItems.find((c) => c.name.toLowerCase().trim() === className.toLowerCase().trim());
  if (found && typeof found.order === 'number') {
    return found.order;
  }

  // Check for Bengali numerals (১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯, ১০)
  const bnDigits: Record<string, number> = {
    '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5,
    '৬': 6, '৭': 7, '৮': 8, '৯': 9, '১০': 10,
  };

  for (const [bn, val] of Object.entries(bnDigits)) {
    if (className.includes(bn)) return val;
  }

  // Check English digits
  const match = className.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  // Match common Bengali class words
  const classWords: Record<string, number> = {
    'প্রথম': 1, 'দ্বিতীয়': 2, 'তৃতীয়': 3, 'চতুর্থ': 4, 'পঞ্চম': 5,
    'ষষ্ঠ': 6, 'সপ্তম': 7, 'অষ্টম': 8, 'নবম': 9, 'দশম': 10,
    'একাদশ': 11, 'দ্বাদশ': 12,
  };

  for (const [word, val] of Object.entries(classWords)) {
    if (className.includes(word)) return val;
  }

  // Fallback to alphabetical or index
  return 99;
}

/**
 * Prepares and structures student data for PDF printing / export:
 * 1. Groups students by School.
 * 2. In each School, sorts by Class in ascending order.
 * 3. Within the same Class, preserves the shuffled orderIndex from Serial generation.
 * 4. Chunks students into pages of maximum 20 students.
 * 5. Guarantees each School starts on a brand-new page.
 */
export function preparePdfData(students: Student[], classItems: ClassItem[]): SchoolPdfGroup[] {
  if (!students.length) return [];

  // Group by school name
  const schoolMap = new Map<string, Student[]>();
  students.forEach((student) => {
    const key = student.schoolName.trim() || 'অন্যান্য স্কুল';
    if (!schoolMap.has(key)) {
      schoolMap.set(key, []);
    }
    schoolMap.get(key)!.push(student);
  });

  const groups: SchoolPdfGroup[] = [];

  // Sort school names alphabetically
  const sortedSchoolNames = Array.from(schoolMap.keys()).sort((a, b) => a.localeCompare(b, 'bn'));

  for (const schoolName of sortedSchoolNames) {
    const schoolStudents = schoolMap.get(schoolName)!;
    const schoolCode = schoolStudents[0]?.schoolCode || '';

    // Sort students within school:
    // 1st criteria: Class in ascending order (smaller class first, e.g. Class 3 -> 4 -> 5)
    // 2nd criteria: OrderIndex (shuffled order from serial generation)
    const sorted = [...schoolStudents].sort((a, b) => {
      const rankA = getClassRank(a.className, classItems);
      const rankB = getClassRank(b.className, classItems);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Within same class, follow the shuffled sequence
      return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
    });

    // Chunk into maximum 20 students per page
    const pageSize = 20;
    const chunks: Student[][] = [];
    for (let i = 0; i < sorted.length; i += pageSize) {
      chunks.push(sorted.slice(i, i + pageSize));
    }

    const totalPagesForSchool = chunks.length;
    const pages = chunks.map((chunk, idx) => ({
      pageNumber: idx + 1,
      totalPagesForSchool,
      students: chunk,
    }));

    groups.push({
      schoolName,
      schoolCode,
      pages,
    });
  }

  return groups;
}
