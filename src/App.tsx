import React, { useState, useEffect, useCallback } from 'react';
import { PatientRecord, DiseaseCategory, FollowUpVisit } from './types';
import { 
  getStoredPatients, 
  saveStoredPatients, 
  generateNextPatientCode 
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { StatsDashboard } from './components/StatsDashboard';
import { PatientList } from './components/PatientList';
import { PatientFormModal } from './components/PatientFormModal';
import { PatientDetailModal } from './components/PatientDetailModal';
import { PatientTimelineView } from './components/PatientTimelineView';
import { AddVisitModal } from './components/AddVisitModal';
import { ClinicalCalculatorsView } from './components/ClinicalCalculatorsModal';
import { ImportExportModal } from './components/ImportExportModal';
import { 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  HeartPulse, 
  BarChart3, 
  Users, 
  Calculator, 
  FileSpreadsheet, 
  Plus, 
  Download,
  Stethoscope,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<PatientRecord[]>(() => getStoredPatients());
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
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Sync state to storage
  useEffect(() => {
    saveStoredPatients(patients);
  }, [patients]);

  // Navigate directly to patient's progression timeline by patient code
  const handleNavigateToTimeline = (patientCode: string) => {
    setSelectedTimelinePatientCode(patientCode);
    setCurrentTab('timeline');
    showToast(`Đang hiển thị diễn tiến tái khám của mã bệnh nhân "${patientCode}".`, 'info');
  };

  // Add / Update Patient
  const handleSavePatient = (patientData: Partial<PatientRecord>) => {
    const now = new Date().toISOString();
    if (editingPatient) {
      // Update existing
      const updated = patients.map((p) =>
        p.id === editingPatient.id
          ? ({ ...p, ...patientData, updatedAt: now } as PatientRecord)
          : p
      );
      setPatients(updated);
      showToast(`Đã cập nhật hồ sơ bệnh nhân "${patientData.fullName}" thành công.`);
    } else {
      // Create new
      const newPatient: PatientRecord = {
        id: patientData.id || `pat-${Date.now()}`,
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
        doctorInCharge: patientData.doctorInCharge || 'BS. CKII Nguyễn Minh',
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
      setPatients([newPatient, ...patients]);
      showToast(`Đã tiếp nhận và lưu hồ sơ "${newPatient.fullName}" (${newPatient.patientCode}) thành công.`);
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

  // Save Follow-Up Visit
  const handleSaveVisit = (patientId: string, visit: FollowUpVisit) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id !== patientId) return p;
        const currentVisits = p.visits || [];
        const existingIdx = currentVisits.findIndex((v) => v.id === visit.id);
        let updatedVisits: FollowUpVisit[];
        if (existingIdx >= 0) {
          updatedVisits = [...currentVisits];
          updatedVisits[existingIdx] = visit;
        } else {
          updatedVisits = [...currentVisits, visit];
        }

        // Sort visits chronologically
        updatedVisits.sort((a, b) => a.visitDate.localeCompare(b.visitDate));

        return {
          ...p,
          visits: updatedVisits,
          followUpDate: visit.nextFollowUpDate || p.followUpDate,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setIsAddVisitModalOpen(false);
    setPatientForVisit(null);
    setEditingVisit(null);
    showToast(`Đã lưu đợt tái khám "${visit.visitTitle}" (${visit.visitDate}) thành công.`);
  };

  // Delete Follow-Up Visit
  const handleDeleteVisit = (patientId: string, visitId: string) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id !== patientId) return p;
        const updatedVisits = (p.visits || []).filter((v) => v.id !== visitId);
        return {
          ...p,
          visits: updatedVisits,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast('Đã xoá đợt tái khám.', 'info');
  };

  // Delete Patient
  const handleDeletePatient = (patientId: string) => {
    const target = patients.find((p) => p.id === patientId);
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    showToast(`Đã xoá hồ sơ "${target?.fullName || patientId}" khỏi hệ thống.`, 'info');
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

  // Import Data
  const handleImportSuccess = (importedData: PatientRecord[]) => {
    setPatients(importedData);
    saveStoredPatients(importedData);
    showToast(`Đã nhập thành công ${importedData.length} bệnh nhân.`);
    setIsImportExportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
      {/* Bento Grid Aside Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col p-6 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-indigo-200">
            G
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-none">GI-Track Pro</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Gan • IBD • IBS Hub</p>
          </div>
        </div>

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
          {/* Top Bento Bar Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {currentTab === 'dashboard' && 'Bảng điều khiển lâm sàng'}
                {currentTab === 'patients' && 'Hồ sơ bệnh nhân'}
                {currentTab === 'timeline' && 'Theo dõi diễn tiến qua từng đợt tái khám'}
                {currentTab === 'calculators' && 'Thang điểm & Máy tính y khoa'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {currentTab === 'timeline'
                  ? 'Tra cứu nhanh bằng Mã số y tế (Mã BN) • Biểu đồ xu hướng xét nghiệm & so sánh lâm sàng'
                  : 'Dữ liệu cập nhật theo thời gian thực • Chuẩn EASL, AASLD, ECCO & Rome IV'}
              </p>
            </div>

            <div className="flex items-center gap-3">
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
                toastMessage.type === 'success'
                  ? 'bg-slate-900 text-white border-indigo-500/40'
                  : 'bg-slate-900 text-white border-sky-500/40'
              }`}>
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
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
            <div>
              <span>Phiên bản Bento Grid UI • Đồng bộ dữ liệu cục bộ an toàn</span>
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
    </div>
  );
}

