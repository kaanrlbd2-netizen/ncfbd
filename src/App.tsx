import React, { useState, useEffect } from 'react';
import { ActiveTab, AppSettings, ClassItem, EventItem, InstitutionConfig, MarkRecord, School, Student } from './types';
import {
  DEFAULT_SETTINGS,
  subscribeSettings,
  subscribeStudents,
  subscribeMarks,
  saveSettingsToFirestore,
  saveStudentToFirestore,
  updateStudentInFirestore,
  deleteStudentFromFirestore,
  batchSaveStudentsToFirestore,
  clearAllStudentsFromFirestore,
  saveMarkToFirestore,
  deleteMarkFromFirestore,
  deleteEventMarksFromFirestore,
} from './utils/firestoreService';
import { generatePermanentId } from './utils/permanentId';
import { generateSerialsAndShuffle } from './utils/serialGenerator';
import { exportStudentsToExcel } from './utils/excelExporter';
import { SAMPLE_STUDENTS } from './utils/sampleData';
import { testConnection } from './firebase';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { StudentForm } from './components/StudentForm';
import { StudentTable } from './components/StudentTable';
import { Settings } from './components/SettingsModal';
import { ResultManager } from './components/ResultManager';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { MeritPdfModal } from './components/MeritPdfModal';
import { PinModal } from './components/PinModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_mode') === 'dark';
  });

  // Admin Login Authentication State (Mandatory Requirement 1)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('exam_admin_auth') === 'true';
  });

  // App Real-time State (Synced across all admins via Firebase Firestore)
  const [institution, setInstitution] = useState<InstitutionConfig>(DEFAULT_SETTINGS.institution);
  const [classes, setClasses] = useState<ClassItem[]>(DEFAULT_SETTINGS.classes);
  const [schools, setSchools] = useState<School[]>(DEFAULT_SETTINGS.schools);
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_SETTINGS.events);
  const [adminPassword, setAdminPassword] = useState<string>(DEFAULT_SETTINGS.adminPassword);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');

  // Modals & UI States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [meritPdfModal, setMeritPdfModal] = useState<{
    isOpen: boolean;
    type: 'overall' | 'schoolwise';
    eventName: string;
    marks: MarkRecord[];
  } | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Deletion Confirmation States
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isResetDefaultModalOpen, setIsResetDefaultModalOpen] = useState(false);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync theme with HTML class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Verify Firestore connection and attach Real-time Listeners
  useEffect(() => {
    testConnection();

    // 1. Subscribe to Settings Document
    const unsubSettings = subscribeSettings(
      (newSettings) => {
        setInstitution(newSettings.institution);
        setClasses(newSettings.classes);
        setSchools(newSettings.schools);
        setEvents(newSettings.events);
        setAdminPassword(newSettings.adminPassword || '1971');
      },
      (err) => console.error('Settings sync error:', err)
    );

    // 2. Subscribe to Students Collection (Real-time sync across devices)
    const unsubStudents = subscribeStudents(
      (realtimeStudents) => {
        setStudents(realtimeStudents);
      },
      (err) => console.error('Students sync error:', err)
    );

    // 3. Subscribe to Marks Collection (Real-time sync across devices)
    const unsubMarks = subscribeMarks(
      (realtimeMarks) => {
        setMarks(realtimeMarks);
      },
      (err) => console.error('Marks sync error:', err)
    );

    return () => {
      unsubSettings();
      unsubStudents();
      unsubMarks();
    };
  }, []);

  // Admin Login handler
  const handleLoginSuccess = () => {
    localStorage.setItem('exam_admin_auth', 'true');
    setIsLoggedIn(true);
    showToast('অ্যাডমিন হিসেবে সফলভাবে লগইন করা হয়েছে!', 'success');
  };

  // Admin Logout handler
  const handleLogout = () => {
    localStorage.removeItem('exam_admin_auth');
    setIsLoggedIn(false);
    showToast('লগআউট সফল হয়েছে।', 'info');
  };

  // Add new student (Saves directly to Firebase Firestore)
  const handleSaveStudent = async (
    studentData: Omit<Student, 'id' | 'createdAt' | 'orderIndex' | 'serialNumber'>
  ) => {
    // Generate permanent ID if not provided: AA, AB, AC...
    const permId = studentData.permanentId || generatePermanentId(students.length);

    const newStudent: Student = {
      ...studentData,
      permanentId: permId,
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      orderIndex: students.length + 1,
    };

    try {
      await saveStudentToFirestore(newStudent);
      showToast(`শিক্ষার্থী "${newStudent.name}" [${permId}] ক্লাউডে সফলভাবে যুক্ত হয়েছে!`, 'success');
    } catch (err) {
      console.error('Error saving student:', err);
      showToast('শিক্ষার্থী সংরক্ষণে সমস্যা হয়েছে!', 'error');
    }
  };

  // Update existing student in Firestore
  const handleUpdateStudent = async (id: string, updatedData: Partial<Student>) => {
    try {
      await updateStudentInFirestore(id, updatedData);
      setEditingStudent(null);
      showToast('শিক্ষার্থীর তথ্য ক্লাউডে সফলভাবে হালনাগাদ করা হয়েছে!', 'success');
    } catch (err) {
      console.error('Error updating student:', err);
      showToast('শিক্ষার্থীর তথ্য হালনাগাদে সমস্যা হয়েছে!', 'error');
    }
  };

  // Delete student from Firestore
  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudentFromFirestore(studentToDelete.id);
      showToast(`শিক্ষার্থী "${studentToDelete.name}" মুছে ফেলা হয়েছে।`, 'info');
    } catch (err) {
      console.error('Error deleting student:', err);
      showToast('শিক্ষার্থী মুছতে সমস্যা হয়েছে!', 'error');
    } finally {
      setStudentToDelete(null);
    }
  };

  // Clear all students in Firestore
  const handleConfirmClearAll = async () => {
    try {
      await clearAllStudentsFromFirestore();
      setIsClearAllModalOpen(false);
      showToast('সকল শিক্ষার্থীর তথ্য ক্লাউড থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।', 'info');
    } catch (err) {
      console.error('Error clearing all students:', err);
      showToast('সকল শিক্ষার্থী মুছতে সমস্যা হয়েছে!', 'error');
    }
  };

  // Reset entire system to defaults in Firestore
  const handleConfirmResetDefaults = async () => {
    try {
      await saveSettingsToFirestore(DEFAULT_SETTINGS);
      await clearAllStudentsFromFirestore();
      setIsResetDefaultModalOpen(false);
      showToast('সিস্টেমের সকল ডেটা সফলভাবে ডিফল্ট অবস্থায় ফিরিয়ে আনা হয়েছে।', 'success');
    } catch (err) {
      console.error('Error resetting defaults:', err);
      showToast('রিসেট করতে সমস্যা হয়েছে!', 'error');
    }
  };

  // Serial Generation (Triggered after correct PIN) -> Saves to Firestore
  const handleGenerateSerials = async () => {
    if (students.length === 0) {
      showToast('সিরিয়াল তৈরির জন্য কোনো শিক্ষার্থী পাওয়া যায়নি!', 'error');
      setIsPinModalOpen(false);
      return;
    }

    const updatedWithSerials = generateSerialsAndShuffle(students);
    try {
      await batchSaveStudentsToFirestore(updatedWithSerials);
      setIsPinModalOpen(false);
      showToast(
        `সফল হয়েছে! মোট ${students.length} জন শিক্ষার্থীর নতুন র্যান্ডম সিরিয়াল ক্লাউডে সংরক্ষিত হয়েছে।`,
        'success'
      );
    } catch (err) {
      console.error('Error batch updating serials:', err);
      showToast('সিরিয়াল ক্লাউডে সেভ করতে সমস্যা হয়েছে!', 'error');
    }
  };

  // Excel Download
  const handleExportExcel = () => {
    if (students.length === 0) {
      showToast('ডাউনলোড করার জন্য কোনো শিক্ষার্থী নিবন্ধিত নেই!', 'error');
      return;
    }
    const success = exportStudentsToExcel(students, institution.name);
    if (success) {
      showToast('এক্সেল (.xlsx) ফাইল সফলভাবে ডাউনলোড হয়েছে!', 'success');
    } else {
      showToast('এক্সেল ফাইল তৈরিতে সমস্যা হয়েছে।', 'error');
    }
  };

  // Load sample data (25 realistic students with permanent IDs) -> Saves to Firestore
  const handleLoadSampleData = async () => {
    const newDemoStudents: Student[] = SAMPLE_STUDENTS.map((item, idx) => ({
      ...item,
      id: `demo-${Date.now()}-${idx}`,
      permanentId: generatePermanentId(students.length + idx),
      orderIndex: idx + 1,
      createdAt: Date.now() - idx * 1000,
    }));

    try {
      await batchSaveStudentsToFirestore(newDemoStudents);
      showToast(
        `নমুনা ডেটা হিসেবে ${newDemoStudents.length} জন শিক্ষার্থী ক্লাউডে যুক্ত হয়েছে!`,
        'success'
      );
    } catch (err) {
      console.error('Error batch saving sample students:', err);
      showToast('নমুনা ডেটা সংরক্ষণে সমস্যা হয়েছে!', 'error');
    }
  };

  // Save all settings explicitly to Firebase Firestore (Only triggered when "সেভ করুন" is clicked)
  const handleSaveAllSettings = async (newSettings: AppSettings) => {
    try {
      await saveSettingsToFirestore(newSettings);
      setInstitution(newSettings.institution);
      setClasses(newSettings.classes);
      setSchools(newSettings.schools);
      setEvents(newSettings.events);
      setAdminPassword(newSettings.adminPassword || '1971');
    } catch (err) {
      console.error('Error saving settings to Firestore:', err);
      throw err;
    }
  };

  // Save Mark to Firestore (Requirement 2)
  const handleSaveMark = async (markRecord: MarkRecord) => {
    await saveMarkToFirestore(markRecord);
  };

  // Delete Mark from Firestore (Individual result delete - no PIN)
  const handleDeleteMark = async (markId: string) => {
    await deleteMarkFromFirestore(markId);
    showToast('শিক্ষার্থীর মার্কস মুছে ফেলা হয়েছে।', 'info');
  };

  // Delete All Marks for an Event (PIN-protected batch delete)
  const handleDeleteAllMarks = async (eventId: string, eventName: string, markIds: string[]) => {
    try {
      await deleteEventMarksFromFirestore(markIds);
      showToast(`"${eventName}" ইভেন্টের সকল মার্কস (${markIds.length} জন) সফলভাবে মুছে ফেলা হয়েছে।`, 'info');
    } catch (err) {
      console.error('Error deleting all marks for event:', err);
      showToast('সকল মার্কস মুছতে সমস্যা হয়েছে!', 'error');
    }
  };

  // If not logged in, enforce Admin Login Screen (Mandatory Requirement 1)
  if (!isLoggedIn) {
    return (
      <>
        <Toast toasts={toasts} onRemove={removeToast} />
        <LoginScreen
          institution={institution}
          correctPassword={adminPassword || '1971'}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Toast Notification Stack */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Top Header & Branding */}
      <Header
        institution={institution}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        studentCount={students.length}
        schoolCount={schools.length}
        onLogout={handleLogout}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TAB 1: Student Entry and Live Table */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Student Entry Form */}
            <StudentForm
              classes={classes}
              schools={schools}
              events={events}
              editingStudent={editingStudent}
              onSaveStudent={handleSaveStudent}
              onUpdateStudent={handleUpdateStudent}
              onCancelEdit={() => setEditingStudent(null)}
            />

            {/* Live Student Table */}
            <StudentTable
              students={students}
              schools={schools}
              classes={classes}
              events={events}
              onEditStudent={(s) => {
                setEditingStudent(s);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onRequestDeleteStudent={(s) => setStudentToDelete(s)}
              onRequestGenerateSerials={() => setIsPinModalOpen(true)}
              onOpenPdf={() => setIsPdfModalOpen(true)}
              onExportExcel={handleExportExcel}
              onLoadSampleData={handleLoadSampleData}
              onRequestClearAll={() => setIsClearAllModalOpen(true)}
            />
          </div>
        )}

        {/* TAB 2: Result & Merit List Generator (New Requirement 2) */}
        {activeTab === 'results' && (
          <div className="animate-in fade-in duration-200">
            <ResultManager
              students={students}
              events={events}
              marks={marks}
              institution={institution}
              onSaveMark={handleSaveMark}
              onDeleteMark={handleDeleteMark}
              onDeleteAllMarks={handleDeleteAllMarks}
              onOpenMeritPdf={(type, eventName, eventMarks) =>
                setMeritPdfModal({ isOpen: true, type, eventName, marks: eventMarks })
              }
              onShowToast={showToast}
            />
          </div>
        )}

        {/* TAB 3: Settings Page */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-200">
            <Settings
              institution={institution}
              classes={classes}
              schools={schools}
              events={events}
              adminPassword={adminPassword}
              onSaveAllSettings={handleSaveAllSettings}
              onResetDefaults={() => setIsResetDefaultModalOpen(true)}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* TAB 4: PDF View */}
        {activeTab === 'pdf' && (
          <div className="animate-in fade-in duration-200">
            <PdfPreviewModal
              students={students}
              classes={classes}
              institution={institution}
              onClose={() => setActiveTab('students')}
              onShowToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Pin Protection Modal for Serial Generation */}
      <PinModal
        isOpen={isPinModalOpen}
        totalStudents={students.length}
        onSuccess={handleGenerateSerials}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* Single PDF Generation / Print Modal */}
      {isPdfModalOpen && (
        <PdfPreviewModal
          students={students}
          classes={classes}
          institution={institution}
          onClose={() => setIsPdfModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Merit List Dedicated PDF Modal */}
      {meritPdfModal?.isOpen && (
        <MeritPdfModal
          type={meritPdfModal.type}
          eventName={meritPdfModal.eventName}
          marks={meritPdfModal.marks}
          institution={institution}
          onClose={() => setMeritPdfModal(null)}
          onShowToast={showToast}
        />
      )}

      {/* Individual Student Delete Confirmation */}
      <ConfirmModal
        isOpen={studentToDelete !== null}
        title="শিক্ষার্থী তথ্য অপসারণ"
        message={`আপনি কি নিশ্চিতভাবে "${studentToDelete?.name}" (রোল: ${studentToDelete?.roll}) কে তালিকা থেকে মুছে ফেলতে চান? এটি ক্লাউড ডেটাবেস থেকেও মুছে যাবে।`}
        confirmLabel="মুছে ফেলুন"
        cancelLabel="বাতিল"
        isDanger={true}
        onConfirm={handleConfirmDeleteStudent}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* Clear All Students Confirmation */}
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        title="সকল শিক্ষার্থী মুছে ফেলা"
        message={`সাবধান! আপনি কি বর্তমানের নিবন্ধিত সকল (${students.length} জন) শিক্ষার্থীর তথ্য স্থায়ীভাবে ক্লাউড থেকে মুছে ফেলতে চান?`}
        confirmLabel="সব মুছে ফেলুন"
        cancelLabel="বাতিল"
        isDanger={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearAllModalOpen(false)}
      />

      {/* Reset Defaults Confirmation */}
      <ConfirmModal
        isOpen={isResetDefaultModalOpen}
        title="ডিফল্ট সেটিংস রিসেট"
        message="আপনি কি সমস্ত স্কুল, শ্রেণী, ইভেন্ট ও প্রতিষ্ঠানের নাম প্রাথমিক অবস্থায় ফিরিয়ে আনতে চান? সমস্ত শিক্ষার্থী তালিকাও খালি হবে।"
        confirmLabel="রিসেট নিশ্চিত করুন"
        cancelLabel="বাতিল"
        isDanger={false}
        onConfirm={handleConfirmResetDefaults}
        onCancel={() => setIsResetDefaultModalOpen(false)}
      />

      {/* Permanent Footer (Requirement 2) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden bg-white/50 dark:bg-slate-900/50">
        <p className="font-medium text-slate-700 dark:text-slate-300">
          {institution.name} · পরীক্ষা নিয়ন্ত্রণ ও ফলাফল প্রস্তুতকরণ সফটওয়্যার সিস্টেম
        </p>
        <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          Developed by, "খান আবু আব্দুল্লাহ"
        </p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          Firebase Firestore ক্লাউড ডেটাবেসে রিয়েল-টাইমে সংরক্ষিত
        </p>
      </footer>
    </div>
  );
}
