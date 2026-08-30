import React, { useState, useMemo, useEffect } from 'react';
import { PatientRecord, FollowUpVisit, DiseaseCategory } from '../types';
import { 
  Search, 
  User, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Printer, 
  Activity, 
  Droplets, 
  Flame, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  Stethoscope,
  Pill,
  BarChart3,
  ListFilter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { 
  calculateFIB4, 
  calculateAPRI, 
  interpretCalprotectin, 
  BRISTOL_STOOL_SCALE,
  checkLabStatus 
} from '../utils/clinicalCalculators';

interface PatientTimelineViewProps {
  patients: PatientRecord[];
  selectedPatientCode?: string;
  onSelectPatientCode?: (code: string) => void;
  onOpenAddVisitModal: (patient: PatientRecord, initialVisit?: FollowUpVisit | null) => void;
  onDeleteVisit: (patientId: string, visitId: string) => void;
  onViewPatientDetails: (patient: PatientRecord) => void;
}

export const PatientTimelineView: React.FC<PatientTimelineViewProps> = ({
  patients,
  selectedPatientCode = '',
  onSelectPatientCode,
  onOpenAddVisitModal,
  onDeleteVisit,
  onViewPatientDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(selectedPatientCode);
  const [activeTab, setActiveTab] = useState<'timeline' | 'charts' | 'matrix'>('timeline');

  // Synchronize internal search query when prop changes
  useEffect(() => {
    if (selectedPatientCode) {
      setSearchQuery(selectedPatientCode);
    }
  }, [selectedPatientCode]);

  // Find matching patient by exact code, or clean matching
  const selectedPatient = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const cleanQuery = searchQuery.trim().toLowerCase();
    return patients.find(
      (p) =>
        p.patientCode.toLowerCase() === cleanQuery ||
        p.patientCode.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanQuery.replace(/[^a-z0-9]/g, '') ||
        p.fullName.toLowerCase() === cleanQuery
    ) || null;
  }, [patients, searchQuery]);

  // Autocomplete matching list for fast dropdown or chips
  const matchingSuggestions = useMemo(() => {
    if (!searchQuery.trim() || selectedPatient) return [];
    const clean = searchQuery.trim().toLowerCase();
    return patients.filter(
      (p) =>
        p.patientCode.toLowerCase().includes(clean) ||
        p.fullName.toLowerCase().includes(clean) ||
        p.phone?.includes(clean)
    ).slice(0, 5);
  }, [patients, searchQuery, selectedPatient]);

  // Combine baseline admission data and follow-up visits into unified chronological list
  const chronologicalHistory = useMemo(() => {
    if (!selectedPatient) return [];
    
    // Construct baseline visit item
    const baselineItem: FollowUpVisit = {
      id: 'baseline-0',
      visitDate: selectedPatient.admissionDate,
      visitNumber: 0,
      visitTitle: 'Lần Khám Ban Đầu (Hồ Sơ Khởi Đầu)',
      clinicalSymptoms: selectedPatient.notes || 'Khám chẩn đoán xác định ban đầu',
      progression: 'Ổn định',
      liverLabs: selectedPatient.liverLabs,
      ibdLabs: selectedPatient.ibdLabs,
      ibsLabs: selectedPatient.ibsLabs,
      medicationChanges: selectedPatient.medications || [],
      doctorNotes: selectedPatient.treatmentNotes,
      doctorInCharge: selectedPatient.doctorInCharge,
      nextFollowUpDate: selectedPatient.followUpDate,
    };

    const extraVisits = selectedPatient.visits || [];
    // Sort chronologically ascending
    const sorted = [...extraVisits].sort(
      (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
    );

    return [baselineItem, ...sorted];
  }, [selectedPatient]);

  // Longitudinal chart datasets
  const chartData = useMemo(() => {
    return chronologicalHistory.map((item, index) => {
      const dateLabel = item.visitDate ? item.visitDate.split('-').slice(1).join('/') : `Lần ${index}`;
      const titleLabel = index === 0 ? 'Khởi đầu' : `Đợt ${item.visitNumber || index}`;

      return {
        name: `${titleLabel} (${dateLabel})`,
        fullTitle: item.visitTitle,
        date: item.visitDate,
        // Liver Labs
        ast: item.liverLabs?.ast,
        alt: item.liverLabs?.alt,
        ggt: item.liverLabs?.ggt,
        bilirubinTotal: item.liverLabs?.bilirubinTotal,
        platelets: item.liverLabs?.platelets,
        fib4Score: item.liverLabs?.fib4Score,
        fibroscanKpa: item.liverLabs?.fibroscanKpa,
        // IBD Labs
        calprotectin: item.ibdLabs?.fecalCalprotectin,
        crp: item.ibdLabs?.crp,
        esr: item.ibdLabs?.esr,
        hemoglobin: item.ibdLabs?.hemoglobin,
        // IBS Labs
        bristol: item.ibsLabs?.bristolStoolScale,
        stoolFreq: item.ibsLabs?.stoolFrequencyPerDay,
        ibssScore: item.ibsLabs?.ibssScore,
        painDays: item.ibsLabs?.abdominalPainDaysPerMonth,
      };
    });
  }, [chronologicalHistory]);

  const handleSelectCode = (code: string) => {
    setSearchQuery(code);
    if (onSelectPatientCode) {
      onSelectPatientCode(code);
    }
  };

  const getProgressionBadge = (prog: string) => {
    switch (prog) {
      case 'Thuyên giảm hoàn toàn (Deep Remission)':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cải thiện rõ rệt':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Cải thiện một phần':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ổn định':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Không đáp ứng / Kháng trị':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Bùng phát cấp / Nặng hơn':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryBadge = (cat: DiseaseCategory) => {
    switch (cat) {
      case 'liver':
        return { label: 'Gan Mật', bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: Droplets };
      case 'ibd':
        return { label: 'IBD (Viêm ruột)', bg: 'bg-teal-100 text-teal-900 border-teal-300', icon: Flame };
      case 'ibs':
        return { label: 'IBS (Ruột kích thích)', bg: 'bg-rose-100 text-rose-900 border-rose-300', icon: Zap };
      case 'mixed':
        return { label: 'Phối Hợp', bg: 'bg-purple-100 text-purple-900 border-purple-300', icon: Activity };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search Header Bento Box */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Theo Dõi Diễn Tiến Điều Trị & Tái Khám</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tra Cứu Diễn Tiến Theo Mã Số Y Tế
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Chỉ cần nhập chính xác mã số y tế (VD: <span className="font-mono font-semibold text-slate-800">BN-2026-001</span>) để xem đồ thị và lịch sử toàn bộ các đợt tái khám.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-96 relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập mã số y tế (VD: BN-2026-001)..."
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 focus:outline-hidden transition shadow-inner"
              />
              <Search className="h-5 w-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-1.5 py-0.5 rounded-md hover:bg-slate-200"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {matchingSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Bệnh nhân khớp gợi ý ({matchingSuggestions.length})
                </div>
                {matchingSuggestions.map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => handleSelectCode(pat.patientCode)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-indigo-50 flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">
                          {pat.patientCode}
                        </span>
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-900">
                          {pat.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500">({pat.age}t, {pat.gender === 'male' ? 'Nam' : 'Nữ'})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{pat.specificDiagnosis}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fast Select Chips of Patients in System */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Chọn nhanh:
          </span>
          {patients.slice(0, 8).map((p) => {
            const isSelected = selectedPatient?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectCode(p.patientCode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span className="font-mono font-bold">{p.patientCode}</span>
                <span className="opacity-80">({p.fullName.split(' ').slice(-1)[0]})</span>
                {p.visits && p.visits.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    +{p.visits.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Patient Found Dossier or Empty State */}
      {!selectedPatient ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-xs">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Chưa chọn bệnh nhân để xem diễn tiến
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Vui lòng nhập mã y tế vào thanh tìm kiếm ở trên hoặc nhấp vào một trong các mã bệnh nhân có sẵn.
          </p>

          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
            {patients.map((p) => {
              const catBadge = getCategoryBadge(p.primaryCategory);
              const CatIcon = catBadge.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectCode(p.patientCode)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition cursor-pointer group bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {p.patientCode}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catBadge.bg}`}>
                      {catBadge.label}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 truncate">
                    {p.fullName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {p.specificDiagnosis}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{p.visits?.length || 0} đợt tái khám</span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                      Xem <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patient Dossier Banner (Bento Card) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Info */}
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0">
                  {selectedPatient.fullName
                    .split(' ')
                    .slice(-2)
                    .map((n) => n[0])
                    .join('')}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {selectedPatient.fullName}
                    </h3>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                      {selectedPatient.patientCode}
                    </span>
                    {(() => {
                      const catBadge = getCategoryBadge(selectedPatient.primaryCategory);
                      const CatIcon = catBadge.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl border ${catBadge.bg}`}>
                          <CatIcon className="h-3.5 w-3.5" />
                          <span>{catBadge.label}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span><strong>Tuổi:</strong> {selectedPatient.age} ({selectedPatient.gender === 'male' ? 'Nam' : selectedPatient.gender === 'female' ? 'Nữ' : 'Khác'})</span>
                    {selectedPatient.phone && <span><strong>SĐT:</strong> {selectedPatient.phone}</span>}
                    <span><strong>Bác sĩ phụ trách:</strong> {selectedPatient.doctorInCharge || 'Chưa phân công'}</span>
                  </div>

                  <div className="text-xs text-slate-700 font-medium pt-1">
                    <strong>Chẩn đoán:</strong> <span className="text-indigo-950">{selectedPatient.specificDiagnosis}</span>
                    {selectedPatient.secondaryDiagnosis && (
                      <span className="text-slate-500"> (Kèm theo: {selectedPatient.secondaryDiagnosis})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Summary Badges & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                  <div className="px-2">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">Đợt tái khám</span>
                    <span className="text-base font-black text-indigo-600">
                      {selectedPatient.visits?.length || 0}
                    </span>
                  </div>
                  <div className="px-2 border-l border-slate-200">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">Khởi đầu</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      {selectedPatient.admissionDate}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onOpenAddVisitModal(selectedPatient)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-xs transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Thêm Đợt Tái Khám</span>
                  </button>

                  <button
                    onClick={() => onViewPatientDetails(selectedPatient)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Hồ Sơ Gốc</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    title="In phiếu diễn tiến"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* View Mode Switcher Tabs */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'timeline'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Dòng Thời Gian ({chronologicalHistory.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('charts')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'charts'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Đồ Thị Xu Hướng Xét Nghiệm</span>
                </button>

                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'matrix'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  <span>Bảng So Sánh Tiến Triển</span>
                </button>
              </div>

              {selectedPatient.followUpDate && (
                <div className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  <span>Hẹn tái khám kế tiếp: <strong>{selectedPatient.followUpDate}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: DÒNG THỜI GIAN (VERTICAL BENTO CARDS) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span>Lịch Sử Diễn Biến Qua Các Lần Khám ({chronologicalHistory.length} mốc)</span>
                </h4>
                <button
                  onClick={() => onOpenAddVisitModal(selectedPatient)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Ghi nhận đợt mới
                </button>
              </div>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-indigo-100">
                {chronologicalHistory.map((visit, index) => {
                  const isBaseline = visit.visitNumber === 0;
                  const progBadge = getProgressionBadge(visit.progression);

                  return (
                    <div
                      key={visit.id}
                      className="relative bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition"
                    >
                      {/* Stepper Node Icon */}
                      <div className={`absolute -left-6 sm:-left-8 top-6 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        isBaseline
                          ? 'bg-slate-900 border-white text-white'
                          : 'bg-indigo-600 border-white text-white shadow-xs'
                      }`}>
                        {isBaseline ? '0' : index}
                      </div>

                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {visit.visitDate}
                            </span>
                            <h5 className="font-bold text-sm sm:text-base text-slate-900">
                              {visit.visitTitle}
                            </h5>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${progBadge}`}>
                              {visit.progression}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (only for custom visits, not baseline) */}
                        {!isBaseline && (
                          <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                            <button
                              onClick={() => onOpenAddVisitModal(selectedPatient, visit)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-xs flex items-center gap-1 font-medium"
                              title="Chỉnh sửa đợt tái khám"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc muốn xóa đợt "${visit.visitTitle}"?`)) {
                                  onDeleteVisit(selectedPatient.id, visit.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-xs flex items-center gap-1 font-medium"
                              title="Xóa đợt này"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Clinical Symptoms */}
                      {visit.clinicalSymptoms && (
                        <div className="mt-3 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <strong className="text-slate-900 block mb-0.5">Triệu chứng & Khám lâm sàng:</strong>
                          {visit.clinicalSymptoms}
                        </div>
                      )}

                      {/* Pathology Labs Grid */}
                      <div className="mt-4 space-y-3">
                        {/* Liver labs */}
                        {visit.liverLabs && (
                          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Droplets className="h-3.5 w-3.5 text-amber-600" />
                                <span>Chỉ Số Gan Mật</span>
                              </span>
                              {visit.liverLabs.fib4Score && (
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                                  FIB-4: {visit.liverLabs.fib4Score} ({visit.liverLabs.fib4Category || ''})
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              {visit.liverLabs.ast !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                  <span className="text-slate-400 text-[10px] block">AST / SGOT</span>
                                  <span className={`font-bold ${visit.liverLabs.ast > 40 ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {visit.liverLabs.ast} U/L
                                  </span>
                                </div>
                              )}
                              {visit.liverLabs.alt !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                  <span className="text-slate-400 text-[10px] block">ALT / SGPT</span>
                                  <span className={`font-bold ${visit.liverLabs.alt > 40 ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {visit.liverLabs.alt} U/L
                                  </span>
                                </div>
                              )}
                              {visit.liverLabs.ggt !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                  <span className="text-slate-400 text-[10px] block">GGT</span>
                                  <span className="font-bold text-slate-800">{visit.liverLabs.ggt} U/L</span>
                                </div>
                              )}
                              {visit.liverLabs.bilirubinTotal !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                  <span className="text-slate-400 text-[10px] block">Bilirubin TP</span>
                                  <span className="font-bold text-slate-800">{visit.liverLabs.bilirubinTotal} mg/dL</span>
                                </div>
                              )}
                              {visit.liverLabs.platelets !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                  <span className="text-slate-400 text-[10px] block">Tiểu cầu</span>
                                  <span className="font-bold text-slate-800">{visit.liverLabs.platelets} x10^9</span>
                                </div>
                              )}
                              {visit.liverLabs.fibroscanKpa !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                  <span className="text-slate-400 text-[10px] block">FibroScan</span>
                                  <span className="font-bold text-slate-800">{visit.liverLabs.fibroscanKpa} kPa</span>
                                </div>
                              )}
                              {visit.liverLabs.hbvDna && (
                                <div className="bg-white p-2 rounded-xl border border-amber-100 col-span-2">
                                  <span className="text-slate-400 text-[10px] block">HBV-DNA</span>
                                  <span className="font-bold text-amber-900 font-mono text-[11px]">{visit.liverLabs.hbvDna}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* IBD labs */}
                        {visit.ibdLabs && (
                          <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                <Flame className="h-3.5 w-3.5 text-teal-600" />
                                <span>Chỉ Số Viêm Ruột IBD</span>
                              </span>
                              {visit.ibdLabs.diseaseActivity && (
                                <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                                  {visit.ibdLabs.diseaseActivity}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              {visit.ibdLabs.fecalCalprotectin !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-teal-100">
                                  <span className="text-slate-400 text-[10px] block">Calprotectin phân</span>
                                  <span className={`font-bold ${visit.ibdLabs.fecalCalprotectin > 200 ? 'text-rose-600' : visit.ibdLabs.fecalCalprotectin <= 50 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {visit.ibdLabs.fecalCalprotectin} µg/g
                                  </span>
                                </div>
                              )}
                              {visit.ibdLabs.crp !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-teal-100">
                                  <span className="text-slate-400 text-[10px] block">CRP</span>
                                  <span className={`font-bold ${visit.ibdLabs.crp > 5 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                    {visit.ibdLabs.crp} mg/L
                                  </span>
                                </div>
                              )}
                              {visit.ibdLabs.hemoglobin !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-teal-100">
                                  <span className="text-slate-400 text-[10px] block">Hemoglobin</span>
                                  <span className="font-bold text-slate-800">{visit.ibdLabs.hemoglobin} g/dL</span>
                                </div>
                              )}
                              {visit.ibdLabs.esr !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-teal-100">
                                  <span className="text-slate-400 text-[10px] block">Lắng máu ESR</span>
                                  <span className="font-bold text-slate-800">{visit.ibdLabs.esr} mm/h</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* IBS labs */}
                        {visit.ibsLabs && (
                          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                <Zap className="h-3.5 w-3.5 text-rose-600" />
                                <span>Chỉ Số Ruột Kích Thích IBS</span>
                              </span>
                              {visit.ibsLabs.romeIVSubtype && (
                                <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                                  {visit.ibsLabs.romeIVSubtype}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              {visit.ibsLabs.bristolStoolScale !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-rose-100">
                                  <span className="text-slate-400 text-[10px] block">Thang phân Bristol</span>
                                  <span className="font-bold text-slate-800">
                                    Type {visit.ibsLabs.bristolStoolScale}
                                  </span>
                                </div>
                              )}
                              {visit.ibsLabs.ibssScore !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-rose-100">
                                  <span className="text-slate-400 text-[10px] block">Điểm IBS-SSS</span>
                                  <span className={`font-bold ${visit.ibsLabs.ibssScore < 75 ? 'text-emerald-700' : 'text-slate-800'}`}>
                                    {visit.ibsLabs.ibssScore}
                                  </span>
                                </div>
                              )}
                              {visit.ibsLabs.stoolFrequencyPerDay !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-rose-100">
                                  <span className="text-slate-400 text-[10px] block">Đi cầu / ngày</span>
                                  <span className="font-bold text-slate-800">{visit.ibsLabs.stoolFrequencyPerDay} lần</span>
                                </div>
                              )}
                              {visit.ibsLabs.abdominalPainDaysPerMonth !== undefined && (
                                <div className="bg-white p-2 rounded-xl border border-rose-100">
                                  <span className="text-slate-400 text-[10px] block">Ngày đau bụng / tháng</span>
                                  <span className="font-bold text-slate-800">{visit.ibsLabs.abdominalPainDaysPerMonth} ngày</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Medications & Adjustments */}
                      {visit.medicationChanges && visit.medicationChanges.length > 0 && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                          <Pill className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            <span className="font-semibold text-slate-800">Thuốc điều trị:</span>
                            {visit.medicationChanges.map((med, mi) => (
                              <span key={mi} className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-md font-medium">
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doctor Notes & Footer */}
                      {visit.doctorNotes && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                          <Stethoscope className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <p><strong>Ghi chú bác sĩ:</strong> {visit.doctorNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ĐỒ THỊ XU HƯỚNG XÉT NGHIỆM (RECHARTS) */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              {/* LIVER CHARTS */}
              {(selectedPatient.primaryCategory === 'liver' || selectedPatient.primaryCategory === 'mixed') && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-amber-600" />
                        <span>Diễn Biến Men Gan AST & ALT Qua Các Đợt Khám</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Đường chấm đỏ tại 40 U/L là ngưỡng giới hạn trên bình thường (ULN).
                      </p>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} label={{ value: 'U/L', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#1e293b',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Ngưỡng BT (40 U/L)', fill: '#ef4444', fontSize: 10 }} />
                        <Line type="monotone" dataKey="alt" name="ALT / SGPT (U/L)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                        <Line type="monotone" dataKey="ast" name="AST / SGOT (U/L)" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="ggt" name="GGT (U/L)" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* IBD CHARTS */}
              {(selectedPatient.primaryCategory === 'ibd' || selectedPatient.primaryCategory === 'mixed') && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-teal-600" />
                      <span>Diễn Biến Calprotectin Phân (µg/g) & CRP (mg/L)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đo lường mức độ thuyên giảm viêm ruột. Ngưỡng &lt;50 µg/g tương đương lui bệnh hoàn toàn.
                    </p>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="calprotectinGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} label={{ value: 'µg/g', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#1e293b',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <ReferenceLine y={50} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Mục tiêu (<50)', fill: '#10b981', fontSize: 10 }} />
                        <ReferenceLine y={200} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Viêm nặng (>200)', fill: '#f43f5e', fontSize: 10 }} />
                        <Area type="monotone" dataKey="calprotectin" name="Calprotectin phân (µg/g)" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#calprotectinGrad)" />
                        <Line type="monotone" dataKey="crp" name="CRP (mg/L)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* IBS CHARTS */}
              {(selectedPatient.primaryCategory === 'ibs' || selectedPatient.primaryCategory === 'mixed') && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-rose-600" />
                      <span>Diễn Biến Điểm IBS-SSS & Thang Phân Bristol</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      IBS-SSS &lt;75 tương ứng với giai đoạn thuyên giảm triệu chứng ruột kích thích.
                    </p>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#1e293b',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Lui bệnh (<75)', fill: '#10b981', fontSize: 10 }} />
                        <Line type="monotone" dataKey="ibssScore" name="Điểm IBS-SSS (0-500)" stroke="#e11d48" strokeWidth={3} dot={{ r: 5 }} />
                        <Line type="monotone" dataKey="stoolFreq" name="Số lần đi ngoài / ngày" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="painDays" name="Số ngày đau bụng / tháng" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BẢNG SO SÁNH TIẾN TRIỂN THEO CHIỀU NGANG */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs overflow-hidden">
              <div className="mb-4">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ListFilter className="h-5 w-5 text-indigo-600" />
                  <span>Ma Trận So Sánh Chỉ Số Từng Đợt Khám</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi sự thay đổi định lượng từ lúc khởi phát ban đầu đến đợt khám gần nhất.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="py-3 px-4 rounded-l-2xl">Thông Số / Xét Nghiệm</th>
                      {chronologicalHistory.map((item, idx) => (
                        <th key={item.id} className="py-3 px-4 min-w-[140px]">
                          <div>{idx === 0 ? 'Khởi đầu' : `Đợt ${item.visitNumber || idx}`}</div>
                          <div className="text-[10px] font-normal text-slate-400 font-mono">{item.visitDate}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td className="py-2.5 px-4">Tiến triển tổng thể</td>
                      {chronologicalHistory.map((item) => (
                        <td key={item.id} className="py-2.5 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getProgressionBadge(item.progression)}`}>
                            {item.progression}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Pathology Rows */}
                    {(selectedPatient.primaryCategory === 'liver' || selectedPatient.primaryCategory === 'mixed') && (
                      <>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">ALT / SGPT (U/L)</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4 font-bold">
                              {item.liverLabs?.alt !== undefined ? (
                                <span className={item.liverLabs.alt > 40 ? 'text-rose-600' : 'text-emerald-700'}>
                                  {item.liverLabs.alt} U/L
                                </span>
                              ) : '-'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">AST / SGOT (U/L)</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4">
                              {item.liverLabs?.ast !== undefined ? `${item.liverLabs.ast} U/L` : '-'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Điểm FIB-4</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4 font-bold">
                              {item.liverLabs?.fib4Score ? `${item.liverLabs.fib4Score} (${item.liverLabs.fib4Category || ''})` : '-'}
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    {(selectedPatient.primaryCategory === 'ibd' || selectedPatient.primaryCategory === 'mixed') && (
                      <>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Calprotectin phân (µg/g)</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4 font-bold">
                              {item.ibdLabs?.fecalCalprotectin !== undefined ? (
                                <span className={item.ibdLabs.fecalCalprotectin > 200 ? 'text-rose-600' : item.ibdLabs.fecalCalprotectin <= 50 ? 'text-emerald-700' : 'text-amber-600'}>
                                  {item.ibdLabs.fecalCalprotectin} µg/g
                                </span>
                              ) : '-'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">CRP (mg/L)</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4">
                              {item.ibdLabs?.crp !== undefined ? `${item.ibdLabs.crp} mg/L` : '-'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Mức độ hoạt tính IBD</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4">
                              {item.ibdLabs?.diseaseActivity || '-'}
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    {(selectedPatient.primaryCategory === 'ibs' || selectedPatient.primaryCategory === 'mixed') && (
                      <>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Thang phân Bristol</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4 font-bold">
                              {item.ibsLabs?.bristolStoolScale ? `Type ${item.ibsLabs.bristolStoolScale}` : '-'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Điểm IBS-SSS</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4 font-bold">
                              {item.ibsLabs?.ibssScore !== undefined ? item.ibsLabs.ibssScore : '-'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Số lần đi ngoài / ngày</td>
                          {chronologicalHistory.map((item) => (
                            <td key={item.id} className="py-2.5 px-4">
                              {item.ibsLabs?.stoolFrequencyPerDay !== undefined ? `${item.ibsLabs.stoolFrequencyPerDay} lần` : '-'}
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Đơn thuốc</td>
                      {chronologicalHistory.map((item) => (
                        <td key={item.id} className="py-2.5 px-4 text-[11px]">
                          {item.medicationChanges && item.medicationChanges.length > 0 ? (
                            <ul className="list-disc list-inside space-y-0.5">
                              {item.medicationChanges.map((m, idx) => (
                                <li key={idx} className="truncate max-w-[160px]">{m}</li>
                              ))}
                            </ul>
                          ) : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
