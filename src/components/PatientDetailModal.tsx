import React from 'react';
import { PatientRecord } from '../types';
import { 
  X, 
  Printer, 
  Edit3, 
  Droplets, 
  Flame, 
  Zap, 
  Layers, 
  Calendar, 
  Phone, 
  MapPin, 
  UserCheck, 
  Pill, 
  AlertCircle,
  FileText,
  Activity,
  CheckCircle2,
  Link2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  LAB_REFERENCE_RANGES, 
  checkLabStatus, 
  BRISTOL_STOOL_SCALE 
} from '../utils/clinicalCalculators';

interface PatientDetailModalProps {
  patient: PatientRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (patient: PatientRecord) => void;
  onViewTimeline?: (patientCode: string) => void;
  onAddVisit?: (patient: PatientRecord) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  isOpen,
  onClose,
  onEdit,
  onViewTimeline,
  onAddVisit,
}) => {
  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'liver': return 'Chuyên Khoa Gan Mật';
      case 'ibd': return 'Bệnh Viêm Ruột Mạn (IBD)';
      case 'ibs': return 'Hội Chứng Ruột Kích Thích (IBS)';
      case 'mixed': return 'Bệnh Lý Phối Hợp';
      default: return cat;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none">
        {/* Header - Not printed controls */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-mono font-bold">
              {patient.primaryCategory === 'liver' ? <Droplets className="h-5 w-5 text-amber-400" /> :
               patient.primaryCategory === 'ibd' ? <Flame className="h-5 w-5 text-teal-400" /> :
               patient.primaryCategory === 'ibs' ? <Zap className="h-5 w-5 text-rose-400" /> : <Layers className="h-5 w-5 text-purple-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">{patient.fullName}</h3>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 text-indigo-300 rounded-md border border-indigo-500/30">
                  {patient.patientCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {patient.age} tuổi • {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'} • Ngày khám: {patient.admissionDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="In phiếu tóm tắt ca bệnh"
            >
              <Printer className="h-4 w-4" />
              <span>In Phiếu</span>
            </button>

            <button
              onClick={() => onEdit(patient)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <Edit3 className="h-4 w-4" />
              <span>Chỉnh Sửa</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Printable Header Notice */}
          <div className="hidden print:block text-center border-b pb-4 mb-4">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">
              PHIẾU TÓM TẮT BỆNH ÁN & KẾT QUẢ XÉT NGHIỆM TIÊU HOÁ - GAN MẬT
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Phân Hệ Thống Kê & Quản Lý Dữ Liệu Lâm Sàng (Gan Mật - IBD - IBS)
            </p>
          </div>

          {/* Patient Administrative Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Họ và Tên</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">{patient.fullName}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Tuổi / Giới Tính</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {patient.age} tuổi • {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Số Điện Thoại</div>
              <div className="font-semibold text-slate-800 mt-0.5">{patient.phone || 'Chưa cập nhật'}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Bác Sĩ Phụ Trách</div>
              <div className="font-semibold text-slate-800 mt-0.5">{patient.doctorInCharge || 'Chưa phân công'}</div>
            </div>
          </div>

          {/* Primary Diagnosis & Risk Highlight */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                Chẩn Đoán Xác Định
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                {getCategoryTitle(patient.primaryCategory)}
              </span>
            </div>
            <div className="text-base font-bold text-slate-900">{patient.specificDiagnosis}</div>
            {patient.secondaryDiagnosis && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Chẩn đoán kèm theo:</span> {patient.secondaryDiagnosis}
              </div>
            )}
          </div>

          {/* Specialty Clinical Scores Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Liver FIB-4 */}
            {(patient.primaryCategory === 'liver' || patient.liverLabs?.fib4Score) && (
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-sky-900">
                  <span>Chỉ Số Xơ Hóa FIB-4</span>
                  <Droplets className="h-4 w-4 text-sky-600" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-slate-800">
                    {patient.liverLabs?.fib4Score ?? '--'}
                  </div>
                  {patient.liverLabs?.fib4Category && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      {patient.liverLabs.fib4Category}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600">
                  APRI: <strong>{patient.liverLabs?.apriScore ?? '--'}</strong> • FibroScan:{' '}
                  <strong>{patient.liverLabs?.fibroscanKpa ? `${patient.liverLabs.fibroscanKpa} kPa` : '--'}</strong>
                </div>
              </div>
            )}

            {/* IBD Calprotectin */}
            {(patient.primaryCategory === 'ibd' || patient.ibdLabs?.fecalCalprotectin !== undefined) && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>Calprotectin & Mức Hoạt Động</span>
                  <Flame className="h-4 w-4 text-rose-600" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-slate-800">
                    {patient.ibdLabs?.fecalCalprotectin ? `${patient.ibdLabs.fecalCalprotectin} µg/g` : '--'}
                  </div>
                  {patient.ibdLabs?.diseaseActivity && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {patient.ibdLabs.diseaseActivity}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600">
                  CRP: <strong>{patient.ibdLabs?.crp ? `${patient.ibdLabs.crp} mg/L` : '--'}</strong> • ESR:{' '}
                  <strong>{patient.ibdLabs?.esr ? `${patient.ibdLabs.esr} mm/h` : '--'}</strong>
                </div>

                <div className="pt-2 mt-2 border-t border-rose-200/60 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    {patient.ibdLabs?.tbExcluded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Đã loại trừ lao ruột
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        <ShieldAlert className="h-3 w-3 text-amber-600" />
                        Chưa loại trừ lao ruột
                      </span>
                    )}
                  </div>

                  {patient.ibdLabs?.endoscopyLink && (
                    <a
                      href={patient.ibdLabs.endoscopyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-white/80 px-2 py-0.5 rounded-lg border border-rose-200 shadow-2xs hover:bg-white transition"
                    >
                      <Link2 className="h-3 w-3" />
                      <span>Xem ảnh nội soi</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* IBS Rome IV */}
            {(patient.primaryCategory === 'ibs' || patient.ibsLabs?.romeIVSubtype) && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Phân Thể IBS (Rome IV)</span>
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                <div className="my-2">
                  <div className="text-xl font-black text-slate-800">
                    {patient.ibsLabs?.romeIVSubtype || 'IBS'}
                  </div>
                  {patient.ibsLabs?.bristolStoolScale && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Bristol Type {patient.ibsLabs.bristolStoolScale} (
                      {BRISTOL_STOOL_SCALE[patient.ibsLabs.bristolStoolScale]?.vietnameseTitle})
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600">
                  IBS-SSS: <strong>{patient.ibsLabs?.ibssScore ?? '--'}</strong> • Đau bụng:{' '}
                  <strong>{patient.ibsLabs?.abdominalPainDaysPerMonth ?? '--'} ngày/tháng</strong>
                </div>
              </div>
            )}
          </div>

          {/* Complete Lab Results Detailed Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" />
              <span>Bảng Chi Tiết Kết Quả Xét Nghiệm</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Tên Xét Nghiệm</th>
                    <th className="py-2.5 px-3">Kết Quả</th>
                    <th className="py-2.5 px-3">Khoảng Tham Chiếu</th>
                    <th className="py-2.5 px-3">Đánh Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Liver tests */}
                  {patient.liverLabs?.ast !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">AST / SGOT</td>
                      <td className="py-2 px-3 font-bold">{patient.liverLabs.ast} U/L</td>
                      <td className="py-2 px-3 text-slate-500">10 - 40 U/L</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('ast', patient.liverLabs.ast).color}`}>
                          {checkLabStatus('ast', patient.liverLabs.ast).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.liverLabs?.alt !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">ALT / SGPT</td>
                      <td className="py-2 px-3 font-bold">{patient.liverLabs.alt} U/L</td>
                      <td className="py-2 px-3 text-slate-500">10 - 40 U/L</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('alt', patient.liverLabs.alt).color}`}>
                          {checkLabStatus('alt', patient.liverLabs.alt).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.liverLabs?.ggt !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">GGT</td>
                      <td className="py-2 px-3 font-bold">{patient.liverLabs.ggt} U/L</td>
                      <td className="py-2 px-3 text-slate-500">9 - 50 U/L</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('ggt', patient.liverLabs.ggt).color}`}>
                          {checkLabStatus('ggt', patient.liverLabs.ggt).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.liverLabs?.platelets !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Tiểu Cầu (Platelets)</td>
                      <td className="py-2 px-3 font-bold">{patient.liverLabs.platelets} x10^9/L</td>
                      <td className="py-2 px-3 text-slate-500">150 - 450 x10^9/L</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('platelets', patient.liverLabs.platelets).color}`}>
                          {checkLabStatus('platelets', patient.liverLabs.platelets).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.liverLabs?.bilirubinTotal !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Bilirubin Toàn Phần</td>
                      <td className="py-2 px-3 font-bold">{patient.liverLabs.bilirubinTotal} mg/dL</td>
                      <td className="py-2 px-3 text-slate-500">0.2 - 1.2 mg/dL</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('bilirubinTotal', patient.liverLabs.bilirubinTotal).color}`}>
                          {checkLabStatus('bilirubinTotal', patient.liverLabs.bilirubinTotal).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.liverLabs?.albumin !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Albumin Máu</td>
                      <td className="py-2 px-3 font-bold">{patient.liverLabs.albumin} g/dL</td>
                      <td className="py-2 px-3 text-slate-500">3.5 - 5.2 g/dL</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('albumin', patient.liverLabs.albumin).color}`}>
                          {checkLabStatus('albumin', patient.liverLabs.albumin).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.liverLabs?.afp !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Alpha Fetoprotein (AFP)</td>
                      <td className="py-2 px-3 font-bold">{patient.liverLabs.afp} ng/mL</td>
                      <td className="py-2 px-3 text-slate-500">&lt; 10 ng/mL</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('afp', patient.liverLabs.afp).color}`}>
                          {checkLabStatus('afp', patient.liverLabs.afp).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.liverLabs?.fibroscanKpa !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">FibroScan Độ Cứng Gan</td>
                      <td className="py-2 px-3 font-bold text-sky-700">{patient.liverLabs.fibroscanKpa} kPa</td>
                      <td className="py-2 px-3 text-slate-500">F0-F1: &lt;7.0 kPa</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800">
                          {patient.liverLabs.fibroscanKpa > 12.5 ? 'Xơ hóa F4' : patient.liverLabs.fibroscanKpa > 9.5 ? 'Xơ hóa F3' : 'F0-F2'}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.liverLabs?.hbvDna && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Tải Lượng HBV-DNA</td>
                      <td className="py-2 px-3 font-bold text-sky-700">{patient.liverLabs.hbvDna}</td>
                      <td className="py-2 px-3 text-slate-500">&lt; 20 IU/mL (Ngưỡng âm tính)</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">Đã ghi nhận</span>
                      </td>
                    </tr>
                  )}

                  {/* IBD Tests */}
                  {patient.ibdLabs?.fecalCalprotectin !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Calprotectin Phân</td>
                      <td className="py-2 px-3 font-bold">{patient.ibdLabs.fecalCalprotectin} µg/g</td>
                      <td className="py-2 px-3 text-slate-500">&lt; 50 µg/g</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('fecalCalprotectin', patient.ibdLabs.fecalCalprotectin).color}`}>
                          {checkLabStatus('fecalCalprotectin', patient.ibdLabs.fecalCalprotectin).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.ibdLabs?.crp !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">CRP (Protein C phản ứng)</td>
                      <td className="py-2 px-3 font-bold">{patient.ibdLabs.crp} mg/L</td>
                      <td className="py-2 px-3 text-slate-500">&lt; 5.0 mg/L</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('crp', patient.ibdLabs.crp).color}`}>
                          {checkLabStatus('crp', patient.ibdLabs.crp).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.ibdLabs?.hemoglobin !== undefined && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Hemoglobin (Hb)</td>
                      <td className="py-2 px-3 font-bold">{patient.ibdLabs.hemoglobin} g/dL</td>
                      <td className="py-2 px-3 text-slate-500">12.0 - 16.5 g/dL</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${checkLabStatus('hemoglobin', patient.ibdLabs.hemoglobin).color}`}>
                          {checkLabStatus('hemoglobin', patient.ibdLabs.hemoglobin).label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {patient.ibdLabs?.endoscopyScore && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Nội Soi Đại Trực Tràng</td>
                      <td colSpan={3} className="py-2 px-3 text-slate-700 font-medium">
                        {patient.ibdLabs.endoscopyScore}
                      </td>
                    </tr>
                  )}
                  {patient.ibdLabs?.endoscopyLink && (
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Link Kết Quả Nội Soi</td>
                      <td colSpan={3} className="py-2 px-3">
                        <a
                          href={patient.ibdLabs.endoscopyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-800 underline bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Mở xem hình ảnh / clip nội soi trực tuyến</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  )}
                  {patient.ibdLabs && (patient.ibdLabs.tbExcluded !== undefined || patient.ibdLabs.tbNotes) && (
                    <tr className={patient.ibdLabs.tbExcluded ? 'bg-emerald-50/40' : 'bg-amber-50/40'}>
                      <td className="py-2 px-3 font-medium text-slate-800">Tầm Soát Lao Ruột</td>
                      <td colSpan={3} className="py-2 px-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {patient.ibdLabs.tbExcluded ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              Đã loại trừ lao ruột (Đủ điều kiện an toàn dùng Corticoid / Biologics)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                              Chưa loại trừ lao ruột (Cần tầm soát trước khi dùng ức chế miễn dịch)
                            </span>
                          )}
                          {patient.ibdLabs.tbNotes && (
                            <span className="text-xs text-slate-600 italic">
                              — {patient.ibdLabs.tbNotes}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Follow-Up Progression Section */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {patient.visits?.length || 0}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    Diễn Tiến Qua Các Đợt Tái Khám ({patient.visits?.length || 0} đợt)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Theo dõi sự thay đổi triệu chứng và xét nghiệm qua từng lần tái khám
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                {onAddVisit && (
                  <button
                    onClick={() => {
                      onClose();
                      onAddVisit(patient);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <span>+ Thêm Đợt Khám</span>
                  </button>
                )}

                {onViewTimeline && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewTimeline(patient.patientCode);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <span>Xem Biểu Đồ & Dòng Thời Gian &rarr;</span>
                  </button>
                )}
              </div>
            </div>

            {patient.visits && patient.visits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {patient.visits.map((vis, vIdx) => (
                  <div
                    key={vis.id}
                    className="p-3 bg-white rounded-xl border border-indigo-100/80 shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {vis.visitDate}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        Đợt {vis.visitNumber || vIdx + 1}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-800 line-clamp-1">
                      {vis.visitTitle}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-700">
                      {vis.progression}
                    </div>
                    {vis.clinicalSymptoms && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {vis.clinicalSymptoms}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white/70 rounded-xl border border-indigo-100 text-center text-xs text-slate-500">
                Chưa có đợt tái khám nào được lưu. Hãy thêm đợt tái khám đầu tiên để theo dõi diễn tiến của bệnh nhân này.
              </div>
            )}
          </div>

          {/* Treatment & Prescription Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                <FileText className="h-4 w-4 text-teal-600" />
                <span>Kế Hoạch Điều Trị & Dinh Dưỡng</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-line">
                {patient.treatmentNotes || 'Chưa có ghi chú phác đồ điều trị.'}
              </p>
              {patient.dietaryPlan && (
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Chế độ ăn:</span> {patient.dietaryPlan}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                <Pill className="h-4 w-4 text-teal-600" />
                <span>Đơn Thuốc Đang Sử Dụng</span>
              </div>
              {patient.medications && patient.medications.length > 0 ? (
                <ul className="space-y-1">
                  {patient.medications.map((med, idx) => (
                    <li key={idx} className="text-xs font-mono bg-white p-1.5 rounded border border-slate-200 text-slate-800 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                      <span>{med}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">Chưa có đơn thuốc kê trong hồ sơ.</p>
              )}

              {patient.followUpDate && (
                <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Hẹn tái khám: {patient.followUpDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-400">
            Hồ sơ cập nhật lần cuối: {new Date(patient.updatedAt || patient.createdAt).toLocaleString('vi-VN')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(patient)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl text-xs transition"
            >
              Chỉnh Sửa
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
