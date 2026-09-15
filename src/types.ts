export type DiseaseCategory = 'liver' | 'ibd' | 'ibs' | 'mixed';

export type Gender = 'male' | 'female' | 'other';

export type LiverDiagnosis =
  | 'Viêm gan B mạn (CHB)'
  | 'Viêm gan C mạn (CHC)'
  | 'Xơ gan do rượu'
  | 'Xơ gan mất bù'
  | 'Xơ gan còn bù'
  | 'Gan nhiễm mỡ không do rượu (MASLD/NAFLD)'
  | 'Viêm gan nhiễm mỡ (MASH/NASH)'
  | 'Ung thư biểu mô tế bào gan (HCC)'
  | 'Viêm gan tự miễn (AIH)'
  | 'Viêm đường mật xơ hóa nguyên phát (PSC)'
  | 'Khác';

export type IBDDiagnosis =
  | 'Bệnh Crohn (Crohn\'s Disease)'
  | 'Viêm loét đại trực tràng chảy máu (Ulcerative Colitis - UC)'
  | 'Viêm đại tràng chưa phân loại (IBD-U)';

export type IBSDiagnosis =
  | 'IBS thể tiêu chảy (IBS-D)'
  | 'IBS thể táo bón (IBS-C)'
  | 'IBS thể hỗn hợp (IBS-M)'
  | 'IBS thể không phân loại (IBS-U)';

export type BristolStoolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ClinicalProgression =
  | 'Thuyên giảm hoàn toàn (Deep Remission)'
  | 'Cải thiện rõ rệt'
  | 'Cải thiện một phần'
  | 'Ổn định'
  | 'Không đáp ứng / Kháng trị'
  | 'Bùng phát cấp / Nặng hơn';

export interface FollowUpVisit {
  id: string;
  visitDate: string; // YYYY-MM-DD
  visitNumber?: number; // 1, 2, 3...
  visitTitle: string; // VD: Tái khám định kỳ sau 1 tháng, Đánh giá sau phác đồ TAF 3 tháng...
  clinicalSymptoms?: string; // Triệu chứng lâm sàng ghi nhận tại buổi khám
  progression: ClinicalProgression;
  liverLabs?: Partial<LiverLabData>;
  ibdLabs?: Partial<IBDLabData>;
  ibsLabs?: Partial<IBSLabData>;
  medicationChanges?: string[]; // Điều chỉnh thuốc, liều dùng
  dietaryAdvice?: string; // Hướng dẫn dinh dưỡng
  doctorNotes?: string;
  doctorInCharge?: string;
  nextFollowUpDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiverLabData {
  ast?: number; // U/L (SGOT) - Normal ~10-40
  alt?: number; // U/L (SGPT) - Normal ~10-40
  ggt?: number; // U/L - Normal ~9-48
  alp?: number; // U/L - Alkaline Phosphatase ~44-147
  bilirubinTotal?: number; // mg/dL or µmol/L (standard mg/dL ~0.2-1.2)
  bilirubinDirect?: number; // mg/dL ~0.0-0.3
  albumin?: number; // g/dL ~3.5-5.2
  proteinTotal?: number; // g/dL ~6.0-8.3
  platelets?: number; // x10^9/L ~150-450
  inr?: number; // INR ~0.8-1.2
  afp?: number; // ng/mL - Alpha Fetoprotein < 10
  hbvDna?: string; // Tải lượng virus HBV (VD: 2.5 x 10^5 IU/mL hoặc < 20 IU/mL)
  hcvRna?: string; // Tải lượng virus HCV
  fibroscanKpa?: number; // Độ cứng gan (kPa) - F0-F4
  fibroscanCap?: number; // Mức độ mỡ (dB/m) - S0-S3
  // Calculated:
  fib4Score?: number;
  fib4Category?: 'Thấp (F0-F1)' | 'Trung gian (F2)' | 'Cao (F3-F4)';
  apriScore?: number;
}

export interface IBDLabData {
  fecalCalprotectin?: number; // µg/g - <50 bình thường, 50-200 nghi ngờ, >200 viêm hoạt động mạnh
  crp?: number; // mg/L - Normal < 5
  esr?: number; // mm/1h - Normal < 20 (Nam), < 30 (Nữ)
  hemoglobin?: number; // g/dL - Normal ~12-16
  wbc?: number; // x10^9/L - Normal ~4.0-10.0
  ferritin?: number; // ng/mL - Normal ~30-300
  fobt?: 'Dương tính' | 'Âm tính' | 'Chưa làm'; // Máu ẩn trong phân
  endoscopyScore?: string; // Mayo Endoscopic 0-3 hoặc SES-CD
  endoscopyLink?: string; // Link kết quả / hình ảnh nội soi tiêu hóa (URL, Google Drive, PACS, video)
  tbExcluded?: boolean; // Đã loại trừ lao ruột hay chưa (Intestinal Tuberculosis excluded)
  tbNotes?: string; // Ghi chú kết quả tầm soát lao (X-quang ngực, GeneXpert, IGRA/Quantiferon, mô bệnh học...)
  diseaseActivity?: 'Thuyên giảm (Remission)' | 'Hoạt động nhẹ' | 'Hoạt động vừa' | 'Hoạt động nặng';
  affectedArea?: string; // Hồi tràng, Đại tràng trái, Toàn bộ đại tràng, Trực tràng...
}

export interface IBSLabData {
  romeIVSubtype?: 'IBS-D' | 'IBS-C' | 'IBS-M' | 'IBS-U';
  bristolStoolScale?: BristolStoolType;
  stoolFrequencyPerDay?: number; // Số lần đi ngoài / ngày
  abdominalPainDaysPerMonth?: number; // Số ngày đau bụng / tháng (tiêu chuẩn Rome IV: >= 1 ngày/tuần trong 3 tháng)
  painRelievedAfterDefecation?: boolean; // Đau giảm sau khi đi ngoài
  bloatingSeverity?: 'Không' | 'Nhẹ' | 'Vừa' | 'Nặng'; // Chướng bụng đầy hơi
  ibssScore?: number; // Thang điểm mức độ nghiêm trọng IBS-SSS (0-500)
  ibssSeverity?: 'Thuyên giảm (<75)' | 'Nhẹ (75-174)' | 'Vừa (175-299)' | 'Nặng (>=300)';
  fecalCalprotectinExclusion?: number; // µg/g để loại trừ IBD (thường < 50)
  antiTtgIgA?: 'Âm tính' | 'Dương tính' | 'Chưa làm'; // Loại trừ bệnh Celiac
  stoolCultureParasite?: 'Âm tính' | 'Dương tính' | 'Chưa làm';
}

export interface PatientRecord {
  id: string;
  patientCode: string; // Mã bệnh nhân: BN-00123
  fullName: string;
  age: number;
  gender: Gender;
  phone?: string;
  address?: string;
  admissionDate: string; // YYYY-MM-DD
  primaryCategory: DiseaseCategory;
  specificDiagnosis: string;
  secondaryDiagnosis?: string;
  liverLabs?: LiverLabData;
  ibdLabs?: IBDLabData;
  ibsLabs?: IBSLabData;
  treatmentNotes?: string;
  medications?: string[];
  dietaryPlan?: string;
  doctorInCharge?: string;
  followUpDate?: string;
  notes?: string;
  visits?: FollowUpVisit[]; // Diễn tiến qua từng đợt tái khám
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  category: 'all' | DiseaseCategory;
  diagnosis: string;
  gender: 'all' | Gender;
  ageRange: [number, number];
  dateFrom: string;
  dateTo: string;
  labAbnormalityFilter: 'all' | 'high_alt_ast' | 'high_calprotectin' | 'high_fib4' | 'anemia' | 'ibs_severe';
  sortBy: 'date_desc' | 'date_asc' | 'name_asc' | 'age_desc' | 'code_asc';
}
