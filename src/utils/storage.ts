import { ClassItem, EventItem, InstitutionConfig, School, Student } from '../types';

const STORAGE_KEYS = {
  INSTITUTION: 'exam_control_institution_v2',
  CLASSES: 'exam_control_classes_v2',
  SCHOOLS: 'exam_control_schools_v2',
  EVENTS: 'exam_control_events_v2',
  STUDENTS: 'exam_control_students_v2',
  THEME: 'exam_control_theme_v2',
};

export const DEFAULT_INSTITUTION: InstitutionConfig = {
  name: 'কেন্দ্রীয় পরীক্ষা নিয়ন্ত্রণ ও মেধা মূল্যায়ন সেল',
  tagline: 'সততা, স্বচ্ছতা ও শৃঙ্খলার সাথে মেধা বিকাশ',
};

export const DEFAULT_CLASSES: ClassItem[] = [
  { id: 'cls-3', name: 'তৃতীয় শ্রেণী (Class 3)', order: 3 },
  { id: 'cls-4', name: 'চতুর্থ শ্রেণী (Class 4)', order: 4 },
  { id: 'cls-5', name: 'পঞ্চম শ্রেণী (Class 5)', order: 5 },
  { id: 'cls-6', name: 'ষষ্ঠ শ্রেণী (Class 6)', order: 6 },
  { id: 'cls-7', name: 'সপ্তম শ্রেণী (Class 7)', order: 7 },
  { id: 'cls-8', name: 'অষ্টম শ্রেণী (Class 8)', order: 8 },
  { id: 'cls-9', name: 'নবম শ্রেণী (Class 9)', order: 9 },
  { id: 'cls-10', name: 'দশম শ্রেণী (Class 10)', order: 10 },
];

export const DEFAULT_SCHOOLS: School[] = [
  { id: 'sch-1', name: 'বরিশাল জিলা স্কুল', code: 'BZS' },
  { id: 'sch-2', name: 'বি. এ. এফ. শাহীন কলেজ', code: 'BAF' },
  { id: 'sch-3', name: 'ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ', code: 'CPS' },
  { id: 'sch-4', name: 'আদর্শ সরকারি উচ্চ বিদ্যালয়', code: 'AGH' },
  { id: 'sch-5', name: 'অগ্রগামী বালিকা উচ্চ বিদ্যালয়', code: 'ABH' },
];

export const DEFAULT_EVENTS: EventItem[] = [
  { id: 'evt-1', name: 'সাধারণ জ্ঞান ও মেধা পরীক্ষা' },
  { id: 'evt-2', name: 'গণিত অলিম্পিয়াড' },
  { id: 'evt-3', name: 'বিজ্ঞান প্রজেক্ট ও কুইজ' },
  { id: 'evt-4', name: 'বাংলা বানান ও রচনা' },
  { id: 'evt-5', name: 'ক্বেরাত ও আবৃত্তি প্রতিযোগিতা' },
];

// Helper to get from local storage with fallback
export function getStoredData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error loading key "${key}" from localStorage:`, err);
    return fallback;
  }
}

// Helper to save to local storage
export function setStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key "${key}" to localStorage:`, err);
  }
}

export function loadInstitution(): InstitutionConfig {
  return getStoredData<InstitutionConfig>(STORAGE_KEYS.INSTITUTION, DEFAULT_INSTITUTION);
}

export function saveInstitution(config: InstitutionConfig): void {
  setStoredData(STORAGE_KEYS.INSTITUTION, config);
}

export function loadClasses(): ClassItem[] {
  return getStoredData<ClassItem[]>(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
}

export function saveClasses(classes: ClassItem[]): void {
  setStoredData(STORAGE_KEYS.CLASSES, classes);
}

export function loadSchools(): School[] {
  return getStoredData<School[]>(STORAGE_KEYS.SCHOOLS, DEFAULT_SCHOOLS);
}

export function saveSchools(schools: School[]): void {
  setStoredData(STORAGE_KEYS.SCHOOLS, schools);
}

export function loadEvents(): EventItem[] {
  return getStoredData<EventItem[]>(STORAGE_KEYS.EVENTS, DEFAULT_EVENTS);
}

export function saveEvents(events: EventItem[]): void {
  setStoredData(STORAGE_KEYS.EVENTS, events);
}

export function loadStudents(): Student[] {
  return getStoredData<Student[]>(STORAGE_KEYS.STUDENTS, []);
}

export function saveStudents(students: Student[]): void {
  setStoredData(STORAGE_KEYS.STUDENTS, students);
}

export function clearAllStudents(): void {
  setStoredData(STORAGE_KEYS.STUDENTS, []);
}

export function resetAllToDefaults(): void {
  setStoredData(STORAGE_KEYS.INSTITUTION, DEFAULT_INSTITUTION);
  setStoredData(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
  setStoredData(STORAGE_KEYS.SCHOOLS, DEFAULT_SCHOOLS);
  setStoredData(STORAGE_KEYS.EVENTS, DEFAULT_EVENTS);
  setStoredData(STORAGE_KEYS.STUDENTS, []);
}
