export interface School {
  id: string;
  name: string;
  code: string; // Mandatory, e.g., BB, CC, XYZ
}

export interface ClassItem {
  id: string;
  name: string;
  order: number; // for natural ascending sorting (e.g. 1 for class 3, 2 for class 4)
}

export interface EventItem {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  roll: string;
  permanentId?: string; // Permanent ID (AA, AB, AAA...)
  classId: string;
  className: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  events: string[]; // up to 5 event names
  serialNumber?: string; // generated, e.g. BB88, CC101
  orderIndex: number; // shuffled sequence order
  createdAt: number;
}

export interface InstitutionConfig {
  name: string;
  tagline: string;
  logo?: string; // base64 data URL
}

export interface MarkRecord {
  id: string; // `${eventId}_${studentId}`
  eventId: string;
  eventName: string;
  studentId: string;
  studentName: string;
  permanentId: string;
  roll: string;
  schoolName: string;
  schoolCode: string;
  className: string;
  marks: number;
  updatedAt: number;
}

export interface AppSettings {
  institution: InstitutionConfig;
  classes: ClassItem[];
  schools: School[];
  events: EventItem[];
  adminPassword: string; // Default: '1971'
}

export type ActiveTab = 'students' | 'results' | 'pdf' | 'settings';
