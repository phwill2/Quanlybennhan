import React, { useState, useEffect } from 'react';
import { PatientRecord, FollowUpVisit, ClinicalProgression, LiverLabData, IBDLabData, IBSLabData, BristolStoolType } from '../types';
import { 
  X, 
  Save, 
  Calendar, 
  Activity, 
  Droplets, 
  Flame, 
  Zap, 
  Pill, 
  FileText, 
  TrendingUp,
  AlertCircle,
  Link2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  calculateFIB4, 
  calculateAPRI, 
  interpretCalprotectin, 
  BRISTOL_STOOL_SCALE 
} from '../utils/clinicalCalculators';

interface AddVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientRecord | null;
  onSaveVisit: (patientId: string, visit: FollowUpVisit) => void;
  initialVisit?: FollowUpVisit | null;
}

export const AddVisitModal: React.FC<AddVisitModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSaveVisit,
  initialVisit,
}) => {
  if (!isOpen || !patient) return null;

  const isEditing = !!initialVisit;
  const existingVisitsCount = patient.visits?.length || 0;
  const nextVisitNumber = isEditing ? (initialVisit.visitNumber || 1) : existingVisitsCount + 1;

  const [visitDate, setVisitDate] = useState<string>(
    initialVisit?.visitDate || new Date().toISOString().split('T')[0]
  );
  const [visitTitle, setVisitTitle] = useState<string>(
    initialVisit?.visitTitle || `Tái khám đợt ${nextVisitNumber} (Định kỳ)`
  );
  const [progression, setProgression] = useState<ClinicalProgression>(
    initialVisit?.progression || 'Cải thiện rõ rệt'
  );
  const [clinicalSymptoms, setClinicalSymptoms] = useState<string>(
    initialVisit?.clinicalSymptoms || ''
  );
  const [doctorNotes, setDoctorNotes] = useState<string>(
    initialVisit?.doctorNotes || ''
  );
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(
    initialVisit?.nextFollowUpDate || ''
  );
  const [doctorInCharge, setDoctorInCharge] = useState<string>(
    initialVisit?.doctorInCharge || patient.doctorInCharge || 'Bác sĩ Đỗ Trung Hiếu'
  );

  // Medications
  const [medicationList, setMedicationList] = useState<string[]>(
    initialVisit?.medicationChanges || patient.medications || []
  );
  const [medInput, setMedInput] = useState<string>('');

  // Liver labs
  const [ast, setAst] = useState<number | undefined>(initialVisit?.liverLabs?.ast ?? patient.liverLabs?.ast);
  const [alt, setAlt] = useState<number | undefined>(initialVisit?.liverLabs?.alt ?? patient.liverLabs?.alt);
  const [ggt, setGgt] = useState<number | undefined>(initialVisit?.liverLabs?.ggt ?? patient.liverLabs?.ggt);
  const [bilirubinTotal, setBilirubinTotal] = useState<number | undefined>(initialVisit?.liverLabs?.bilirubinTotal ?? patient.liverLabs?.bilirubinTotal);
  const [albumin, setAlbumin] = useState<number | undefined>(initialVisit?.liverLabs?.albumin ?? patient.liverLabs?.albumin);
  const [platelets, setPlatelets] = useState<number | undefined>(initialVisit?.liverLabs?.platelets ?? patient.liverLabs?.platelets);
  const [inr, setInr] = useState<number | undefined>(initialVisit?.liverLabs?.inr ?? patient.liverLabs?.inr);
  const [hbvDna, setHbvDna] = useState<string>(initialVisit?.liverLabs?.hbvDna || patient.liverLabs?.hbvDna || '');
  const [hcvRna, setHcvRna] = useState<string>(initialVisit?.liverLabs?.hcvRna || patient.liverLabs?.hcvRna || '');
  const [fibroscanKpa, setFibroscanKpa] = useState<number | undefined>(initialVisit?.liverLabs?.fibroscanKpa ?? patient.liverLabs?.fibroscanKpa);

  // IBD labs
  const [fecalCalprotectin, setFecalCalprotectin] = useState<number | undefined>(initialVisit?.ibdLabs?.fecalCalprotectin ?? patient.ibdLabs?.fecalCalprotectin);
  const [crp, setCrp] = useState<number | undefined>(initialVisit?.ibdLabs?.crp ?? patient.ibdLabs?.crp);
  const [esr, setEsr] = useState<number | undefined>(initialVisit?.ibdLabs?.esr ?? patient.ibdLabs?.esr);
  const [hemoglobin, setHemoglobin] = useState<number | undefined>(initialVisit?.ibdLabs?.hemoglobin ?? patient.ibdLabs?.hemoglobin);
  const [wbc, setWbc] = useState<number | undefined>(initialVisit?.ibdLabs?.wbc ?? patient.ibdLabs?.wbc);
  const [diseaseActivity, setDiseaseActivity] = useState<any>(initialVisit?.ibdLabs?.diseaseActivity || patient.ibdLabs?.diseaseActivity || 'Thuyên giảm (Remission)');
  const [endoscopyScore, setEndoscopyScore] = useState<string>(initialVisit?.ibdLabs?.endoscopyScore || patient.ibdLabs?.endoscopyScore || '');
  const [endoscopyLink, setEndoscopyLink] = useState<string>(initialVisit?.ibdLabs?.endoscopyLink || patient.ibdLabs?.endoscopyLink || '');
  const [tbExcluded, setTbExcluded] = useState<boolean>(initialVisit?.ibdLabs?.tbExcluded ?? patient.ibdLabs?.tbExcluded ?? false);
  const [tbNotes, setTbNotes] = useState<string>(initialVisit?.ibdLabs?.tbNotes || patient.ibdLabs?.tbNotes || '');

  // IBS labs
  const [romeIVSubtype, setRomeIVSubtype] = useState<any>(initialVisit?.ibsLabs?.romeIVSubtype || patient.ibsLabs?.romeIVSubtype || 'IBS-D');
  const [bristolStoolScale, setBristolStoolScale] = useState<BristolStoolType | undefined>(initialVisit?.ibsLabs?.bristolStoolScale ?? patient.ibsLabs?.bristolStoolScale);
  const [stoolFrequencyPerDay, setStoolFrequencyPerDay] = useState<number | undefined>(initialVisit?.ibsLabs?.stoolFrequencyPerDay ?? patient.ibsLabs?.stoolFrequencyPerDay);
  const [abdominalPainDaysPerMonth, setAbdominalPainDaysPerMonth] = useState<number | undefined>(initialVisit?.ibsLabs?.abdominalPainDaysPerMonth ?? patient.ibsLabs?.abdominalPainDaysPerMonth);
  const [bloatingSeverity, setBloatingSeverity] = useState<any>(initialVisit?.ibsLabs?.bloatingSeverity || patient.ibsLabs?.bloatingSeverity || 'Nhẹ');
  const [ibssScore, setIbssScore] = useState<number | undefined>(initialVisit?.ibsLabs?.ibssScore ?? patient.ibsLabs?.ibssScore);

  // Recalculated FIB-4 and APRI
  const fib4Result = calculateFIB4(patient.age, ast, alt, platelets);
  const apriResult = calculateAPRI(ast, platelets);
  const calprotectinResult = interpretCalprotectin(fecalCalprotectin);

  const handleAddMedication = () => {
    if (medInput.trim()) {
      setMedicationList([...medicationList, medInput.trim()]);
      setMedInput('');
    }
  };

  const handleRemoveMedication = (idx: number) => {
    setMedicationList(medicationList.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newVisit: FollowUpVisit = {
      id: initialVisit?.id || `vis-${Date.now()}`,
      visitDate,
      visitNumber: nextVisitNumber,
      visitTitle,
      clinicalSymptoms,
      progression,
      doctorNotes,
      doctorInCharge,
      nextFollowUpDate,
      medicationChanges: medicationList,
      createdAt: initialVisit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attach liver labs if relevant
    if (patient.primaryCategory === 'liver' || patient.primaryCategory === 'mixed' || ast !== undefined || alt !== undefined) {
      newVisit.liverLabs = {
        ast,
        alt,
        ggt,
        bilirubinTotal,
        albumin,
        platelets,
        inr,
        hbvDna,
        hcvRna,
        fibroscanKpa,
        fib4Score: fib4Result.score,
        fib4Category: fib4Result.category,
        apriScore: apriResult.score,
      };
    }

    // Attach IBD labs if relevant
    if (patient.primaryCategory === 'ibd' || patient.primaryCategory === 'mixed' || fecalCalprotectin !== undefined || crp !== undefined || endoscopyLink || tbExcluded) {
      newVisit.ibdLabs = {
        fecalCalprotectin,
        crp,
        esr,
        hemoglobin,
        wbc,
        diseaseActivity,
        endoscopyScore,
        endoscopyLink: endoscopyLink.trim() || undefined,
        tbExcluded,
        tbNotes: tbNotes.trim() || undefined,
      };
    }

    // Attach IBS labs if relevant
    if (patient.primaryCategory === 'ibs' || patient.primaryCategory === 'mixed' || bristolStoolScale !== undefined) {
      newVisit.ibsLabs = {
        romeIVSubtype,
        bristolStoolScale,
        stoolFrequencyPerDay,
        abdominalPainDaysPerMonth,
        bloatingSeverity,
        ibssScore,
      };
    }

    onSaveVisit(patient.id, newVisit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                {isEditing ? 'Chỉnh Sửa Đợt Tái Khám' : `Ghi Nhận Diễn Tiến Tái Khám (Đợt ${nextVisitNumber})`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bệnh nhân: <strong className="text-white">{patient.fullName}</strong> • Mã y tế:{' '}
                <span className="text-indigo-300 font-mono font-semibold">{patient.patientCode}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General Visit Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày Tái Khám *
              </label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu Đề / Lý Do Tái Khám *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Tái khám định kỳ sau 3 tháng TAF, Đánh giá lui bệnh IBD..."
                value={visitTitle}
                onChange={(e) => setVisitTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đánh Giá Tiến Triển Lâm Sàng Tổng Thể *
              </label>
              <select
                value={progression}
                onChange={(e) => setProgression(e.target.value as ClinicalProgression)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Thuyên giảm hoàn toàn (Deep Remission)">🌟 Thuyên giảm hoàn toàn (Deep Remission)</option>
                <option value="Cải thiện rõ rệt">✅ Cải thiện rõ rệt (Significant Improvement)</option>
                <option value="Cải thiện một phần">🔹 Cải thiện một phần (Partial Response)</option>
                <option value="Ổn định">⚖️ Ổn định (Stable)</option>
                <option value="Không đáp ứng / Kháng trị">⚠️ Không đáp ứng / Kháng trị</option>
                <option value="Bùng phát cấp / Nặng hơn">🚨 Bùng phát cấp / Diễn tiến nặng hơn</option>
              </select>
            </div>
          </div>

          {/* Clinical Symptoms Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Triệu Chứng Lâm Sàng & Diễn Biến Cơ Năng</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ghi nhận triệu chứng: hết mệt mỏi, phân thành khuôn, không còn đau bụng hạ sườn phải, số lần đi cầu giảm..."
              value={clinicalSymptoms}
              onChange={(e) => setClinicalSymptoms(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Pathology Specific Lab Entries */}
          {/* 1. LIVER LABS */}
          {(patient.primaryCategory === 'liver' || patient.primaryCategory === 'mixed') && (
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Xét Nghiệm Gan Mật Lần Này
                  </h4>
                </div>
                {fib4Result.score !== undefined && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${fib4Result.color}`}>
                    FIB-4: {fib4Result.score} ({fib4Result.category})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">AST / SGOT (U/L)</label>
                  <input
                    type="number"
                    placeholder="10-40"
                    value={ast ?? ''}
                    onChange={(e) => setAst(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">ALT / SGPT (U/L)</label>
                  <input
                    type="number"
                    placeholder="10-40"
                    value={alt ?? ''}
                    onChange={(e) => setAlt(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">GGT (U/L)</label>
                  <input
                    type="number"
                    placeholder="9-50"
                    value={ggt ?? ''}
                    onChange={(e) => setGgt(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Tiểu cầu (x10^9/L)</label>
                  <input
                    type="number"
                    placeholder="150-450"
                    value={platelets ?? ''}
                    onChange={(e) => setPlatelets(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Bilirubin TP (mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.2-1.2"
                    value={bilirubinTotal ?? ''}
                    onChange={(e) => setBilirubinTotal(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Albumin (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="3.5-5.2"
                    value={albumin ?? ''}
                    onChange={(e) => setAlbumin(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">FibroScan (kPa)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2-75"
                    value={fibroscanKpa ?? ''}
                    onChange={(e) => setFibroscanKpa(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Tải lượng virus</label>
                  <input
                    type="text"
                    placeholder="VD: <20 IU/mL hoặc 1.2x10^3"
                    value={hbvDna}
                    onChange={(e) => setHbvDna(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. IBD LABS */}
          {(patient.primaryCategory === 'ibd' || patient.primaryCategory === 'mixed') && (
            <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-teal-600" />
                  <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Xét Nghiệm Viêm Ruột IBD Lần Này
                  </h4>
                </div>
                {calprotectinResult.category !== 'Chưa xét nghiệm' && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${calprotectinResult.color}`}>
                    Calprotectin: {fecalCalprotectin} µg/g ({calprotectinResult.category})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Calprotectin phân (µg/g)</label>
                  <input
                    type="number"
                    placeholder="<50: BT, >200: Viêm"
                    value={fecalCalprotectin ?? ''}
                    onChange={(e) => setFecalCalprotectin(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">CRP (mg/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="< 5.0"
                    value={crp ?? ''}
                    onChange={(e) => setCrp(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Hemoglobin (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="12.0 - 16.5"
                    value={hemoglobin ?? ''}
                    onChange={(e) => setHemoglobin(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Mức độ hoạt động IBD</label>
                  <select
                    value={diseaseActivity}
                    onChange={(e) => setDiseaseActivity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                  >
                    <option value="Thuyên giảm (Remission)">Thuyên giảm (Remission)</option>
                    <option value="Hoạt động nhẹ">Hoạt động nhẹ</option>
                    <option value="Hoạt động vừa">Hoạt động vừa</option>
                    <option value="Hoạt động nặng">Hoạt động nặng</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Điểm / Kết quả nội soi (Mayo / SES-CD)</label>
                  <input
                    type="text"
                    placeholder="VD: Mayo subscore 1 hoặc SES-CD 4 điểm"
                    value={endoscopyScore}
                    onChange={(e) => setEndoscopyScore(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-teal-600" />
                      <span>Link nội soi đợt này (Ảnh / Video / Drive / PACS)</span>
                    </label>
                    {endoscopyLink && (
                      <a
                        href={endoscopyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 underline"
                      >
                        <span>Mở xem</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={endoscopyLink}
                    onChange={(e) => setEndoscopyLink(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* TB Exclusion Box in Visit */}
              <div className={`p-3 rounded-xl border transition-all ${
                tbExcluded ? 'bg-emerald-50/80 border-emerald-300' : 'bg-amber-50/80 border-amber-300'
              }`}>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tbExcluded}
                    onChange={(e) => setTbExcluded(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        Đã loại trừ lao ruột (Intestinal TB Excluded)
                      </span>
                      {tbExcluded ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Đã loại trừ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                          <ShieldAlert className="h-3 w-3 text-amber-600" />
                          Chưa loại trừ
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Bắt buộc kiểm tra GeneXpert, IGRA, sinh thiết trước khi tăng liều hoặc chỉ định thuốc sinh học Anti-TNF.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 3. IBS LABS */}
          {(patient.primaryCategory === 'ibs' || patient.primaryCategory === 'mixed') && (
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-rose-600" />
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                    Đánh Giá Triệu Chứng Ruột Kích Thích IBS
                  </h4>
                </div>
                {bristolStoolScale && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    Bristol Type {bristolStoolScale} ({BRISTOL_STOOL_SCALE[bristolStoolScale]?.vietnameseTitle})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Thang phân Bristol (1-7)</label>
                  <select
                    value={bristolStoolScale || ''}
                    onChange={(e) => setBristolStoolScale(e.target.value ? Number(e.target.value) as BristolStoolType : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value="">-- Chọn Type (1-7) --</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((t) => (
                      <option key={t} value={t}>
                        Type {t} - {BRISTOL_STOOL_SCALE[t as BristolStoolType].vietnameseTitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Số lần đi ngoài / ngày</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="VD: 1.5 hoặc 4"
                    value={stoolFrequencyPerDay ?? ''}
                    onChange={(e) => setStoolFrequencyPerDay(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Điểm IBS-SSS (0-500)</label>
                  <input
                    type="number"
                    placeholder="<75: Lui bệnh, >300: Nặng"
                    value={ibssScore ?? ''}
                    onChange={(e) => setIbssScore(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Mức độ chướng bụng</label>
                  <select
                    value={bloatingSeverity}
                    onChange={(e) => setBloatingSeverity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-medium"
                  >
                    <option value="Không">Không chướng</option>
                    <option value="Nhẹ">Nhẹ</option>
                    <option value="Vừa">Vừa</option>
                    <option value="Nặng">Nặng</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Prescriptions & Medications */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-indigo-600" />
              <span>Đơn Thuốc & Điều Chỉnh Liều Lượng</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: Duy trì TAF 25mg 1v/ngày, Giảm Prednisolone xuống 10mg..."
                value={medInput}
                onChange={(e) => setMedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMedication();
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
              >
                + Thêm
              </button>
            </div>

            {medicationList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {medicationList.map((med, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-medium"
                  >
                    <span>{med}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(idx)}
                      className="text-indigo-400 hover:text-indigo-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Doctor Notes & Next Follow-Up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lời Dặn Của Bác Sĩ
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú dặn dò tuân thủ thuốc, chế độ ăn, hẹn làm xét nghiệm..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hẹn Ngày Tái Khám Tiếp Theo
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bác Sĩ Khám
                </label>
                <input
                  type="text"
                  value={doctorInCharge}
                  onChange={(e) => setDoctorInCharge(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Cập Nhật Đợt Tái Khám' : 'Lưu Đợt Tái Khám Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
