import React, { useState, useEffect } from 'react';
import { 
  PatientRecord, 
  DiseaseCategory, 
  Gender, 
  LiverLabData, 
  IBDLabData, 
  IBSLabData,
  BristolStoolType 
} from '../types';
import { 
  X, 
  Save, 
  Droplets, 
  Flame, 
  Zap, 
  User, 
  FileText, 
  Pill, 
  Calculator, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Link2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  calculateFIB4, 
  calculateAPRI, 
  interpretCalprotectin, 
  BRISTOL_STOOL_SCALE,
  LAB_REFERENCE_RANGES 
} from '../utils/clinicalCalculators';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: Partial<PatientRecord>) => void;
  initialData?: PatientRecord | null;
  generatedCode: string;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  generatedCode,
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'liver' | 'ibd' | 'ibs' | 'treatment'>('admin');

  // Admin form state
  const [patientCode, setPatientCode] = useState(initialData?.patientCode || generatedCode);
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [age, setAge] = useState<number | ''>(initialData?.age ?? 35);
  const [gender, setGender] = useState<Gender>(initialData?.gender || 'male');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [admissionDate, setAdmissionDate] = useState(
    initialData?.admissionDate || new Date().toISOString().split('T')[0]
  );
  const [primaryCategory, setPrimaryCategory] = useState<DiseaseCategory>(
    initialData?.primaryCategory || 'liver'
  );
  const [specificDiagnosis, setSpecificDiagnosis] = useState(
    initialData?.specificDiagnosis || 'Viêm gan B mạn (CHB)'
  );
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState(
    initialData?.secondaryDiagnosis || ''
  );
  const [doctorInCharge, setDoctorInCharge] = useState(
    initialData?.doctorInCharge || 'Bác sĩ Đỗ Trung Hiếu'
  );

  // Liver labs state
  const [liverLabs, setLiverLabs] = useState<LiverLabData>(initialData?.liverLabs || {});

  // IBD labs state
  const [ibdLabs, setIbdLabs] = useState<IBDLabData>(initialData?.ibdLabs || {});

  // IBS evaluation active toggle (false for liver/IBD by default)
  const [hasIbsEvaluation, setHasIbsEvaluation] = useState<boolean>(() => {
    if (!initialData) return false;
    return Boolean(
      (initialData.primaryCategory === 'ibs' || initialData.primaryCategory === 'mixed' || initialData.ibsLabs) &&
      initialData.ibsLabs?.romeIVSubtype &&
      initialData.ibsLabs.romeIVSubtype !== 'Bình thường (Không mắc IBS)'
    );
  });

  // IBS labs state (empty by default for new patient and liver patients)
  const [ibsLabs, setIbsLabs] = useState<IBSLabData>(() => {
    if (initialData?.ibsLabs && initialData.ibsLabs.romeIVSubtype && initialData.ibsLabs.romeIVSubtype !== 'Bình thường (Không mắc IBS)') {
      return initialData.ibsLabs;
    }
    return {};
  });

  // Treatment state
  const [treatmentNotes, setTreatmentNotes] = useState(initialData?.treatmentNotes || '');
  const [medicationsStr, setMedicationsStr] = useState(initialData?.medications?.join('\n') || '');
  const [dietaryPlan, setDietaryPlan] = useState(initialData?.dietaryPlan || '');
  const [followUpDate, setFollowUpDate] = useState(initialData?.followUpDate || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Reset or initialize when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setPatientCode(initialData.patientCode);
      setFullName(initialData.fullName);
      setAge(initialData.age);
      setGender(initialData.gender);
      setPhone(initialData.phone || '');
      setAddress(initialData.address || '');
      setAdmissionDate(initialData.admissionDate);
      setPrimaryCategory(initialData.primaryCategory);
      setSpecificDiagnosis(initialData.specificDiagnosis);
      setSecondaryDiagnosis(initialData.secondaryDiagnosis || '');
      setDoctorInCharge(initialData.doctorInCharge || '');
      setLiverLabs(initialData.liverLabs || {});
      setIbdLabs(initialData.ibdLabs || {});
      
      const hasIbs = Boolean(
        (initialData.primaryCategory === 'ibs' || initialData.primaryCategory === 'mixed' || initialData.ibsLabs) &&
        initialData.ibsLabs?.romeIVSubtype &&
        initialData.ibsLabs.romeIVSubtype !== 'Bình thường (Không mắc IBS)'
      );
      setHasIbsEvaluation(hasIbs);
      setIbsLabs(hasIbs && initialData.ibsLabs ? initialData.ibsLabs : {});

      setTreatmentNotes(initialData.treatmentNotes || '');
      setMedicationsStr(initialData.medications?.join('\n') || '');
      setDietaryPlan(initialData.dietaryPlan || '');
      setFollowUpDate(initialData.followUpDate || '');
      setNotes(initialData.notes || '');
    } else {
      setPatientCode(generatedCode);
      setFullName('');
      setAge(35);
      setGender('male');
      setPhone('');
      setAddress('');
      setAdmissionDate(new Date().toISOString().split('T')[0]);
      setPrimaryCategory('liver');
      setSpecificDiagnosis('Viêm gan B mạn (CHB)');
      setSecondaryDiagnosis('');
      setDoctorInCharge('Bác sĩ Đỗ Trung Hiếu');
      setLiverLabs({ ast: 45, alt: 55, platelets: 220 });
      setIbdLabs({});
      // For new patient (defaults to Liver), do NOT enable IBS evaluation!
      setHasIbsEvaluation(false);
      setIbsLabs({});
      setTreatmentNotes('');
      setMedicationsStr('');
      setDietaryPlan('');
      setFollowUpDate('');
      setNotes('');
      setActiveTab('admin');
    }
  }, [initialData, generatedCode, isOpen]);

  // Compute live FIB-4 and APRI
  const fib4Result = calculateFIB4(
    typeof age === 'number' ? age : 35,
    liverLabs.ast,
    liverLabs.alt,
    liverLabs.platelets
  );

  const apriResult = calculateAPRI(liverLabs.ast, liverLabs.platelets);

  // Compute live Calprotectin Interpretation
  const calprotectinResult = interpretCalprotectin(ibdLabs.fecalCalprotectin);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Vui lòng nhập họ và tên bệnh nhân');
      setActiveTab('admin');
      return;
    }

    const calculatedLiverLabs: LiverLabData = {
      ...liverLabs,
      fib4Score: fib4Result.score,
      fib4Category: fib4Result.category,
      apriScore: apriResult.score,
    };

    const medications = medicationsStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Partial<PatientRecord> = {
      id: initialData?.id || `pat-${Date.now()}`,
      patientCode: patientCode.trim() || generatedCode,
      fullName: fullName.trim(),
      age: typeof age === 'number' ? age : 0,
      gender,
      phone: phone.trim(),
      address: address.trim(),
      admissionDate,
      primaryCategory,
      specificDiagnosis: specificDiagnosis.trim(),
      secondaryDiagnosis: secondaryDiagnosis.trim(),
      doctorInCharge: doctorInCharge.trim(),
      liverLabs: primaryCategory === 'liver' || primaryCategory === 'mixed' || Object.keys(liverLabs).length > 0 ? calculatedLiverLabs : undefined,
      ibdLabs: primaryCategory === 'ibd' || primaryCategory === 'mixed' || Object.keys(ibdLabs).length > 0 ? ibdLabs : undefined,
      ibsLabs: (hasIbsEvaluation && ibsLabs.romeIVSubtype && ibsLabs.romeIVSubtype !== 'Bình thường (Không mắc IBS)') ? ibsLabs : undefined,
      treatmentNotes: treatmentNotes.trim(),
      medications,
      dietaryPlan: dietaryPlan.trim(),
      followUpDate,
      notes: notes.trim(),
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight">
              {initialData ? 'Chỉnh Sửa Hồ Sơ Bệnh Nhân' : 'Tiếp Nhận Hồ Sơ & Nhập Xét Nghiệm Mới'}
            </h3>
            <p className="text-xs text-slate-400">
              Mã hồ sơ: <span className="font-mono text-indigo-300 font-semibold">{patientCode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 overflow-x-auto scrollbar-none gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="h-4 w-4" />
            <span>1. Hành Chính & Chẩn Đoán</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('liver')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === 'liver'
                ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Droplets className="h-4 w-4 text-amber-500" />
            <span>2. Xét Nghiệm Gan Mật</span>
            {primaryCategory === 'liver' && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ibd')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === 'ibd'
                ? 'bg-white text-teal-700 shadow-xs border border-teal-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Flame className="h-4 w-4 text-teal-500" />
            <span>3. Xét Nghiệm IBD (Viêm Ruột)</span>
            {primaryCategory === 'ibd' && (
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ibs')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === 'ibs'
                ? 'bg-white text-rose-700 shadow-xs border border-rose-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="h-4 w-4 text-rose-500" />
            <span>4. Đánh Giá IBS</span>
            {hasIbsEvaluation && ibsLabs.romeIVSubtype && ibsLabs.romeIVSubtype !== 'Bình thường (Không mắc IBS)' ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                {ibsLabs.romeIVSubtype}
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500">
                Bình thường
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('treatment')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === 'treatment'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Pill className="h-4 w-4 text-indigo-500" />
            <span>5. Điều Trị & Ghi Chú</span>
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ADMIN & GENERAL DIAGNOSIS */}
          {activeTab === 'admin' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã Bệnh Nhân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientCode}
                    onChange={(e) => setPatientCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và Tên Bệnh Nhân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tuổi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giới Tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày Khám / Nhập Viện <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Địa Chỉ / Tỉnh Thành
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Ba Đình, Hà Nội"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Disease Specialty Category */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Nhóm Bệnh Chính (Phân loại chuyên khoa) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                    primaryCategory === 'liver'
                      ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="primaryCategory"
                      value="liver"
                      checked={primaryCategory === 'liver'}
                      onChange={() => {
                        setPrimaryCategory('liver');
                        setHasIbsEvaluation(false);
                        setIbsLabs({});
                        if (specificDiagnosis.includes('IBS') || specificDiagnosis.includes('Crohn')) {
                          setSpecificDiagnosis('Viêm gan B mạn (CHB)');
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 text-sky-700 font-bold text-sm">
                      <Droplets className="h-4 w-4" />
                      <span>Bệnh Gan Mật</span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">Viêm gan B/C, Xơ gan, MASLD</span>
                  </label>

                  <label className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                    primaryCategory === 'ibd'
                      ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="primaryCategory"
                      value="ibd"
                      checked={primaryCategory === 'ibd'}
                      onChange={() => {
                        setPrimaryCategory('ibd');
                        setHasIbsEvaluation(false);
                        setIbsLabs({});
                        if (!specificDiagnosis.includes('Crohn') && !specificDiagnosis.includes('đại tràng')) {
                          setSpecificDiagnosis("Bệnh Crohn (Crohn's Disease)");
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold text-sm">
                      <Flame className="h-4 w-4" />
                      <span>Viêm Ruột (IBD)</span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">Crohn & Viêm loét đại tràng (UC)</span>
                  </label>

                  <label className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                    primaryCategory === 'ibs'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="primaryCategory"
                      value="ibs"
                      checked={primaryCategory === 'ibs'}
                      onChange={() => {
                        setPrimaryCategory('ibs');
                        setHasIbsEvaluation(true);
                        if (!ibsLabs.romeIVSubtype || ibsLabs.romeIVSubtype === 'Bình thường (Không mắc IBS)') {
                          setIbsLabs({
                            romeIVSubtype: 'IBS-D',
                            bristolStoolScale: 6,
                            stoolFrequencyPerDay: 3,
                            painRelievedAfterDefecation: true,
                            bloatingSeverity: 'Vừa',
                          });
                        }
                        if (!specificDiagnosis.includes('IBS')) {
                          setSpecificDiagnosis('IBS thể tiêu chảy (IBS-D)');
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold text-sm">
                      <Zap className="h-4 w-4" />
                      <span>Ruột Kích Thích (IBS)</span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">Rome IV: IBS-D, IBS-C, IBS-M</span>
                  </label>

                  <label className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                    primaryCategory === 'mixed'
                      ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="primaryCategory"
                      value="mixed"
                      checked={primaryCategory === 'mixed'}
                      onChange={() => {
                        setPrimaryCategory('mixed');
                        setHasIbsEvaluation(true);
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 text-purple-700 font-bold text-sm">
                      <Calculator className="h-4 w-4" />
                      <span>Bệnh Phối Hợp</span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">Mắc đồng thời nhiều bệnh</span>
                  </label>
                </div>
              </div>

              {/* Diagnosis Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chẩn Đoán Xác Định <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Viêm gan B mạn / Bệnh Crohn / IBS-D"
                    value={specificDiagnosis}
                    onChange={(e) => setSpecificDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chẩn Đoán Phụ / Bệnh Kèm Theo
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tăng huyết áp, ĐTĐ typ 2, Trào ngược GERD"
                    value={secondaryDiagnosis}
                    onChange={(e) => setSecondaryDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bác Sĩ / Đơn Vị Phụ Trách
                </label>
                <input
                  type="text"
                  placeholder="VD: Bác sĩ Đỗ Trung Hiếu"
                  value={doctorInCharge}
                  onChange={(e) => setDoctorInCharge(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LIVER LAB DATA */}
          {activeTab === 'liver' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Realtime FIB-4 & APRI Calculator Banner */}
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-sky-600" />
                    <h4 className="text-sm font-bold text-sky-900">
                      Tính Điểm Xơ Hóa Gan Tự Động (FIB-4 & APRI)
                    </h4>
                  </div>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Tự động tính từ: Tuổi ({age || 0}) × AST ({liverLabs.ast || 0}) / [Tiểu cầu ({liverLabs.platelets || 0}) × √ALT ({liverLabs.alt || 0})]
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-white border border-sky-200 text-center min-w-[120px]">
                    <div className="text-xs text-slate-500 font-medium">Điểm FIB-4</div>
                    <div className="text-lg font-black text-slate-800">
                      {fib4Result.score !== undefined ? fib4Result.score : '--'}
                    </div>
                    {fib4Result.category && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${fib4Result.color}`}>
                        {fib4Result.category}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-sky-200 text-center min-w-[100px]">
                    <div className="text-xs text-slate-500 font-medium">Chỉ số APRI</div>
                    <div className="text-lg font-black text-slate-800">
                      {apriResult.score !== undefined ? apriResult.score : '--'}
                    </div>
                  </div>
                </div>
              </div>

              {fib4Result.interpretation && (
                <div className="text-xs text-slate-600 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <strong>Ý nghĩa lâm sàng:</strong> {fib4Result.interpretation}
                </div>
              )}

              {/* Lab Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    AST / SGOT (U/L)
                  </label>
                  <input
                    type="number"
                    placeholder="Tham chiếu: 10-40"
                    value={liverLabs.ast ?? ''}
                    onChange={(e) => setLiverLabs({ ...liverLabs, ast: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ALT / SGPT (U/L)
                  </label>
                  <input
                    type="number"
                    placeholder="Tham chiếu: 10-40"
                    value={liverLabs.alt ?? ''}
                    onChange={(e) => setLiverLabs({ ...liverLabs, alt: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Lượng Tiểu Cầu (x10^9/L)
                  </label>
                  <input
                    type="number"
                    placeholder="Tham chiếu: 150-450"
                    value={liverLabs.platelets ?? ''}
                    onChange={(e) => setLiverLabs({ ...liverLabs, platelets: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GGT (U/L)
                  </label>
                  <input
                    type="number"
                    placeholder="Tham chiếu: 9-50"
                    value={liverLabs.ggt ?? ''}
                    onChange={(e) => setLiverLabs({ ...liverLabs, ggt: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bilirubin Toàn Phần (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Tham chiếu: 0.2-1.2"
                    value={liverLabs.bilirubinTotal ?? ''}
                    onChange={(e) => setLiverLabs({ ...liverLabs, bilirubinTotal: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bilirubin Trực Tiếp (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Tham chiếu: 0.0-0.3"
                    value={liverLabs.bilirubinDirect ?? ''}
                    onChange={(e) => setLiverLabs({ ...liverLabs, bilirubinDirect: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Albumin Máu (g/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Tham chiếu: 3.5-5.2"
                    value={liverLabs.albumin ?? ''}
                    onChange={(e) => setLiverLabs({ ...liverLabs, albumin: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chỉ Số Đông Máu (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Tham chiếu: 0.8-1.2"
                    value={liverLabs.inr ?? ''}
                    onChange={(e) => setLiverLabs({ ...liverLabs, inr: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Specialty Liver Tests (FibroScan, Virus DNA/RNA, AFP) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Xét Nghiệm Chuyên Khoa Sâu & FibroScan
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      FibroScan Độ Cứng (kPa)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="F0: <7.0, F4: >12.5"
                      value={liverLabs.fibroscanKpa ?? ''}
                      onChange={(e) => setLiverLabs({ ...liverLabs, fibroscanKpa: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      FibroScan Mức Gan Mỡ (CAP dB/m)
                    </label>
                    <input
                      type="number"
                      placeholder="S0: <240, S3: >290"
                      value={liverLabs.fibroscanCap ?? ''}
                      onChange={(e) => setLiverLabs({ ...liverLabs, fibroscanCap: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      AFP - Alpha Fetoprotein (ng/mL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Bình thường < 10"
                      value={liverLabs.afp ?? ''}
                      onChange={(e) => setLiverLabs({ ...liverLabs, afp: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tải Lượng HBV-DNA (Viêm gan B)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 3.4 x 10^5 IU/mL hoặc < 20 IU/mL"
                      value={liverLabs.hbvDna || ''}
                      onChange={(e) => setLiverLabs({ ...liverLabs, hbvDna: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tải Lượng HCV-RNA (Viêm gan C)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Dưới ngưỡng phát hiện"
                      value={liverLabs.hcvRna || ''}
                      onChange={(e) => setLiverLabs({ ...liverLabs, hcvRna: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* AUTOIMMUNE LIVER WORKUP (Khảo sát Bệnh Gan Tự Miễn) */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <ShieldAlert className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-950">
                          Yếu Tố Bệnh Gan Tự Miễn (Autoimmune Liver Disease Workup)
                        </h4>
                        <p className="text-xs text-indigo-700">
                          Kháng thể tự miễn, Định lượng IgG/IgM, Thang điểm AIH & Sinh thiết gan (AIH / PBC / PSC / Overlap)
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Chuyên khoa Gan Mật
                    </span>
                  </div>

                  {/* Row 1: Thể tự miễn & Điểm chẩn đoán */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phân Loại / Thể Bệnh Gan Tự Miễn
                      </label>
                      <select
                        value={liverLabs.autoimmuneLiverType || ''}
                        onChange={(e) => setLiverLabs({ ...liverLabs, autoimmuneLiverType: (e.target.value as any) || undefined })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="">-- Chưa xác định / Không nghi ngờ --</option>
                        <option value="AIH Type 1">AIH Type 1 (Viêm gan tự miễn Type 1 - ANA / ASMA (+))</option>
                        <option value="AIH Type 2">AIH Type 2 (Viêm gan tự miễn Type 2 - Anti-LKM-1 (+))</option>
                        <option value="PBC (Viêm đường mật tiên phát)">PBC (Viêm đường mật tiên phát - AMA-M2 (+))</option>
                        <option value="PSC (Xơ hóa đường mật)">PSC (Xơ hóa đường mật nguyên phát)</option>
                        <option value="Hội chứng chồng lấp (Overlap)">Hội chứng chồng lấp (Overlap AIH-PBC / AIH-PSC)</option>
                        <option value="Nghi ngờ / Theo dõi">Nghi ngờ bệnh gan tự miễn / Đang theo dõi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Thang Điểm AIH Đơn Giản Hóa (Simplified AIH Score)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 7 điểm (Xác định AIH) hoặc 6 điểm (Nghi ngờ)"
                        value={liverLabs.aihScore || ''}
                        onChange={(e) => setLiverLabs({ ...liverLabs, aihScore: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 2: Kháng thể tự miễn chính */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kháng Thể Kháng Nhân (ANA Titer)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Âm tính, 1:80, 1:160, 1:320..."
                        value={liverLabs.anaTiter || ''}
                        onChange={(e) => setLiverLabs({ ...liverLabs, anaTiter: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kháng Cơ Trơn (ASMA / SMA Titer)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Âm tính, 1:40, 1:80, 1:160..."
                        value={liverLabs.asmaTiter || ''}
                        onChange={(e) => setLiverLabs({ ...liverLabs, asmaTiter: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Anti-LKM-1 (AIH Type 2)
                      </label>
                      <select
                        value={liverLabs.antiLkm1 || 'Chưa làm'}
                        onChange={(e) => setLiverLabs({ ...liverLabs, antiLkm1: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Chưa làm">Chưa làm</option>
                        <option value="Âm tính">Âm tính</option>
                        <option value="Dương tính">Dương tính (+)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: AMA-M2, p-ANCA, Anti-SLA */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        AMA / AMA-M2 (Đặc hiệu PBC)
                      </label>
                      <select
                        value={liverLabs.amaM2 || 'Chưa làm'}
                        onChange={(e) => setLiverLabs({ ...liverLabs, amaM2: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Chưa làm">Chưa làm</option>
                        <option value="Âm tính">Âm tính</option>
                        <option value="Dương tính">Dương tính (+) - Gợi ý PBC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kháng Thể p-ANCA (PSC / AIH)
                      </label>
                      <select
                        value={liverLabs.pAnca || 'Chưa làm'}
                        onChange={(e) => setLiverLabs({ ...liverLabs, pAnca: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Chưa làm">Chưa làm</option>
                        <option value="Âm tính">Âm tính</option>
                        <option value="Dương tính">Dương tính (+)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Anti-SLA/LP
                      </label>
                      <select
                        value={liverLabs.antiSla || 'Chưa làm'}
                        onChange={(e) => setLiverLabs({ ...liverLabs, antiSla: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Chưa làm">Chưa làm</option>
                        <option value="Âm tính">Âm tính</option>
                        <option value="Dương tính">Dương tính (+)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: IgG & IgM Quantitative */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Định Lượng IgG Huyết Thanh (mg/dL)
                        </label>
                        <span className="text-[11px] text-slate-500">Chuẩn: 700 - 1600 mg/dL</span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        placeholder="VD: 1850 (Tăng cao gợi ý AIH)"
                        value={liverLabs.iggLevel ?? ''}
                        onChange={(e) => setLiverLabs({ ...liverLabs, iggLevel: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      />
                      {liverLabs.iggLevel !== undefined && (
                        <p className="text-[11px] mt-1 font-medium">
                          {liverLabs.iggLevel > 1600 ? (
                            <span className="text-rose-600 font-bold">⚠️ IgG tăng cao ({liverLabs.iggLevel} mg/dL) - Tương ứng tiêu chuẩn AIH</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">✓ Trong giới hạn bình thường</span>
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Định Lượng IgM Huyết Thanh (mg/dL)
                        </label>
                        <span className="text-[11px] text-slate-500">Chuẩn: 40 - 230 mg/dL</span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        placeholder="VD: 340 (Tăng gợi ý PBC)"
                        value={liverLabs.igmLevel ?? ''}
                        onChange={(e) => setLiverLabs({ ...liverLabs, igmLevel: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      />
                      {liverLabs.igmLevel !== undefined && (
                        <p className="text-[11px] mt-1 font-medium">
                          {liverLabs.igmLevel > 230 ? (
                            <span className="text-amber-700 font-bold">⚠️ IgM tăng cao ({liverLabs.igmLevel} mg/dL) - Thường gặp trong PBC</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">✓ Trong giới hạn bình thường</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Sinh thiết gan & Ghi chú phác đồ */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kết Quả Sinh Thiết Gan & Mô Bệnh Học (Liver Biopsy Histology)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="VD: Viêm bề mặt tiếp xúc (Interface hepatitis), thâm nhiễm tương bào (plasma cells) quanh khoảng cửa, hoại tử cầu nối..."
                        value={liverLabs.liverBiopsyHistology || ''}
                        onChange={(e) => setLiverLabs({ ...liverLabs, liverBiopsyHistology: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ghi Chú Phác Đồ Ức Chế Miễn Dịch & Theo Dõi Tự Miễn
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Prednisolone 30mg/ngày + Azathioprine 50mg/ngày, kiểm tra lại IgG & men gan sau 4 tuần"
                        value={liverLabs.autoimmuneNotes || ''}
                        onChange={(e) => setLiverLabs({ ...liverLabs, autoimmuneNotes: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IBD LAB DATA */}
          {activeTab === 'ibd' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Calprotectin Banner */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-rose-600" />
                    <h4 className="text-sm font-bold text-rose-900">
                      Chỉ Dấu Calprotectin Phân & Hoạt Tính Viêm Ruột
                    </h4>
                  </div>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Dấu ấn nhạy nhất để theo dõi đợt bùng phát và lành niêm mạc ruột trong IBD.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-rose-200 text-center min-w-[140px]">
                  <div className="text-xs text-slate-500 font-medium">Calprotectin</div>
                  <div className="text-lg font-black text-slate-800">
                    {ibdLabs.fecalCalprotectin !== undefined ? `${ibdLabs.fecalCalprotectin} µg/g` : '--'}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${calprotectinResult.color}`}>
                    {calprotectinResult.category}
                  </span>
                </div>
              </div>

              {/* Lab Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calprotectin Phân (µg/g)
                  </label>
                  <input
                    type="number"
                    placeholder="BT: <50, Viêm: >200"
                    value={ibdLabs.fecalCalprotectin ?? ''}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, fecalCalprotectin: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CRP - Protein Phản Ứng C (mg/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Bình thường < 5"
                    value={ibdLabs.crp ?? ''}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, crp: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tốc Độ Lắng Máu ESR (mm/h)
                  </label>
                  <input
                    type="number"
                    placeholder="Bình thường < 20"
                    value={ibdLabs.esr ?? ''}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, esr: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hemoglobin Hb (g/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Tham chiếu: 12-16"
                    value={ibdLabs.hemoglobin ?? ''}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, hemoglobin: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bạch Cầu WBC (x10^9/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Tham chiếu: 4.0-10.0"
                    value={ibdLabs.wbc ?? ''}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, wbc: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Máu Ẩn Trong Phân (FOBT)
                  </label>
                  <select
                    value={ibdLabs.fobt || 'Chưa làm'}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, fobt: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Chưa làm">Chưa làm</option>
                    <option value="Âm tính">Âm tính (-)</option>
                    <option value="Dương tính">Dương tính (+)</option>
                  </select>
                </div>
              </div>

              {/* Endoscopy and Disease Classification */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Đánh Giá Nội Soi & Mức Độ Hoạt Động
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mức Hoạt Động Bệnh (Disease Activity)
                    </label>
                    <select
                      value={ibdLabs.diseaseActivity || 'Hoạt động vừa'}
                      onChange={(e) => setIbdLabs({ ...ibdLabs, diseaseActivity: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Thuyên giảm (Remission)">Thuyên giảm (Remission)</option>
                      <option value="Hoạt động nhẹ">Hoạt động nhẹ</option>
                      <option value="Hoạt động vừa">Hoạt động vừa</option>
                      <option value="Hoạt động nặng">Hoạt động nặng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vị Trí Tổn Thương (Montreal Classification)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Hồi tràng (L1), Đại tràng trái (E2), Toàn bộ đại tràng (E3)"
                      value={ibdLabs.affectedArea || ''}
                      onChange={(e) => setIbdLabs({ ...ibdLabs, affectedArea: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kết Quả / Điểm Nội Soi (Mayo Endoscopic / SES-CD)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Mayo Endoscopic Subscore 2 (Mất mạch máu, niêm mạc xuất huyết trợt)"
                    value={ibdLabs.endoscopyScore || ''}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, endoscopyScore: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-teal-600" />
                      <span>Link Nội Soi (Hình ảnh / Video / PACS / Google Drive)</span>
                    </span>
                    {ibdLabs.endoscopyLink && (
                      <a
                        href={ibdLabs.endoscopyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 underline"
                      >
                        <span>Mở xem thử</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    placeholder="VD: https://drive.google.com/file/... hoặc link lưu trữ ảnh nội soi"
                    value={ibdLabs.endoscopyLink || ''}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, endoscopyLink: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Đính kèm đường link dẫn đến album ảnh nội soi, clip nội soi đại tràng hoặc file kết quả giải phẫu bệnh.
                  </p>
                </div>
              </div>

              {/* Lao Ruột (Intestinal Tuberculosis) Exclusion Section */}
              <div className={`p-4 rounded-2xl border transition-all ${
                ibdLabs.tbExcluded 
                  ? 'bg-emerald-50/80 border-emerald-300' 
                  : 'bg-amber-50/80 border-amber-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={!!ibdLabs.tbExcluded}
                      onChange={(e) => setIbdLabs({ ...ibdLabs, tbExcluded: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          Đã loại trừ lao ruột (Intestinal Tuberculosis Excluded)
                        </span>
                        {ibdLabs.tbExcluded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Đã loại trừ lao ruột
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                            Chưa loại trừ lao ruột
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        <strong className="text-slate-800">Cảnh báo lâm sàng:</strong> Bắt buộc loại trừ lao ruột trước khi khởi động phác đồ ức chế miễn dịch (Corticoid liều cao, Azathioprine) hoặc chế phẩm sinh học (Anti-TNF, Infliximab) để tránh bùng phát lao toàn thể nguy kịch.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Ghi chú tầm soát lao (X-quang phổi, Quantiferon-TB / IGRA, GeneXpert, Giải phẫu bệnh u hạt...)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Quantiferon-TB âm tính, GeneXpert mô sinh thiết âm tính, không có u hạt bã đậu"
                    value={ibdLabs.tbNotes || ''}
                    onChange={(e) => setIbdLabs({ ...ibdLabs, tbNotes: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IBS ASSESSMENT */}
          {activeTab === 'ibs' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* IBS EVALUATION TOGGLE / STATUS SELECTOR */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Đánh Giá Hội Chứng Ruột Kích Thích (IBS Workup)
                      </h4>
                      <p className="text-xs text-slate-500">
                        {primaryCategory === 'liver' 
                          ? 'Mặc định cho ca bệnh gan mật: Tiêu hóa bình thường (Bỏ qua đánh giá IBS)' 
                          : 'Đánh giá rối loạn nhu động ruột chức năng theo tiêu chuẩn Rome IV'}
                      </p>
                    </div>
                  </div>

                  {hasIbsEvaluation && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasIbsEvaluation(false);
                        setIbsLabs({});
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Đặt về: Bình thường (Bỏ đánh giá IBS)</span>
                    </button>
                  )}
                </div>

                {/* 2 Main Choice Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label
                    onClick={() => {
                      setHasIbsEvaluation(false);
                      setIbsLabs({});
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 select-none ${
                      !hasIbsEvaluation
                        ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="hasIbsEvaluationRadio"
                      checked={!hasIbsEvaluation}
                      onChange={() => {
                        setHasIbsEvaluation(false);
                        setIbsLabs({});
                      }}
                      className="sr-only"
                    />
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Bình thường / Bỏ qua đánh giá IBS
                        </span>
                        {!hasIbsEvaluation && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                            Đang áp dụng
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Bệnh nhân đại tiện bình thường, không đau bụng mạn tính. <strong>Không lưu dữ liệu IBS</strong> vào hồ sơ (phù hợp cho ca bệnh gan).
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => {
                      setHasIbsEvaluation(true);
                      if (!ibsLabs.romeIVSubtype || ibsLabs.romeIVSubtype === 'Bình thường (Không mắc IBS)') {
                        setIbsLabs({
                          romeIVSubtype: 'IBS-D',
                          bristolStoolScale: 6,
                          stoolFrequencyPerDay: 3,
                          painRelievedAfterDefecation: true,
                          bloatingSeverity: 'Vừa',
                        });
                      }
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 select-none ${
                      hasIbsEvaluation
                        ? 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="hasIbsEvaluationRadio"
                      checked={hasIbsEvaluation}
                      onChange={() => {
                        setHasIbsEvaluation(true);
                        if (!ibsLabs.romeIVSubtype || ibsLabs.romeIVSubtype === 'Bình thường (Không mắc IBS)') {
                          setIbsLabs({
                            romeIVSubtype: 'IBS-D',
                            bristolStoolScale: 6,
                            stoolFrequencyPerDay: 3,
                            painRelievedAfterDefecation: true,
                            bloatingSeverity: 'Vừa',
                          });
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Đánh giá Ruột kích thích (Rome IV & Bristol)
                        </span>
                        {hasIbsEvaluation && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            Đang đánh giá
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Bệnh nhân có đau bụng tái diễn $\ge 1$ ngày/tuần kèm rối loạn đại tiện (tiêu chảy, táo bón hoặc thể hỗn hợp).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {!hasIbsEvaluation ? (
                /* Reassuring Banner for Normal / Skipped IBS */
                <div className="p-8 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-3 animate-in fade-in duration-150">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-emerald-950">
                      Bệnh nhân có chức năng đường ruột bình thường
                    </h5>
                    <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                      Hồ sơ ca bệnh này sẽ <strong>hoàn toàn không chứa dữ liệu IBS</strong>. Danh sách theo dõi và bảng diễn tiến sẽ ưu tiên chỉ số chuyên khoa <strong>Gan Mật</strong> (Men gan AST/ALT, Điểm FIB-4, Tải lượng virus HBV/HCV, Bệnh gan tự miễn).
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHasIbsEvaluation(true);
                        setIbsLabs({
                          romeIVSubtype: 'IBS-D',
                          bristolStoolScale: 6,
                          stoolFrequencyPerDay: 3,
                          painRelievedAfterDefecation: true,
                          bloatingSeverity: 'Vừa',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-800 rounded-xl text-xs font-semibold shadow-2xs transition"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-600" />
                      <span>Kích hoạt đánh giá IBS nếu bệnh nhân có triệu chứng tiêu chảy / táo bón kèm theo</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Full Rome IV Subtype selector */
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Phân Thể Hội Chứng Ruột Kích Thích (Tiêu Chuẩn Rome IV)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setHasIbsEvaluation(false);
                          setIbsLabs({});
                        }}
                        className="text-xs text-slate-500 hover:text-rose-600 font-semibold"
                      >
                        Bỏ chọn / Đặt về bình thường
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'IBS-D', label: 'IBS-D (Tiêu chảy)', desc: '>25% phân lỏng (Bristol 6-7), <25% phân cứng' },
                        { id: 'IBS-C', label: 'IBS-C (Táo bón)', desc: '>25% phân cứng (Bristol 1-2), <25% phân lỏng' },
                        { id: 'IBS-M', label: 'IBS-M (Hỗn hợp)', desc: '>25% phân cứng VÀ >25% phân lỏng' },
                        { id: 'IBS-U', label: 'IBS-U (Không phân loại)', desc: 'Không đủ tiêu chuẩn các nhóm trên' },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`p-3 rounded-xl border cursor-pointer transition ${
                            ibsLabs.romeIVSubtype === item.id
                              ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="romeIVSubtype"
                            value={item.id}
                            checked={ibsLabs.romeIVSubtype === item.id}
                            onChange={() => setIbsLabs({ ...ibsLabs, romeIVSubtype: item.id as any })}
                            className="sr-only"
                          />
                          <div className="font-bold text-sm text-amber-800">{item.label}</div>
                          <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                        </label>
                      ))}
                    </div>
                  </div>

              {/* Bristol Stool Scale Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Thang Đo Hình Dạng Phân Bristol (Bristol Stool Scale 1-7)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {([1, 2, 3, 4, 5, 6, 7] as BristolStoolType[]).map((type) => {
                    const item = BRISTOL_STOOL_SCALE[type];
                    const isSelected = ibsLabs.bristolStoolScale === type;
                    return (
                      <div
                        key={type}
                        onClick={() => setIbsLabs({ ...ibsLabs, bristolStoolScale: type })}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded font-bold ${item.iconColor}`}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                        </div>
                        <div className="font-semibold text-slate-800 mt-1.5">{item.vietnameseTitle}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{item.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* IBS Symptoms and Severity */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Đánh Giá Mức Độ Nghiêm Trọng (IBS-SSS) & Triệu Chứng
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số Ngày Đau Bụng / Tháng
                    </label>
                    <input
                      type="number"
                      placeholder="Tiêu chuẩn Rome IV: >=4 ngày"
                      value={ibsLabs.abdominalPainDaysPerMonth ?? ''}
                      onChange={(e) => setIbsLabs({ ...ibsLabs, abdominalPainDaysPerMonth: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tần Suất Đi Ngoài (Lần/Ngày)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="VD: 3 lần/ngày"
                      value={ibsLabs.stoolFrequencyPerDay ?? ''}
                      onChange={(e) => setIbsLabs({ ...ibsLabs, stoolFrequencyPerDay: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Điểm Mức Độ Nghiêm Trọng (IBS-SSS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      placeholder="Thang điểm 0 - 500"
                      value={ibsLabs.ibssScore ?? ''}
                      onChange={(e) => setIbsLabs({ ...ibsLabs, ibssScore: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Calprotectin Loại Trừ IBD (µg/g)
                    </label>
                    <input
                      type="number"
                      placeholder="Ở IBS thường < 50"
                      value={ibsLabs.fecalCalprotectinExclusion ?? ''}
                      onChange={(e) => setIbsLabs({ ...ibsLabs, fecalCalprotectinExclusion: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kháng Thể Anti-tTG IgA (Loại trừ Celiac)
                    </label>
                    <select
                      value={ibsLabs.antiTtgIgA || 'Âm tính'}
                      onChange={(e) => setIbsLabs({ ...ibsLabs, antiTtgIgA: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Âm tính">Âm tính (-)</option>
                      <option value="Dương tính">Dương tính (+)</option>
                      <option value="Chưa làm">Chưa làm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mức Độ Chướng Bụng / Đầy Hơi
                    </label>
                    <select
                      value={ibsLabs.bloatingSeverity || 'Vừa'}
                      onChange={(e) => setIbsLabs({ ...ibsLabs, bloatingSeverity: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Không">Không chướng</option>
                      <option value="Nhẹ">Nhẹ</option>
                      <option value="Vừa">Vừa</option>
                      <option value="Nặng">Nặng</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

          {/* TAB 5: TREATMENT & NOTES */}
          {activeTab === 'treatment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kế Hoạch / Phác Đồ Điều Trị
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Điều trị kháng virus TAF 25mg / Phác đồ sinh học Adalimumab / Thuốc chống co thắt kết hợp chế độ ăn Low-FODMAP..."
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Danh Sách Thuốc Kê Đơn (Mỗi dòng 1 loại thuốc)
                </label>
                <textarea
                  rows={3}
                  placeholder="VD:&#10;Tenofovir Alafenamide (TAF) 25mg x 1 viên/ngày&#10;Mesalamine 800mg x 4 viên/ngày&#10;Mebeverine 200mg x 2 viên/ngày"
                  value={medicationsStr}
                  onChange={(e) => setMedicationsStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hướng Dẫn Chế Độ Ăn Uống & Dinh Dưỡng
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Chế độ ăn Low-FODMAP, kiêng rượu bia, hạn chế dầu mỡ..."
                    value={dietaryPlan}
                    onChange={(e) => setDietaryPlan(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hẹn Tái Khám
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />

                  <label className="block text-xs font-semibold text-slate-700 mt-2 mb-1">
                    Ghi Chú Tiến Triển
                  </label>
                  <input
                    type="text"
                    placeholder="Ghi chú lâm sàng bổ sung..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Huỷ Bỏ
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== 'treatment' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: Array<'admin' | 'liver' | 'ibd' | 'ibs' | 'treatment'> = ['admin', 'liver', 'ibd', 'ibs', 'treatment'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                >
                  Tiếp Tục →
                </button>
              )}

              <button
                type="submit"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl text-xs sm:text-sm shadow-xs transition"
              >
                <Save className="h-4 w-4" />
                <span>Lưu Hồ Sơ Bệnh Nhân</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
