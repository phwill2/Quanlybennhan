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
  Calendar
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

  // IBS labs state
  const [ibsLabs, setIbsLabs] = useState<IBSLabData>(initialData?.ibsLabs || {
    romeIVSubtype: 'IBS-D',
    bristolStoolScale: 6,
    stoolFrequencyPerDay: 3,
    painRelievedAfterDefecation: true,
    bloatingSeverity: 'Vừa',
    antiTtgIgA: 'Âm tính',
    stoolCultureParasite: 'Âm tính'
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
      setIbsLabs(initialData.ibsLabs || {
        romeIVSubtype: 'IBS-D',
        bristolStoolScale: 6,
        stoolFrequencyPerDay: 3,
        painRelievedAfterDefecation: true,
        bloatingSeverity: 'Vừa',
      });
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
      setIbsLabs({
        romeIVSubtype: 'IBS-D',
        bristolStoolScale: 6,
        stoolFrequencyPerDay: 3,
        painRelievedAfterDefecation: true,
        bloatingSeverity: 'Vừa',
      });
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
      ibsLabs: primaryCategory === 'ibs' || primaryCategory === 'mixed' || Object.keys(ibsLabs).length > 0 ? ibsLabs : undefined,
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
            <span>4. Đánh Giá IBS (Ruột Kích Thích)</span>
            {primaryCategory === 'ibs' && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
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
                      onChange={() => setPrimaryCategory('liver')}
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
                      onChange={() => setPrimaryCategory('ibd')}
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
                      onChange={() => setPrimaryCategory('ibs')}
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
                      onChange={() => setPrimaryCategory('mixed')}
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
              </div>
            </div>
          )}

          {/* TAB 4: IBS ASSESSMENT */}
          {activeTab === 'ibs' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Rome IV Subtype selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Phân Thể Hội Chứng Ruột Kích Thích (Tiêu Chuẩn Rome IV)
                </label>
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
