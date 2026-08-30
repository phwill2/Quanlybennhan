import React, { useState, useMemo } from 'react';
import { PatientRecord, DiseaseCategory, Gender } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Droplets, 
  Flame, 
  Zap, 
  Activity, 
  Layers, 
  Calendar, 
  User, 
  FileText,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp
} from 'lucide-react';

interface PatientListProps {
  patients: PatientRecord[];
  activeCategoryFilter: 'all' | DiseaseCategory;
  setActiveCategoryFilter: (cat: 'all' | DiseaseCategory) => void;
  onOpenNewPatient: () => void;
  onViewPatient: (patient: PatientRecord) => void;
  onEditPatient: (patient: PatientRecord) => void;
  onDeletePatient: (patientId: string) => void;
  onViewTimeline?: (patientCode: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  activeCategoryFilter,
  setActiveCategoryFilter,
  onOpenNewPatient,
  onViewPatient,
  onEditPatient,
  onDeletePatient,
  onViewTimeline,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | Gender>('all');
  const [labFilter, setLabFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'age_desc'>('date_desc');

  // Filtered & Sorted Patients
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // 1. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = patient.fullName.toLowerCase().includes(q);
        const matchCode = patient.patientCode?.toLowerCase().includes(q);
        const matchDiag = patient.specificDiagnosis.toLowerCase().includes(q);
        const matchPhone = patient.phone?.toLowerCase().includes(q);
        const matchDoc = patient.doctorInCharge?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDiag && !matchPhone && !matchDoc) {
          return false;
        }
      }

      // 2. Category
      if (activeCategoryFilter !== 'all' && patient.primaryCategory !== activeCategoryFilter) {
        return false;
      }

      // 3. Gender
      if (genderFilter !== 'all' && patient.gender !== genderFilter) {
        return false;
      }

      // 4. Lab Abnormality filter
      if (labFilter === 'high_alt_ast') {
        const alt = patient.liverLabs?.alt || 0;
        const ast = patient.liverLabs?.ast || 0;
        if (alt <= 40 && ast <= 40) return false;
      } else if (labFilter === 'high_fib4') {
        const cat = patient.liverLabs?.fib4Category;
        const score = patient.liverLabs?.fib4Score || 0;
        if (cat !== 'Cao (F3-F4)' && score < 2.67) return false;
      } else if (labFilter === 'high_calprotectin') {
        const cal = patient.ibdLabs?.fecalCalprotectin || 0;
        if (cal <= 200) return false;
      } else if (labFilter === 'anemia') {
        const hb = patient.ibdLabs?.hemoglobin || 0;
        if (hb === 0 || hb >= 11.5) return false;
      } else if (labFilter === 'ibs_severe') {
        const ibss = patient.ibsLabs?.ibssScore || 0;
        if (ibss < 300 && patient.ibsLabs?.ibssSeverity !== 'Nặng (>=300)') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return b.admissionDate.localeCompare(a.admissionDate);
      if (sortBy === 'date_asc') return a.admissionDate.localeCompare(b.admissionDate);
      if (sortBy === 'name_asc') return a.fullName.localeCompare(b.fullName, 'vi');
      if (sortBy === 'age_desc') return b.age - a.age;
      return 0;
    });
  }, [patients, searchQuery, activeCategoryFilter, genderFilter, labFilter, sortBy]);

  const getCategoryBadge = (cat: DiseaseCategory) => {
    switch (cat) {
      case 'liver':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <Droplets className="h-3 w-3" />
            Gan Mật
          </span>
        );
      case 'ibd':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <Flame className="h-3 w-3" />
            IBD (Viêm ruột)
          </span>
        );
      case 'ibs':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Zap className="h-3 w-3" />
            IBS (Ruột kích thích)
          </span>
        );
      case 'mixed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <Layers className="h-3 w-3" />
            Bệnh Phối Hợp
          </span>
        );
    }
  };

  const getPrimaryLabBadge = (patient: PatientRecord) => {
    if (patient.primaryCategory === 'liver' || patient.liverLabs) {
      const fib4 = patient.liverLabs?.fib4Score;
      const alt = patient.liverLabs?.alt;
      if (fib4) {
        return (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
            fib4 > 2.67 ? 'bg-rose-100 text-rose-800' : fib4 > 1.3 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            FIB-4: {fib4} {alt ? `(ALT ${alt})` : ''}
          </span>
        );
      }
    }
    
    if (patient.primaryCategory === 'ibd' || patient.ibdLabs) {
      const cal = patient.ibdLabs?.fecalCalprotectin;
      if (cal !== undefined) {
        return (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
            cal > 200 ? 'bg-rose-100 text-rose-800 font-bold' : cal > 50 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            Calprotectin: {cal} µg/g
          </span>
        );
      }
    }

    if (patient.primaryCategory === 'ibs' || patient.ibsLabs) {
      const subtype = patient.ibsLabs?.romeIVSubtype;
      const bristol = patient.ibsLabs?.bristolStoolScale;
      if (subtype) {
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-800">
            {subtype} {bristol ? `(Bristol Type ${bristol})` : ''}
          </span>
        );
      }
    }

    return <span className="text-xs text-slate-400">-</span>;
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Controls Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Danh Sách Hồ Sơ Bệnh Nhân
            </h2>
            <p className="text-xs text-slate-400">
              Tìm kiếm, lọc nâng cao và theo dõi cận lâm sàng chuyên sâu Tiêu hóa - Gan mật
            </p>
          </div>

          <button
            id="btn-add-patient-list"
            onClick={onOpenNewPatient}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Hồ Sơ Bệnh Nhân</span>
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            id="filter-cat-all"
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeCategoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả ({patients.length})
          </button>

          <button
            id="filter-cat-liver"
            onClick={() => setActiveCategoryFilter('liver')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'liver'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Droplets className="h-3.5 w-3.5" />
            Bệnh Gan ({patients.filter(p => p.primaryCategory === 'liver').length})
          </button>

          <button
            id="filter-cat-ibd"
            onClick={() => setActiveCategoryFilter('ibd')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'ibd'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            IBD - Viêm Ruột ({patients.filter(p => p.primaryCategory === 'ibd').length})
          </button>

          <button
            id="filter-cat-ibs"
            onClick={() => setActiveCategoryFilter('ibs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'ibs'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            IBS - Ruột Kích Thích ({patients.filter(p => p.primaryCategory === 'ibs').length})
          </button>

          <button
            id="filter-cat-mixed"
            onClick={() => setActiveCategoryFilter('mixed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategoryFilter === 'mixed'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Phối Hợp ({patients.filter(p => p.primaryCategory === 'mixed').length})
          </button>
        </div>

        {/* Search & Select Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              id="input-patient-search"
              type="text"
              placeholder="Tìm theo tên, mã BN, chẩn đoán..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50"
            />
          </div>

          {/* Gender filter */}
          <div>
            <select
              id="select-gender-filter"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as 'all' | Gender)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả giới tính</option>
              <option value="male">Nam giới</option>
              <option value="female">Nữ giới</option>
            </select>
          </div>

          {/* Lab Anomaly filter */}
          <div>
            <select
              id="select-lab-filter"
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả xét nghiệm</option>
              <option value="high_alt_ast">⚡ Men gan tăng (AST/ALT &gt; 40)</option>
              <option value="high_calprotectin">🔥 Calprotectin cao (&gt; 200 µg/g)</option>
              <option value="high_fib4">⚠️ FIB-4 Nguy cơ cao (F3-F4)</option>
              <option value="anemia">🩸 Thiếu máu (Hb &lt; 11.5 g/dL)</option>
              <option value="ibs_severe">⚡ IBS mức độ nặng</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              id="select-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date_desc">Ngày khám mới nhất</option>
              <option value="date_asc">Ngày khám cũ nhất</option>
              <option value="name_asc">Tên bệnh nhân A-Z</option>
              <option value="age_desc">Tuổi từ cao đến thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Clear Filter Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>
          Hiển thị <strong className="text-slate-800">{filteredPatients.length}</strong> / {patients.length} bệnh nhân
        </span>
        {(searchQuery || activeCategoryFilter !== 'all' || genderFilter !== 'all' || labFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategoryFilter('all');
              setGenderFilter('all');
              setLabFilter('all');
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Patient Table (Desktop) & Cards (Mobile) */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Không tìm thấy bệnh nhân nào</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Không có kết quả phù hợp với từ khoá hoặc điều kiện lọc xét nghiệm hiện tại.
          </p>
          <button
            onClick={onOpenNewPatient}
            className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            <Plus className="h-4 w-4" />
            Thêm bệnh nhân mới
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Mã BN</th>
                  <th className="py-3.5 px-4">Họ Tên & Tuổi</th>
                  <th className="py-3.5 px-4">Nhóm Bệnh</th>
                  <th className="py-3.5 px-4">Chẩn Đoán Chi Tiết</th>
                  <th className="py-3.5 px-4">Xét Nghiệm Nổi Bật</th>
                  <th className="py-3.5 px-4">Ngày Khám</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(patient => (
                  <tr 
                    key={patient.id} 
                    id={`patient-row-${patient.id}`}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => onViewPatient(patient)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-bold text-slate-700">
                      {patient.patientCode}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{patient.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        {patient.age} tuổi • {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getCategoryBadge(patient.primaryCategory)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 max-w-xs truncate" title={patient.specificDiagnosis}>
                        {patient.specificDiagnosis}
                      </div>
                      {patient.secondaryDiagnosis && (
                        <div className="text-[11px] text-slate-400 max-w-xs truncate" title={patient.secondaryDiagnosis}>
                          + {patient.secondaryDiagnosis}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPrimaryLabBadge(patient)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {patient.admissionDate}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {onViewTimeline && (
                          <button
                            id={`btn-timeline-${patient.id}`}
                            onClick={() => onViewTimeline(patient.patientCode)}
                            title="Xem diễn tiến qua từng đợt tái khám"
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <TrendingUp className="h-4 w-4" />
                            <span className="hidden xl:inline">Diễn tiến</span>
                            {patient.visits && patient.visits.length > 0 && (
                              <span className="bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded-full text-[10px]">
                                {patient.visits.length}
                              </span>
                            )}
                          </button>
                        )}
                        <button
                          id={`btn-view-${patient.id}`}
                          onClick={() => onViewPatient(patient)}
                          title="Xem chi tiết & In phiếu"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-edit-${patient.id}`}
                          onClick={() => onEditPatient(patient)}
                          title="Chỉnh sửa hồ sơ"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-delete-${patient.id}`}
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xoá hồ sơ bệnh nhân "${patient.fullName}" (${patient.patientCode})?`)) {
                              onDeletePatient(patient.id);
                            }
                          }}
                          title="Xoá hồ sơ"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
