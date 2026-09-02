import React, { useState, useEffect, useCallback } from 'react';
import { PatientRecord, DiseaseCategory, FollowUpVisit } from './types';
import { 
  generateNextPatientCode,
  getLocalCachedPatients,
  saveLocalBackup
} from './utils/storage';
import { INITIAL_PATIENTS } from './data/initialData';
import { 
  isSupabaseConfigured, 
  fetchPatientsFromSupabase, 
  insertPatientToSupabase, 
  updatePatientInSupabase, 
  deletePatientFromSupabase 
} from './lib/supabase';
import { Navbar } from './components/Navbar';
import { StatsDashboard } from './components/StatsDashboard';
import { PatientList } from './components/PatientList';
import { PatientFormModal } from './components/PatientFormModal';
import { PatientDetailModal } from './components/PatientDetailModal';
import { PatientTimelineView } from './components/PatientTimelineView';
import { AddVisitModal } from './components/AddVisitModal';
import { ClinicalCalculatorsView } from './components/ClinicalCalculatorsModal';
import { ImportExportModal } from './components/ImportExportModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { 
  CheckCircle, 
  AlertCircle, 
  BarChart3, 
  Users, 
  Calculator, 
  FileSpreadsheet, 
  Plus, 
  Download,
  TrendingUp,
  Database,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CloudUpload,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(true);
  const [isSyncingToSupabase, setIsSyncingToSupabase] = useState<boolean>(false);
  const [supabaseNeedsSync, setSupabaseNeedsSync] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'patients' | 'timeline' | 'calculators'>('dashboard');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DiseaseCategory>('all');
  const [selectedTimelinePatientCode, setSelectedTimelinePatientCode] = useState<string>('BN-001');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<PatientRecord | null>(null);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Follow-up visit modal state
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);
  const [patientForVisit, setPatientForVisit] = useState<PatientRecord | null>(null);
  const [editingVisit, setEditingVisit] = useState<FollowUpVisit | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // SELECT: Fetch patients from Supabase PostgreSQL on mount or reload
  const loadPatientsFromSupabase = useCallback(async () => {
    setIsLoadingPatients(true);
    setSupabaseError(null);

    const localCached = getLocalCachedPatients();
    const fallbackList = localCached.length > 0 ? localCached : INITIAL_PATIENTS;

    if (!isSupabaseConfigured()) {
      setIsLoadingPatients(false);
      setPatients(fallbackList);
      setSupabaseNeedsSync(false);
      if (fallbackList.length > 0) {
        setSelectedTimelinePatientCode(fallbackList[0].patientCode);
      }
      return;
    }

    try {
      const { data, error } = await fetchPatientsFromSupabase();
      if (error) {
        setSupabaseError(error.message);
        showToast(`Lỗi truy vấn Supabase: ${error.message}`, 'error');
        // Keep data visible from local cache/initial so user never loses sight of data
        setPatients(fallbackList);
        setSupabaseNeedsSync(true);
      } else if (data) {
        if (data.length === 0) {
          // Supabase is connected but table is empty (0 rows)
          setPatients(fallbackList);
          setSupabaseNeedsSync(true);
          showToast(`Bảng Supabase đang trống. Đang nạp ${fallbackList.length} hồ sơ sẵn có. Bạn có thể nhấn "Đồng bộ lên Supabase" để lưu vĩnh viễn.`, 'info');
        } else {
          setPatients(data);
          saveLocalBackup(data);
          setSupabaseNeedsSync(false);
          if (data.length > 0) {
            setSelectedTimelinePatientCode(data[0].patientCode);
          }
        }
      }
    } catch (err) {
      const msg = (err as Error).message || 'Không thể kết nối Supabase';
      setSupabaseError(msg);
      showToast(msg, 'error');
      setPatients(fallbackList);
      setSupabaseNeedsSync(true);
    } finally {
      setIsLoadingPatients(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPatientsFromSupabase();
  }, [loadPatientsFromSupabase]);

  // One-click Sync / Push all current patients to Supabase
  const handleSyncAllToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseModalOpen(true);
      return;
    }

    const listToSync = patients.length > 0 ? patients : getLocalCachedPatients().length > 0 ? getLocalCachedPatients() : INITIAL_PATIENTS;
    if (listToSync.length === 0) return;

    setIsSyncingToSupabase(true);
    showToast(`Đang đồng bộ ${listToSync.length} hồ sơ bệnh nhân lên Supabase PostgreSQL...`, 'info');

    try {
      let successCount = 0;
      for (const p of listToSync) {
        const { error } = await insertPatientToSupabase(p);
        if (!error) successCount++;
      }

      saveLocalBackup(listToSync);
      setSupabaseNeedsSync(false);
      showToast(`Đã đồng bộ thành công ${successCount}/${listToSync.length} hồ sơ lên Supabase PostgreSQL!`, 'success');
      await loadPatientsFromSupabase();
    } catch (err) {
      showToast(`Lỗi trong quá trình đồng bộ: ${(err as Error).message}`, 'error');
    } finally {
      setIsSyncingToSupabase(false);
    }
  };

  // Navigate directly to patient's progression timeline by patient code
  const handleNavigateToTimeline = (patientCode: string) => {
    setSelectedTimelinePatientCode(patientCode);
    setCurrentTab('timeline');
    showToast(`Đang hiển thị diễn tiến tái khám của mã bệnh nhân "${patientCode}".`, 'info');
  };

  // INSERT / UPDATE Patient to Supabase
  const handleSavePatient = async (patientData: Partial<PatientRecord>) => {
    const now = new Date().toISOString();

    if (editingPatient) {
      // UPDATE Supabase
      const updatedPatient: PatientRecord = {
        ...editingPatient,
        ...patientData,
        updatedAt: now,
      } as PatientRecord;

      // Optimistic update
      const updatedList = patients.map((p) => (p.id === editingPatient.id ? updatedPatient : p));
      setPatients(updatedList);
      saveLocalBackup(updatedList);

      if (isSupabaseConfigured()) {
        const { error } = await updatePatientInSupabase(updatedPatient);
        if (error) {
          showToast(`Lỗi UPDATE Supabase: ${error.message}`, 'error');
        } else {
          showToast(`Đã UPDATE bệnh nhân "${updatedPatient.fullName}" vào Supabase thành công.`);
        }
      } else {
        showToast(`Đã cập nhật hồ sơ "${updatedPatient.fullName}".`);
      }
    } else {
      // INSERT Supabase
      const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : `pat-${Date.now()}`;

      const newPatient: PatientRecord = {
        id: patientData.id || newId,
        patientCode: patientData.patientCode || generateNextPatientCode(patients),
        fullName: patientData.fullName || 'Bệnh nhân chưa đặt tên',
        age: patientData.age || 0,
        gender: patientData.gender || 'male',
        phone: patientData.phone || '',
        address: patientData.address || '',
        admissionDate: patientData.admissionDate || new Date().toISOString().split('T')[0],
        primaryCategory: patientData.primaryCategory || 'liver',
        specificDiagnosis: patientData.specificDiagnosis || 'Chưa phân loại',
        secondaryDiagnosis: patientData.secondaryDiagnosis || '',
        doctorInCharge: patientData.doctorInCharge || 'Bác sĩ Đỗ Trung Hiếu',
        liverLabs: patientData.liverLabs,
        ibdLabs: patientData.ibdLabs,
        ibsLabs: patientData.ibsLabs,
        treatmentNotes: patientData.treatmentNotes,
        medications: patientData.medications,
        dietaryPlan: patientData.dietaryPlan,
        followUpDate: patientData.followUpDate,
        notes: patientData.notes,
        visits: [],
        createdAt: now,
        updatedAt: now,
      };

      // Optimistic state update
      const updatedList = [newPatient, ...patients];
      setPatients(updatedList);
      saveLocalBackup(updatedList);

      if (isSupabaseConfigured()) {
        const { error } = await insertPatientToSupabase(newPatient);
        if (error) {
          showToast(`Lỗi INSERT Supabase: ${error.message}`, 'error');
        } else {
          showToast(`Đã INSERT bệnh nhân "${newPatient.fullName}" (${newPatient.patientCode}) vào Supabase thành công.`);
        }
      } else {
        showToast(`Đã tiếp nhận hồ sơ "${newPatient.fullName}" (${newPatient.patientCode}).`);
      }
    }

    setIsFormModalOpen(false);
    setEditingPatient(null);
  };

  // Open Add / Edit Visit Modal
  const handleOpenAddVisitModal = (patient: PatientRecord, initialVisit?: FollowUpVisit | null) => {
    setPatientForVisit(patient);
    setEditingVisit(initialVisit || null);
    setIsAddVisitModalOpen(true);
  };

  // Save Follow-Up Visit (UPDATE Supabase)
  const handleSaveVisit = async (patientId: string, visit: FollowUpVisit) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    const currentVisits = targetPatient.visits || [];
    const existingIdx = currentVisits.findIndex((v) => v.id === visit.id);
    let updatedVisits: FollowUpVisit[];
    if (existingIdx >= 0) {
      updatedVisits = [...currentVisits];
      updatedVisits[existingIdx] = visit;
    } else {
      updatedVisits = [...currentVisits, visit];
    }

    updatedVisits.sort((a, b) => a.visitDate.localeCompare(b.visitDate));

    const updatedPatient: PatientRecord = {
      ...targetPatient,
      visits: updatedVisits,
      followUpDate: visit.nextFollowUpDate || targetPatient.followUpDate,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = patients.map((p) => (p.id === patientId ? updatedPatient : p));
    setPatients(updatedList);
    saveLocalBackup(updatedList);

    if (isSupabaseConfigured()) {
      const { error } = await updatePatientInSupabase(updatedPatient);
      if (error) {
        showToast(`Lỗi cập nhật đợt tái khám lên Supabase: ${error.message}`, 'error');
      } else {
        showToast(`Đã lưu đợt tái khám "${visit.visitTitle}" vào Supabase thành công.`);
      }
    } else {
      showToast(`Đã lưu đợt tái khám "${visit.visitTitle}".`);
    }

    setIsAddVisitModalOpen(false);
    setPatientForVisit(null);
    setEditingVisit(null);
  };

  // Delete Follow-Up Visit (UPDATE Supabase)
  const handleDeleteVisit = async (patientId: string, visitId: string) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    const updatedVisits = (targetPatient.visits || []).filter((v) => v.id !== visitId);
    const updatedPatient: PatientRecord = {
      ...targetPatient,
      visits: updatedVisits,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = patients.map((p) => (p.id === patientId ? updatedPatient : p));
    setPatients(updatedList);
    saveLocalBackup(updatedList);

    if (isSupabaseConfigured()) {
      await updatePatientInSupabase(updatedPatient);
    }

    showToast('Đã xoá đợt tái khám.', 'info');
  };

  // DELETE Patient from Supabase
  const handleDeletePatient = async (patientId: string) => {
    const target = patients.find((p) => p.id === patientId);
    
    // Optimistic remove
    const updatedList = patients.filter((p) => p.id !== patientId);
    setPatients(updatedList);
    saveLocalBackup(updatedList);

    if (isSupabaseConfigured()) {
      const { error } = await deletePatientFromSupabase(patientId);
      if (error) {
        showToast(`Lỗi DELETE Supabase: ${error.message}`, 'error');
      } else {
        showToast(`Đã DELETE hồ sơ "${target?.fullName || patientId}" khỏi Supabase.`, 'info');
      }
    } else {
      showToast(`Đã xoá hồ sơ "${target?.fullName || patientId}".`, 'info');
    }

    if (viewingPatient?.id === patientId) {
      setIsDetailModalOpen(false);
      setViewingPatient(null);
    }
  };

  // Open Edit
  const handleOpenEdit = (patient: PatientRecord) => {
    setEditingPatient(patient);
    setIsDetailModalOpen(false);
    setIsFormModalOpen(true);
  };

  // Open View Detail
  const handleOpenDetail = (patient: PatientRecord) => {
    setViewingPatient(patient);
    setIsDetailModalOpen(true);
  };

  // Category select from dashboard
  const handleCategorySelectFromDashboard = (cat: 'all' | DiseaseCategory) => {
    setCategoryFilter(cat);
    setCurrentTab('patients');
  };

  // Import Data -> batch insert to Supabase
  const handleImportSuccess = async (importedData: PatientRecord[]) => {
    setPatients(importedData);
    if (isSupabaseConfigured()) {
      showToast(`Đang đồng bộ ${importedData.length} bệnh nhân vào Supabase...`, 'info');
      for (const p of importedData) {
        await insertPatientToSupabase(p);
      }
      showToast(`Đã đồng bộ thành công ${importedData.length} bệnh nhân vào Supabase.`);
    } else {
      showToast(`Đã nhập thành công ${importedData.length} bệnh nhân.`);
    }
    setIsImportExportModalOpen(false);
  };

  const isConnected = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
      {/* Bento Grid Aside Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col p-6 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-indigo-200">
            G
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-none">GI-Track Pro</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Gan • IBD • IBS Hub</p>
          </div>
        </div>

        {/* Supabase Status Pill */}
        <button
          onClick={() => setIsSupabaseModalOpen(true)}
          className={`w-full mb-6 p-3 rounded-2xl border text-left transition flex items-center justify-between group ${
            isConnected
              ? 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70'
              : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-lg ${isConnected ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Database</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              </div>
              <p className={`text-xs font-bold truncate ${isConnected ? 'text-emerald-900' : 'text-amber-900'}`}>
                {isConnected ? 'Supabase PostgreSQL' : 'Cần cấu hình Supabase'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-indigo-600 group-hover:underline">Chi tiết</span>
        </button>

        {/* Bento Nav Menu */}
        <nav className="flex-1 space-y-1.5">
          <button
            id="sidebar-nav-dashboard"
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              currentTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 opacity-90" />
              <span>Tổng quan</span>
            </div>
            {currentTab === 'dashboard' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
          </button>

          <button
            id="sidebar-nav-patients"
            onClick={() => setCurrentTab('patients')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              currentTab === 'patients'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 opacity-90" />
              <span>Bệnh nhân</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {patients.length}
            </span>
          </button>

          <button
            id="sidebar-nav-timeline"
            onClick={() => setCurrentTab('timeline')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              currentTab === 'timeline'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 opacity-90" />
              <span>Diễn tiến tái khám</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Mã BN
            </span>
          </button>

          <button
            id="sidebar-nav-calculators"
            onClick={() => setCurrentTab('calculators')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              currentTab === 'calculators'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 opacity-90" />
              <span>Thang điểm Y khoa</span>
            </div>
            {currentTab === 'calculators' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
          </button>

          <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-4 mb-2 tracking-wider">
              Dữ liệu & Công cụ
            </div>

            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Cấu hình Supabase</span>
            </button>
            
            <button
              onClick={() => setIsImportExportModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              <span>Sao lưu / Xuất Excel</span>
            </button>
          </div>
        </nav>

        {/* Bento Doctor Card */}
        <div className="mt-auto p-4 bg-slate-900 rounded-2xl text-white shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Bác sĩ phụ trách</p>
          </div>
          <p className="font-bold text-sm text-indigo-200">Bác sĩ Đỗ Trung Hiếu</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Khoa Nội tiêu hóa - Bệnh viện đa khoa Đồng Nai</p>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile & Tablet Header Navbar */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          totalPatients={patients.length}
          onOpenNewPatient={() => {
            setEditingPatient(null);
            setIsFormModalOpen(true);
          }}
          onOpenImportExport={() => setIsImportExportModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* Top Supabase Notice Bar if not configured */}
          {!isConnected && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Đang hiển thị dữ liệu bộ nhớ máy / mẫu ({patients.length} bệnh nhân).</span> Thêm{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_URL</code> và{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> để kết nối lưu trữ đám mây Supabase PostgreSQL.
                </div>
              </div>
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shrink-0 transition"
              >
                Xem Cấu Hình & SQL
              </button>
            </div>
          )}

          {/* Sync banner when local data is available and Supabase is connected but empty */}
          {supabaseNeedsSync && isConnected && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-indigo-500/40">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30 shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-white">Đã tìm thấy {patients.length} hồ sơ bệnh nhân</h4>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      Sẵn sàng nạp vào Supabase
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Database Supabase của bạn vừa được kết nối và đang trống. Nhấn nút <strong>"Đồng bộ tất cả lên Supabase"</strong> bên cạnh để đẩy toàn bộ {patients.length} hồ sơ bệnh nhân vào bảng PostgreSQL vĩnh viễn.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSyncAllToSupabase}
                disabled={isSyncingToSupabase}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-950/40 flex items-center gap-2 shrink-0 transition active:scale-95 disabled:opacity-50"
              >
                {isSyncingToSupabase ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu vào Supabase...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Đồng bộ tất cả ({patients.length} BN) lên Supabase</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Top Bento Bar Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {currentTab === 'dashboard' && 'Bảng điều khiển lâm sàng'}
                  {currentTab === 'patients' && 'Hồ sơ bệnh nhân'}
                  {currentTab === 'timeline' && 'Theo dõi diễn tiến qua từng đợt tái khám'}
                  {currentTab === 'calculators' && 'Thang điểm & Máy tính y khoa'}
                </h2>
                {isLoadingPatients && (
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                )}
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {currentTab === 'timeline'
                  ? 'Tra cứu nhanh bằng Mã số y tế (Mã BN) • Biểu đồ xu hướng xét nghiệm & so sánh lâm sàng'
                  : 'Dữ liệu Supabase PostgreSQL cập nhật trực tiếp • Chuẩn EASL, AASLD, ECCO & Rome IV'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadPatientsFromSupabase}
                disabled={isLoadingPatients}
                title="Tải lại dữ liệu từ Supabase"
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPatients ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                onClick={() => setIsImportExportModalOpen(true)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Xuất báo cáo</span>
              </button>

              <button
                onClick={() => {
                  setEditingPatient(null);
                  setIsFormModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-200 transition flex items-center gap-1.5 transform active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Nhập ca bệnh</span>
              </button>
            </div>
          </header>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
                toastMessage.type === 'error'
                  ? 'bg-rose-900 text-white border-rose-500/40'
                  : toastMessage.type === 'info'
                  ? 'bg-slate-900 text-white border-sky-500/40'
                  : 'bg-slate-900 text-white border-indigo-500/40'
              }`}>
                {toastMessage.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
                <span>{toastMessage.text}</span>
              </div>
            </div>
          )}

          {/* Tab Views */}
          {currentTab === 'dashboard' && (
            <StatsDashboard
              patients={patients}
              onSelectCategory={handleCategorySelectFromDashboard}
              onOpenPatientDetail={handleOpenDetail}
              onOpenNewPatient={() => {
                setEditingPatient(null);
                setIsFormModalOpen(true);
              }}
              onQuickSaveLab={handleSavePatient}
            />
          )}

          {currentTab === 'patients' && (
            <PatientList
              patients={patients}
              activeCategoryFilter={categoryFilter}
              setActiveCategoryFilter={setCategoryFilter}
              onOpenNewPatient={() => {
                setEditingPatient(null);
                setIsFormModalOpen(true);
              }}
              onViewPatient={handleOpenDetail}
              onEditPatient={handleOpenEdit}
              onDeletePatient={handleDeletePatient}
              onViewTimeline={handleNavigateToTimeline}
            />
          )}

          {currentTab === 'timeline' && (
            <PatientTimelineView
              patients={patients}
              selectedPatientCode={selectedTimelinePatientCode}
              onSelectPatientCode={setSelectedTimelinePatientCode}
              onOpenAddVisitModal={handleOpenAddVisitModal}
              onDeleteVisit={handleDeleteVisit}
              onViewPatientDetails={handleOpenDetail}
            />
          )}

          {currentTab === 'calculators' && <ClinicalCalculatorsView />}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                G
              </div>
              <span className="font-bold text-slate-800">GI-Track Pro</span>
              <span>• Phân Hệ Quản Lý Lâm Sàng Tiêu Hoá - Gan Mật</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 font-medium"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase PostgreSQL: {isConnected ? 'Đã kết nối' : 'Cần cấu hình'}</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Patient Entry / Edit Modal */}
      <PatientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPatient(null);
        }}
        onSave={handleSavePatient}
        initialData={editingPatient}
        generatedCode={generateNextPatientCode(patients)}
      />

      {/* Patient Detail / Dossier Modal */}
      <PatientDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingPatient(null);
        }}
        patient={viewingPatient}
        onEdit={(p) => {
          setIsDetailModalOpen(false);
          handleOpenEdit(p);
        }}
        onViewTimeline={handleNavigateToTimeline}
        onAddVisit={(p) => handleOpenAddVisitModal(p)}
      />

      {/* Add / Edit Follow-Up Visit Modal */}
      <AddVisitModal
        isOpen={isAddVisitModalOpen}
        onClose={() => {
          setIsAddVisitModalOpen(false);
          setPatientForVisit(null);
          setEditingVisit(null);
        }}
        patient={patientForVisit}
        onSaveVisit={handleSaveVisit}
        initialVisit={editingVisit}
      />

      {/* Import / Export & Backup Modal */}
      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        patients={patients}
        onImportSuccess={handleImportSuccess}
      />

      {/* Supabase Connection & SQL Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onRefreshConnection={loadPatientsFromSupabase}
        patientCount={patients.length}
      />
    </div>
  );
}
