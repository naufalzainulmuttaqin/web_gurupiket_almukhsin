/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { TeacherDatabase } from './components/TeacherDatabase';
import { PiketOfficerDatabase } from './components/PiketOfficerDatabase';
import { RoleSwitchModal } from './components/RoleSwitchModal';
import { ScheduleGrid } from './components/ScheduleGrid';
import { ScheduleEditor } from './components/ScheduleEditor';
import { PhysicalAttendanceSheet } from './components/PhysicalAttendanceSheet';
import { TURecapPayroll } from './components/TURecapPayroll';
import { AttendanceModal } from './components/AttendanceModal';
import { AIReportGenerator } from './components/AIReportGenerator';
import { StatsDashboard } from './components/StatsDashboard';
import { LoginView } from './components/LoginView';
import { AdminCredentialsModal } from './components/AdminCredentialsModal';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';
import { 
  loadTeachers, 
  saveTeachers, 
  loadClasses, 
  loadPeriods, 
  savePeriods,
  loadSchedule, 
  saveSchedule, 
  loadAttendanceRecords, 
  saveAttendanceRecords, 
  loadDailyMeta, 
  saveDailyMeta, 
  loadReportHistory, 
  saveReportHistory, 
  loadPiketOfficers,
  savePiketOfficers,
  loadUserRole,
  saveUserRole,
  loadActiveOfficerId,
  saveActiveOfficerId,
  loadActiveTeacherId,
  saveActiveTeacherId,
  loadCredentials,
  saveCredentials,
  loadUserRoleSession,
  saveUserRoleSession,
  clearUserSession,
  UserRoleSession,
  getTodayDateString, 
  getDayOfWeekFromDate, 
  loadSchoolSettings,
  saveSchoolSettings
} from './utils/storage';
import { buildRAGContext } from './utils/ragBuilder';
import { AttendanceRecord, AttendanceStatus, ClassRoom, DayOfWeek, Period, PiketOfficer, PiketReportRecord, ScheduleSlot, Teacher, UserRole, AppCredentials, SchoolSettings } from './types/piket';
import { DAYS_LIST } from './utils/defaultData';
import { Check, ShieldAlert, Sparkles, School } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('piket');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const selectedDay: DayOfWeek = getDayOfWeekFromDate(selectedDate);

  // Authentication & Session States
  const [session, setSession] = useState<UserRoleSession>(() => loadUserRoleSession());
  const [credentials, setCredentials] = useState<AppCredentials>(() => loadCredentials());
  const [isAdminCredentialsModalOpen, setIsAdminCredentialsModalOpen] = useState(false);

  // Role & Access Control States
  const [userRole, setUserRole] = useState<UserRole>(() => loadUserRoleSession().role || 'GURU_BIASA');
  const [activeOfficerId, setActiveOfficerId] = useState<string>(() => loadActiveOfficerId());
  const [activeTeacherId, setActiveTeacherId] = useState<string>(() => loadActiveTeacherId());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Core Data States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [piketOfficers, setPiketOfficers] = useState<PiketOfficer[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [dailyMeta, setDailyMeta] = useState(loadDailyMeta(selectedDate));
  const [reportHistory, setReportHistory] = useState<PiketReportRecord[]>([]);

  // State Waktu Jam Pelajaran (JP) per Hari
  const [dayPeriodsMap, setDayPeriodsMap] = useState<Partial<Record<DayOfWeek, Period[]>>>(() => {
    try {
      const saved = localStorage.getItem('mts_piket_day_periods_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Waktu JP aktif untuk hari yang sedang dipilih
  const currentDayPeriods = dayPeriodsMap[selectedDay] || periods;

  // Attendance Modal state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [modalClass, setModalClass] = useState<ClassRoom | null>(null);
  const [modalPeriod, setModalPeriod] = useState<Period | null>(null);
  const [modalAssignedTeacher, setModalAssignedTeacher] = useState<Teacher | null>(null);
  const [modalSubject, setModalSubject] = useState<string>('');
  const [modalExistingRecord, setModalExistingRecord] = useState<AttendanceRecord | undefined>(undefined);

  // School Identity Settings State
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => loadSchoolSettings());
  const [isSchoolSettingsModalOpen, setIsSchoolSettingsModalOpen] = useState(false);

  // Reset Confirmation Modal State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initial load
  useEffect(() => {
    setTeachers(loadTeachers());
    setPiketOfficers(loadPiketOfficers());
    setClasses(loadClasses());
    setPeriods(loadPeriods());
    setScheduleSlots(loadSchedule());
    setAttendanceRecords(loadAttendanceRecords());
    setReportHistory(loadReportHistory());
    setUserRole(loadUserRole());
    setActiveOfficerId(loadActiveOfficerId());
    setActiveTeacherId(loadActiveTeacherId());
    setSchoolSettings(loadSchoolSettings());
  }, []);

  // Enforce role-based tab restrictions strictly
  useEffect(() => {
    if (userRole === 'GURU_BIASA') {
      if (activeTab !== 'schedule' && activeTab !== 'teachers') {
        setActiveTab('schedule');
      }
    } else if (userRole === 'GURU_PIKET') {
      if (activeTab === 'tu-recap' || activeTab === 'stats') {
        setActiveTab('piket');
      }
    }
  }, [userRole, activeTab]);

  // Update daily meta when date changes
  useEffect(() => {
    const meta = loadDailyMeta(selectedDate);
    if (meta.piketOfficers.length === 0 && piketOfficers.length > 0) {
      const todayPiket = piketOfficers
        .filter(o => o.assignedDays.includes(selectedDay))
        .map(o => o.name);
      if (todayPiket.length > 0) {
        meta.piketOfficers = todayPiket;
      }
    }
    setDailyMeta(meta);
  }, [selectedDate, selectedDay, piketOfficers]);

  // Handler: Switch Role
  const handleRoleSwitch = (newRole: UserRole, officerId?: string, teacherId?: string) => {
    setUserRole(newRole);
    saveUserRole(newRole);
    if (officerId) {
      setActiveOfficerId(officerId);
      saveActiveOfficerId(officerId);
    }
    if (teacherId) {
      setActiveTeacherId(teacherId);
      saveActiveTeacherId(teacherId);
    }
    const off = piketOfficers.find(o => o.id === officerId);
    const tch = teachers.find(t => t.id === teacherId);
    const displayName = newRole === 'ADMIN' 
      ? 'Administrator' 
      : newRole === 'GURU_PIKET' 
      ? (off?.name || 'Guru Piket') 
      : (tch?.name ? `[${tch.code}] ${tch.name}` : 'Guru Mapel');

    const updatedSession: UserRoleSession = {
      isLoggedIn: true,
      role: newRole,
      activeOfficerId: officerId,
      activeTeacherId: teacherId,
      userName: displayName,
    };
    setSession(updatedSession);
    saveUserRoleSession(updatedSession);

    if (newRole === 'GURU_PIKET') {
      showToast(`Mode Guru Piket aktif: ${off?.name || 'Petugas Piket'}. Akses penuh presensi & laporan AI.`);
    } else if (newRole === 'ADMIN') {
      showToast('Mode Administrator Utama aktif.');
    } else {
      showToast(`Mode Guru Biasa aktif: ${tch?.name || 'Guru Pengampu'}. Hanya melihat jadwal.`);
    }
  };

  // Handler: Login
  const handleLogin = (role: UserRole, teacherId?: string, officerId?: string, displayName?: string) => {
    const newSession: UserRoleSession = {
      isLoggedIn: true,
      role,
      activeOfficerId: officerId,
      activeTeacherId: teacherId,
      userName: displayName,
    };
    setSession(newSession);
    saveUserRoleSession(newSession);
    setUserRole(role);
    if (officerId) {
      setActiveOfficerId(officerId);
      saveActiveOfficerId(officerId);
    }
    if (teacherId) {
      setActiveTeacherId(teacherId);
      saveActiveTeacherId(teacherId);
    }
    showToast(`Selamat datang! Anda masuk sebagai ${displayName || (role === 'ADMIN' ? 'Admin' : role === 'GURU_PIKET' ? 'Guru Piket' : 'Guru Mapel')}.`);
  };

  // Handler: Logout
  const handleLogout = () => {
    clearUserSession();
    setSession({
      isLoggedIn: false,
      role: 'GURU_BIASA',
    });
    showToast('Anda telah berhasil keluar (Logout).');
  };

  // Handler: Save Credentials (Admin only)
  const handleSaveCredentials = (newCreds: AppCredentials) => {
    setCredentials(newCreds);
    saveCredentials(newCreds);
    showToast('ID dan Password Guru Piket & Admin berhasil disimpan!');
  };

  // Handler: Save Teacher (Guru Mapel)
  const handleSaveTeacher = (teacher: Teacher) => {
    const existingIndex = teachers.findIndex(t => t.id === teacher.id);
    let updated: Teacher[];
    if (existingIndex >= 0) {
      updated = [...teachers];
      updated[existingIndex] = teacher;
      showToast(`Data guru "${teacher.name}" berhasil diperbarui.`);
    } else {
      updated = [teacher, ...teachers];
      showToast(`Guru baru "${teacher.name}" berhasil ditambahkan ke Database Guru.`);
    }
    setTeachers(updated);
    saveTeachers(updated);
  };

  // Handler: Delete Teacher (Guru Mapel)
  const handleDeleteTeacher = (id: string) => {
    const teacherToDelete = teachers.find(t => t.id === id);
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    saveTeachers(updated);
    showToast(`Guru "${teacherToDelete?.name || ''}" berhasil dihapus dari master.`);
  };

  // Handler: Save Piket Officer (Database Guru Piket)
  const handleSavePiketOfficer = (officer: PiketOfficer) => {
    const existingIndex = piketOfficers.findIndex(o => o.id === officer.id);
    let updated: PiketOfficer[];
    if (existingIndex >= 0) {
      updated = [...piketOfficers];
      updated[existingIndex] = officer;
      showToast(`Petugas Guru Piket "${officer.name}" berhasil diperbarui.`);
    } else {
      updated = [officer, ...piketOfficers];
      showToast(`Guru Piket baru "${officer.name}" berhasil ditambahkan.`);
    }
    setPiketOfficers(updated);
    savePiketOfficers(updated);
  };

  // Handler: Delete Piket Officer
  const handleDeletePiketOfficer = (id: string) => {
    const officerToDelete = piketOfficers.find(o => o.id === id);
    const updated = piketOfficers.filter(o => o.id !== id);
    setPiketOfficers(updated);
    savePiketOfficers(updated);
    showToast(`Petugas Piket "${officerToDelete?.name || ''}" berhasil dihapus.`);
  };

  // Handler: Open Attendance Modal
  const handleOpenAttendanceModal = (
    cls: ClassRoom,
    period: Period,
    assignedTeacher: Teacher | null,
    subject: string,
    existingRecord?: AttendanceRecord
  ) => {
    if (userRole === 'GURU_BIASA') {
      showToast('Presensi hanya dapat dicatat oleh Petugas Guru Piket.');
      return;
    }
    setModalClass(cls);
    setModalPeriod(period);
    setModalAssignedTeacher(assignedTeacher);
    setModalSubject(subject);
    setModalExistingRecord(existingRecord);
    setIsAttendanceModalOpen(true);
  };

  // Handler: Save Attendance
  const handleSaveAttendance = (recordPartial: Partial<AttendanceRecord>) => {
    if (!modalClass || !modalPeriod) return;
    const key = `${selectedDate}_${modalClass.id}_${modalPeriod.id}`;
    
    const fullRecord: AttendanceRecord = {
      date: selectedDate,
      day: selectedDay,
      classId: modalClass.id,
      periodId: modalPeriod.id,
      teacherId: modalAssignedTeacher?.id || '',
      teacherName: modalAssignedTeacher?.name || 'Guru Terjadwal',
      teacherCode: modalAssignedTeacher?.code,
      subject: modalSubject,
      status: recordPartial.status || 'HADIR',
      reason: recordPartial.reason,
      invalTeacherId: recordPartial.invalTeacherId,
      invalTeacherName: recordPartial.invalTeacherName,
      invalTeacherCode: recordPartial.invalTeacherCode,
      taskDescription: recordPartial.taskDescription,
      isTaskDelivered: recordPartial.isTaskDelivered,
      notes: recordPartial.notes,
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...attendanceRecords,
      [key]: fullRecord,
    };
    setAttendanceRecords(updated);
    saveAttendanceRecords(updated);
    setIsAttendanceModalOpen(false);

    if (fullRecord.status === 'HADIR') {
      showToast(`Kehadiran ${modalAssignedTeacher?.name || 'Guru'} di kelas ${modalClass.name} berhasil dicatat.`);
    } else {
      showToast(`Ketidakhadiran tercatat. Didampingi Guru Piket: ${fullRecord.invalTeacherName || 'Guru Piket'}.`);
    }
  };

  // Handler: Bulk Mark All Present
  const handleMarkAllPresent = () => {
    if (userRole === 'GURU_BIASA') {
      showToast('Aksi ini hanya dapat dilakukan oleh Petugas Guru Piket.');
      return;
    }
    const daySlots = scheduleSlots.filter(s => s.day === selectedDay && !s.isLocked && s.teacherId);
    const updated = { ...attendanceRecords };
    let newlyMarkedCount = 0;

    daySlots.forEach(slot => {
      const key = `${selectedDate}_${slot.classId}_${slot.periodId}`;
      if (!updated[key] || updated[key].status === 'BELUM_ABSEN') {
        const teacher = teachers.find(t => t.id === slot.teacherId);
        updated[key] = {
          date: selectedDate,
          day: selectedDay,
          classId: slot.classId,
          periodId: slot.periodId,
          teacherId: slot.teacherId || '',
          teacherName: teacher?.name || 'Guru Pengampu',
          teacherCode: teacher?.code,
          subject: slot.subject || teacher?.subject || 'Mapel',
          status: 'HADIR',
          updatedAt: new Date().toISOString(),
        };
        newlyMarkedCount++;
      }
    });

    setAttendanceRecords(updated);
    saveAttendanceRecords(updated);
    showToast(`Berhasil menandai ${newlyMarkedCount} slot KBM sebagai Hadir.`);
  };

  // Handler: Update Schedule Slot
  const handleUpdateScheduleSlot = (
    day: DayOfWeek,
    classId: string,
    periodId: string,
    teacherId?: string,
    subject?: string,
    isLocked?: boolean
  ) => {
    if (userRole === 'GURU_BIASA') {
      showToast('Pengaturan jadwal KBM terkunci untuk mode Guru Biasa.');
      return;
    }

    const existingIndex = scheduleSlots.findIndex(
      s => s.day === day && s.classId === classId && s.periodId === periodId
    );

    let updated: ScheduleSlot[];
    const newSlot: ScheduleSlot = {
      day,
      classId,
      periodId,
      teacherId,
      subject,
      isLocked: isLocked || false,
    };

    if (existingIndex >= 0) {
      updated = [...scheduleSlots];
      updated[existingIndex] = newSlot;
    } else {
      updated = [...scheduleSlots, newSlot];
    }

    setScheduleSlots(updated);
    saveSchedule(updated);
    showToast('Jadwal KBM berhasil disimpan.');
  };

  // Handler: Update Period Times (JP Times) baik per hari spesifik maupun global
  const handleUpdatePeriods = (newPeriods: Period[], targetDay?: DayOfWeek) => {
    if (targetDay) {
      const updatedMap = {
        ...dayPeriodsMap,
        [targetDay]: newPeriods,
      };
      setDayPeriodsMap(updatedMap);
      localStorage.setItem('mts_piket_day_periods_v1', JSON.stringify(updatedMap));
      showToast(`Waktu JP khusus hari ${targetDay} berhasil disimpan.`);
    } else {
      setPeriods(newPeriods);
      savePeriods(newPeriods);
      showToast('Waktu jam pelajaran (JP) seluruh hari berhasil diperbarui.');
    }
  };

  // Handler: Direct Attendance Status Change
  const handleDirectAttendanceStatusChange = (
    slot: ScheduleSlot,
    newStatus: AttendanceStatus,
    reason?: string
  ) => {
    if (userRole === 'GURU_BIASA') {
      showToast('Pencatatan presensi terkunci untuk mode Guru Biasa. Beralih ke Guru Piket.');
      return;
    }

    const key = `${selectedDate}_${slot.classId}_${slot.periodId}`;
    const teacher = teachers.find(t => t.id === slot.teacherId);
    const existing = attendanceRecords[key];

    const updatedRecord: AttendanceRecord = {
      date: selectedDate,
      day: selectedDay,
      classId: slot.classId,
      periodId: slot.periodId,
      teacherId: slot.teacherId || existing?.teacherId || '',
      teacherName: teacher?.name || existing?.teacherName || 'Guru Pengampu',
      teacherCode: teacher?.code || existing?.teacherCode,
      subject: slot.subject || teacher?.subject || existing?.subject || 'Mapel',
      status: newStatus,
      reason: reason !== undefined ? reason : existing?.reason,
      notes: existing?.notes,
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...attendanceRecords,
      [key]: updatedRecord,
    };
    setAttendanceRecords(updated);
    saveAttendanceRecords(updated);
  };

  // Handler: Bulk Mark All Slots for a Teacher
  const handleBulkMarkTeacher = (teacherId: string, status: AttendanceStatus) => {
    if (userRole === 'GURU_BIASA') {
      showToast('Pencatatan presensi terkunci untuk mode Guru Biasa.');
      return;
    }

    const daySlots = scheduleSlots.filter(s => s.day === selectedDay && s.teacherId === teacherId && !s.isLocked);
    const updated = { ...attendanceRecords };

    daySlots.forEach(slot => {
      const key = `${selectedDate}_${slot.classId}_${slot.periodId}`;
      const teacher = teachers.find(t => t.id === slot.teacherId);
      updated[key] = {
        date: selectedDate,
        day: selectedDay,
        classId: slot.classId,
        periodId: slot.periodId,
        teacherId: slot.teacherId || '',
        teacherName: teacher?.name || 'Guru Pengampu',
        teacherCode: teacher?.code,
        subject: slot.subject || teacher?.subject || 'Mapel',
        status,
        updatedAt: new Date().toISOString(),
      };
    });

    setAttendanceRecords(updated);
    saveAttendanceRecords(updated);
    showToast('Status kehadiran seluruh jam guru berhasil diperbarui.');
  };

  // Handler: Update Daily Meta
  const handleUpdateDailyMeta = (meta: typeof dailyMeta) => {
    setDailyMeta(meta);
    saveDailyMeta(meta);
    showToast('Data piket harian berhasil diperbarui.');
  };

  // Handler: Save Report Record
  const handleSaveReportRecord = (report: PiketReportRecord) => {
    const updated = [report, ...reportHistory];
    setReportHistory(updated);
    saveReportHistory(updated);
    showToast('Laporan piket berhasil disimpan ke riwayat.');
  };

  // Handler: Save School Identity Settings (Admin only)
  const handleSaveSchoolSettings = (newSettings: SchoolSettings) => {
    setSchoolSettings(newSettings);
    saveSchoolSettings(newSettings);
    showToast('Identitas Madrasah (Logo, Nama, Semester) berhasil disimpan!');
  };

  // Handler: Reset Data
  const handleResetData = () => {
    localStorage.clear();
    setIsResetConfirmOpen(false);
    showToast('Semua data berhasil direset ke pengaturan awal.');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  // Gate: Show Login View if user is not authenticated
  if (!session.isLoggedIn) {
    return (
      <LoginView
        teachers={teachers.length > 0 ? teachers : loadTeachers()}
        piketOfficers={piketOfficers.length > 0 ? piketOfficers : loadPiketOfficers()}
        credentials={credentials}
        onLogin={handleLogin}
      />
    );
  }

  const activeOfficer = piketOfficers.find(o => o.id === activeOfficerId);
  const activeTeacher = teachers.find(t => t.id === activeTeacherId);

  // RAG Context
  const ragContext = buildRAGContext(
    selectedDate,
    selectedDay,
    classes,
    currentDayPeriods,
    scheduleSlots,
    attendanceRecords,
    teachers,
    dailyMeta
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDay={selectedDay}
        userRole={userRole}
        userName={session.userName}
        activeOfficerName={activeOfficer?.name}
        activeTeacherName={activeTeacher ? `[Kode ${activeTeacher.code}] ${activeTeacher.name}` : undefined}
        onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
        onOpenAdminCredentials={() => setIsAdminCredentialsModalOpen(true)}
        onOpenSchoolSettings={() => setIsSchoolSettingsModalOpen(true)}
        onLogout={handleLogout}
        onResetData={() => setIsResetConfirmOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {activeTab === 'piket' && (
          <div className="space-y-4">
            <PhysicalAttendanceSheet
              currentDay={selectedDay}
              currentDate={selectedDate}
              classes={classes}
              periods={currentDayPeriods}
              scheduleSlots={scheduleSlots}
              attendanceRecords={attendanceRecords}
              teachers={teachers}
              userRole={userRole}
              activeOfficerName={activeOfficer?.name}
              onRequestRoleSwitch={() => setIsRoleModalOpen(true)}
              onSlotClick={(cls, period, slot, existingRecord) => {
                const assignedTeacher = slot?.teacherId ? (teachers.find(t => t.id === slot.teacherId) || null) : null;
                handleOpenAttendanceModal(cls, period, assignedTeacher, slot?.subject || '', existingRecord);
              }}
              onUpdateAttendanceStatus={handleDirectAttendanceStatusChange}
              onBulkMarkTeacher={handleBulkMarkTeacher}
              onMarkAllPresent={handleMarkAllPresent}
              onNavigateToScheduleEditor={() => setActiveTab('schedule')}
              onNavigateToAIReport={() => setActiveTab('ai-report')}
            />
          </div>
        )}

        {/* Rekapitulasi Presensi JP & Penggajian Guru Tata Usaha (1 Bulan Sekali) */}
        {activeTab === 'tu-recap' && (
          <TURecapPayroll
            teachers={teachers}
            scheduleSlots={scheduleSlots}
            periods={currentDayPeriods}
            classes={classes}
            attendanceRecords={attendanceRecords}
            userRole={userRole}
            onRequestRoleSwitch={() => setIsRoleModalOpen(true)}
          />
        )}

        {/* Dedicated Piket Officers Database */}
        {activeTab === 'piket-officers' && (
          <PiketOfficerDatabase
            piketOfficers={piketOfficers}
            teachers={teachers}
            userRole={userRole}
            onRequestRoleSwitch={() => setIsRoleModalOpen(true)}
            onSaveOfficer={handleSavePiketOfficer}
            onDeleteOfficer={handleDeletePiketOfficer}
          />
        )}

        {activeTab === 'ai-report' && (
          <AIReportGenerator
            ragContext={ragContext}
            dailyMeta={dailyMeta}
            userRole={userRole}
            onRequestRoleSwitch={() => setIsRoleModalOpen(true)}
            onUpdateDailyMeta={handleUpdateDailyMeta}
            onSaveReportRecord={handleSaveReportRecord}
          />
        )}

        {activeTab === 'teachers' && (
          <TeacherDatabase
            teachers={teachers}
            userRole={userRole}
            onRequestRoleSwitch={() => setIsRoleModalOpen(true)}
            onSaveTeacher={handleSaveTeacher}
            onDeleteTeacher={handleDeleteTeacher}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleEditor
            days={DAYS_LIST}
            classes={classes}
            periods={currentDayPeriods}
            scheduleSlots={scheduleSlots}
            teachers={teachers}
            userRole={userRole}
            dayPeriodsMap={dayPeriodsMap}
            onRequestRoleSwitch={() => setIsRoleModalOpen(true)}
            onUpdateSlot={handleUpdateScheduleSlot}
            onUpdatePeriods={handleUpdatePeriods}
          />
        )}

        {activeTab === 'stats' && (
          <StatsDashboard
            attendanceRecords={attendanceRecords}
            reportHistory={reportHistory}
            teachers={teachers}
          />
        )}
      </main>

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        selectedClass={modalClass}
        selectedPeriod={modalPeriod}
        assignedTeacher={modalAssignedTeacher}
        subjectName={modalSubject}
        existingRecord={modalExistingRecord}
        teachers={teachers}
        piketOfficers={dailyMeta.piketOfficers}
        piketOfficersList={piketOfficers}
        onSaveAttendance={handleSaveAttendance}
      />

      {/* Role Switcher Modal */}
      <RoleSwitchModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={userRole}
        activeOfficerId={activeOfficerId}
        activeTeacherId={activeTeacherId}
        piketOfficers={piketOfficers}
        teachers={teachers}
        onSelectRole={handleRoleSwitch}
      />

      {/* Admin Credentials Manager Modal */}
      <AdminCredentialsModal
        isOpen={isAdminCredentialsModalOpen}
        onClose={() => setIsAdminCredentialsModalOpen(false)}
        credentials={credentials}
        onSaveCredentials={handleSaveCredentials}
      />

      {/* School Settings Modal */}
      <SchoolSettingsModal
        isOpen={isSchoolSettingsModalOpen}
        onClose={() => setIsSchoolSettingsModalOpen(false)}
        settings={schoolSettings}
        onSave={handleSaveSchoolSettings}
      />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1">
              Reset Semua Data Demo?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-5">
              Tindakan ini akan mengembalikan seluruh Database Guru, Database Guru Piket, Jadwal KBM, dan absensi ke data contoh awal madrasah.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="w-1/2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="w-1/2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">MTs Al Mukhsin</span>
            <span className="text-slate-300">•</span>
            <span>Sistem Informasi Enterprise Pendidikan Berbantuan AI RAG</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Role-Based Access Control (Guru Piket & Guru Biasa) • Database Terpisah • Penyimpanan Otomatis Browser (Local Storage)
          </div>
        </div>
      </footer>
    </div>
  );
}