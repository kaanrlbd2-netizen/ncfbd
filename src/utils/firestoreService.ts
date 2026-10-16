import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AppSettings, ClassItem, EventItem, InstitutionConfig, MarkRecord, School, Student } from '../types';
import {
  DEFAULT_CLASSES,
  DEFAULT_EVENTS,
  DEFAULT_INSTITUTION,
  DEFAULT_SCHOOLS,
} from './storage';

export const DEFAULT_ADMIN_PASSWORD = '1971';

export const DEFAULT_SETTINGS: AppSettings = {
  institution: DEFAULT_INSTITUTION,
  classes: DEFAULT_CLASSES,
  schools: DEFAULT_SCHOOLS,
  events: DEFAULT_EVENTS,
  adminPassword: DEFAULT_ADMIN_PASSWORD,
};

// ==================== SETTINGS (settings/general) ====================

export function subscribeSettings(
  onData: (settings: AppSettings) => void,
  onError?: (err: unknown) => void
): () => void {
  const settingsDocRef = doc(db, 'settings', 'general');

  return onSnapshot(
    settingsDocRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<AppSettings>;
        onData({
          institution: data.institution || DEFAULT_INSTITUTION,
          classes: data.classes || DEFAULT_CLASSES,
          schools: data.schools || DEFAULT_SCHOOLS,
          events: data.events || DEFAULT_EVENTS,
          adminPassword: data.adminPassword || DEFAULT_ADMIN_PASSWORD,
        });
      } else {
        // Bootstrap initial settings in Firestore
        try {
          await setDoc(settingsDocRef, DEFAULT_SETTINGS);
          onData(DEFAULT_SETTINGS);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'settings/general');
        }
      }
    },
    (err) => {
      console.error('Settings subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'settings/general');
    }
  );
}

export async function saveSettingsToFirestore(updates: Partial<AppSettings>): Promise<void> {
  const settingsDocRef = doc(db, 'settings', 'general');
  try {
    await setDoc(settingsDocRef, updates, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/general');
  }
}

// ==================== STUDENTS (/students/{studentId}) ====================

export function subscribeStudents(
  onData: (students: Student[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const studentsColRef = collection(db, 'students');

  return onSnapshot(
    studentsColRef,
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Student;
        list.push({ ...data, id: docSnap.id });
      });
      // Sort by orderIndex or createdAt
      list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      onData(list);
    },
    (err) => {
      console.error('Students subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'students');
    }
  );
}

export async function saveStudentToFirestore(student: Student): Promise<void> {
  const studentDocRef = doc(db, 'students', student.id);
  try {
    await setDoc(studentDocRef, student);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `students/${student.id}`);
  }
}

export async function updateStudentInFirestore(id: string, updates: Partial<Student>): Promise<void> {
  const studentDocRef = doc(db, 'students', id);
  try {
    await updateDoc(studentDocRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `students/${id}`);
  }
}

export async function deleteStudentFromFirestore(id: string): Promise<void> {
  const studentDocRef = doc(db, 'students', id);
  try {
    await deleteDoc(studentDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
  }
}

export async function batchSaveStudentsToFirestore(students: Student[]): Promise<void> {
  if (students.length === 0) return;

  const chunkSize = 400;
  for (let i = 0; i < students.length; i += chunkSize) {
    const chunk = students.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((st) => {
      const ref = doc(db, 'students', st.id);
      batch.set(ref, st, { merge: true });
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  }
}

export async function clearAllStudentsFromFirestore(): Promise<void> {
  try {
    const studentsColRef = collection(db, 'students');
    const snapshot = await getDocs(studentsColRef);
    if (snapshot.empty) return;

    const docs = snapshot.docs;
    const chunkSize = 400;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'students');
  }
}

// ==================== MARKS (/marks/{markId}) ====================

export function subscribeMarks(
  onData: (marks: MarkRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const marksColRef = collection(db, 'marks');

  return onSnapshot(
    marksColRef,
    (snapshot) => {
      const list: MarkRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MarkRecord;
        list.push({ ...data, id: docSnap.id });
      });
      onData(list);
    },
    (err) => {
      console.error('Marks subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'marks');
    }
  );
}

export async function saveMarkToFirestore(mark: MarkRecord): Promise<void> {
  const markDocRef = doc(db, 'marks', mark.id);
  try {
    await setDoc(markDocRef, mark);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `marks/${mark.id}`);
  }
}

export async function deleteMarkFromFirestore(markId: string): Promise<void> {
  const markDocRef = doc(db, 'marks', markId);
  try {
    await deleteDoc(markDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `marks/${markId}`);
  }
}

export async function deleteEventMarksFromFirestore(markIds: string[]): Promise<void> {
  if (markIds.length === 0) return;
  const chunkSize = 400;
  for (let i = 0; i < markIds.length; i += chunkSize) {
    const chunk = markIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((id) => {
      const ref = doc(db, 'marks', id);
      batch.delete(ref);
    });
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'marks');
    }
  }
}

