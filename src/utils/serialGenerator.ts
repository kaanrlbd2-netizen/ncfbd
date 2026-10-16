import { Student } from '../types';

// Internal secret PIN codes - NEVER expose to UI
export const ADMIN_PINS = ['1971', '1757'];

export function isValidAdminPin(pin: string): boolean {
  return ADMIN_PINS.includes(pin.trim());
}

/**
 * Fisher-Yates shuffle algorithm to randomly shuffle array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates random, non-sequential serial numbers for all students and shuffles their order.
 * - Format: SchoolCode + Random Number (examples: BB66, BB57, BB88, BB12, BB05, BB43, BB19)
 * - Number portion is completely random and never sequential
 * - Each school uses its own Code
 * - Replaces previous serials completely on every generation
 * - Shuffles student ordering
 */
export function generateSerialsAndShuffle(students: Student[]): Student[] {
  if (students.length === 0) return [];

  // 1. Shuffle students to achieve a completely new sequence
  const shuffledStudents = shuffleArray(students);

  // 2. Count students per school code
  const schoolCounts: Record<string, number> = {};
  shuffledStudents.forEach((s) => {
    const code = (s.schoolCode || 'EX').trim().toUpperCase();
    schoolCounts[code] = (schoolCounts[code] || 0) + 1;
  });

  // 3. For each school, create a dedicated shuffled pool of unique random numbers
  const schoolPools: Record<string, string[]> = {};
  Object.entries(schoolCounts).forEach(([code, count]) => {
    const maxNum = count > 85 ? Math.max(999, count * 3) : 99;
    const candidates: number[] = [];
    for (let i = 1; i <= maxNum; i++) {
      candidates.push(i);
    }

    const shuffledCandidates = shuffleArray(candidates);
    schoolPools[code] = shuffledCandidates.map((n) => {
      // 2-digit format e.g. "05", "12", "19", "43", "57", "66", "88"
      return maxNum <= 99 ? String(n).padStart(2, '0') : String(n).padStart(3, '0');
    });
  });

  // 4. Assign random serial to each student
  const schoolPointers: Record<string, number> = {};

  const updatedStudents: Student[] = shuffledStudents.map((student, index) => {
    const code = (student.schoolCode || 'EX').trim().toUpperCase();
    const ptr = schoolPointers[code] || 0;
    const randomNumStr =
      schoolPools[code]?.[ptr] || String(Math.floor(Math.random() * 90) + 10);
    schoolPointers[code] = ptr + 1;

    const serialNum = `${code}${randomNumStr}`;

    return {
      ...student,
      serialNumber: serialNum,
      orderIndex: index + 1,
    };
  });

  return updatedStudents;
}
