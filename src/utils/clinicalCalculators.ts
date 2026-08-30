import { BristolStoolType, LiverLabData, IBDLabData, IBSLabData } from '../types';

export interface ReferenceRange {
  min: number;
  max: number;
  unit: string;
  name: string;
  description: string;
}

export const LAB_REFERENCE_RANGES: Record<string, ReferenceRange> = {
  ast: { min: 10, max: 40, unit: 'U/L', name: 'AST (SGOT)', description: 'Men gan AST - Đo mức độ tổn thương tế bào gan' },
  alt: { min: 10, max: 40, unit: 'U/L', name: 'ALT (SGPT)', description: 'Men gan ALT - Đặc hiệu cao cho tổn thương tế bào gan' },
  ggt: { min: 9, max: 50, unit: 'U/L', name: 'GGT', description: 'Men gan GGT - Nhạy với bệnh gan do rượu và tắc mật' },
  alp: { min: 44, max: 147, unit: 'U/L', name: 'ALP', description: 'Phosphatase kiềm - Tăng trong tắc mật, ứ mật' },
  bilirubinTotal: { min: 0.2, max: 1.2, unit: 'mg/dL', name: 'Bilirubin toàn phần', description: 'Sắc tố mật - Tăng gây vàng da/vàng mắt' },
  bilirubinDirect: { min: 0.0, max: 0.3, unit: 'mg/dL', name: 'Bilirubin trực tiếp', description: 'Bilirubin liên hợp' },
  albumin: { min: 3.5, max: 5.2, unit: 'g/dL', name: 'Albumin máu', description: 'Protein do gan tổng hợp - Đánh giá chức năng gan dự trữ' },
  platelets: { min: 150, max: 450, unit: 'x10^9/L', name: 'Số lượng Tiểu cầu', description: 'Giảm <150 gợi ý lách to/tăng áp lực tĩnh mạch cửa trong xơ gan' },
  inr: { min: 0.8, max: 1.2, unit: '', name: 'Chỉ số INR/PT', description: 'Đông máu ngoại sinh - Phản ánh chức năng gan' },
  afp: { min: 0, max: 10, unit: 'ng/mL', name: 'Alpha-Fetoprotein (AFP)', description: 'Chỉ dấu ung thư biểu mô tế bào gan (HCC)' },
  fecalCalprotectin: { min: 0, max: 50, unit: 'µg/g', name: 'Calprotectin phân', description: 'Dấu ấn viêm ruột bạch cầu trung tính (<50: BT, 50-200: nhẹ/nghi ngờ, >200: IBD hoạt động mạnh)' },
  crp: { min: 0, max: 5, unit: 'mg/L', name: 'CRP (C-Reactive Protein)', description: 'Protein phản ứng C - Dấu ấn viêm cấp tính & mạn tính' },
  esr: { min: 0, max: 20, unit: 'mm/1h', name: 'Tốc độ lắng máu (ESR)', description: 'Chỉ số lắng máu - Tăng trong đợt bùng phát IBD' },
  hemoglobin: { min: 12.0, max: 16.5, unit: 'g/dL', name: 'Hemoglobin (Hb)', description: 'Huyết sắc tố - Đánh giá tình trạng thiếu máu xuất huyết tiêu hóa' },
  wbc: { min: 4.0, max: 10.0, unit: 'x10^9/L', name: 'Bạch cầu (WBC)', description: 'Tổng số bạch cầu' },
  ferritin: { min: 30, max: 300, unit: 'ng/mL', name: 'Ferritin', description: 'Dự trữ sắt trong cơ thể' },
};

/**
 * Tính điểm FIB-4 đánh giá xơ hóa gan
 * Formula: (Age * AST) / (Platelets * sqrt(ALT))
 */
export function calculateFIB4(age: number, ast?: number, alt?: number, platelets?: number): {
  score?: number;
  category?: 'Thấp (F0-F1)' | 'Trung gian (F2)' | 'Cao (F3-F4)';
  interpretation?: string;
  color?: string;
} {
  if (!age || !ast || !alt || !platelets || alt <= 0 || platelets <= 0) {
    return {};
  }

  const score = (age * ast) / (platelets * Math.sqrt(alt));
  const rounded = Math.round(score * 100) / 100;

  let category: 'Thấp (F0-F1)' | 'Trung gian (F2)' | 'Cao (F3-F4)' = 'Trung gian (F2)';
  let interpretation = '';
  let color = 'text-amber-600 bg-amber-50 border-amber-200';

  const lowCutoff = age >= 65 ? 2.0 : 1.3;
  const highCutoff = age >= 65 ? 3.25 : 2.67;

  if (rounded < lowCutoff) {
    category = 'Thấp (F0-F1)';
    interpretation = 'Nguy cơ xơ hóa gan tiến triển thấp (NPV > 90%). Thường không cần sinh thiết gan.';
    color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (rounded > highCutoff) {
    category = 'Cao (F3-F4)';
    interpretation = 'Nguy cơ cao có xơ hóa gan tiến triển hoặc xơ gan (PPV > 80%). Cần chuyên khoa can thiệp & tầm soát biến chứng.';
    color = 'text-rose-700 bg-rose-50 border-rose-200';
  } else {
    category = 'Trung gian (F2)';
    interpretation = 'Vùng xám (nguy cơ trung gian). Khuyến cáo làm thêm FibroScan hoặc ELF test.';
    color = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  return { score: rounded, category, interpretation, color };
}

/**
 * Tính điểm APRI (AST to Platelet Ratio Index)
 * Formula: (AST / Upper Limit of Normal AST = 40) * 100 / Platelets
 */
export function calculateAPRI(ast?: number, platelets?: number, ulnAst = 40): {
  score?: number;
  interpretation?: string;
} {
  if (!ast || !platelets || platelets <= 0) return {};
  const score = (ast / ulnAst) * 100 / platelets;
  const rounded = Math.round(score * 100) / 100;

  let interpretation = '';
  if (rounded < 0.5) {
    interpretation = 'APRI < 0.5: Rất ít khả năng xơ gan.';
  } else if (rounded > 1.5) {
    interpretation = 'APRI > 1.5: Nguy cơ cao xơ hóa gan có ý nghĩa (F2-F4).';
  } else {
    interpretation = 'APRI 0.5 - 1.5: Mức xơ hóa trung bình hoặc nghi ngờ.';
  }

  return { score: rounded, interpretation };
}

/**
 * Đánh giá mức độ Calprotectin phân trong IBD
 */
export function interpretCalprotectin(value?: number): {
  category: 'Bình thường' | 'Nghi ngờ/Nhẹ' | 'Hoạt động vừa - nặng' | 'Chưa xét nghiệm';
  description: string;
  color: string;
} {
  if (value === undefined || value === null) {
    return { category: 'Chưa xét nghiệm', description: 'Chưa có kết quả Calprotectin', color: 'text-slate-500 bg-slate-50 border-slate-200' };
  }
  if (value < 50) {
    return {
      category: 'Bình thường',
      description: '< 50 µg/g: Khả năng cao không có viêm ruột hoạt tính hoặc đang thuyên giảm sâu.',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  } else if (value <= 200) {
    return {
      category: 'Nghi ngờ/Nhẹ',
      description: '50 - 200 µg/g: Viêm nhẹ hoặc vùng ranh giới. Cần theo dõi kết hợp triệu chứng lâm sàng.',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  } else {
    return {
      category: 'Hoạt động vừa - nặng',
      description: '> 200 µg/g: Viêm ruột hoạt tính cao (đợt bùng phát IBD). Cân nhắc nội soi hoặc điều chỉnh phác đồ.',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    };
  }
}

/**
 * Thang phân Bristol (Bristol Stool Form Scale)
 */
export const BRISTOL_STOOL_SCALE: Record<BristolStoolType, {
  type: BristolStoolType;
  name: string;
  vietnameseTitle: string;
  description: string;
  category: 'Táo bón nặng' | 'Táo bón nhẹ' | 'Bình thường lý tưởng' | 'Bình thường' | 'Thiếu xơ' | 'Tiêu chảy nhẹ' | 'Tiêu chảy nặng';
  iconColor: string;
}> = {
  1: {
    type: 1,
    name: 'Type 1',
    vietnameseTitle: 'Cục cứng rời rạc (Hạt dẻ)',
    description: 'Các cục cứng riêng biệt, khó đi ngoài, thời gian lưu ruột dài (Táo bón nặng).',
    category: 'Táo bón nặng',
    iconColor: 'bg-stone-800 text-stone-100',
  },
  2: {
    type: 2,
    name: 'Type 2',
    vietnameseTitle: 'Hình xúc xích nhưng lổn nhổn',
    description: 'Dính liền dạng xúc xích nhưng có nhiều u cục gồ ghề (Táo bón nhẹ).',
    category: 'Táo bón nhẹ',
    iconColor: 'bg-stone-700 text-stone-100',
  },
  3: {
    type: 3,
    name: 'Type 3',
    vietnameseTitle: 'Hình xúc xích có vết nứt',
    description: 'Hình xúc xích với bề mặt có nhiều khe nứt (Phân bình thường).',
    category: 'Bình thường',
    iconColor: 'bg-amber-800 text-amber-100',
  },
  4: {
    type: 4,
    name: 'Type 4',
    vietnameseTitle: 'Hình xúc xích mềm, trơn láng',
    description: 'Mềm mại, trơn nhẵn như con rắn/xúc xích tiêu chuẩn (Lý tưởng nhất).',
    category: 'Bình thường lý tưởng',
    iconColor: 'bg-amber-700 text-white',
  },
  5: {
    type: 5,
    name: 'Type 5',
    vietnameseTitle: 'Từng miếng mềm, rìa rõ ràng',
    description: 'Các viên phân mềm, dễ đi ngoài, có bờ cạnh rõ (Hơi thiếu chất xơ).',
    category: 'Thiếu xơ',
    iconColor: 'bg-yellow-700 text-white',
  },
  6: {
    type: 6,
    name: 'Type 6',
    vietnameseTitle: 'Miếng xốp, mép rách rưới',
    description: 'Phân nhão, bông xốp, viền nham nhở (Tiêu chảy nhẹ/viêm nhẹ).',
    category: 'Tiêu chảy nhẹ',
    iconColor: 'bg-orange-700 text-white',
  },
  7: {
    type: 7,
    name: 'Type 7',
    vietnameseTitle: 'Hoàn toàn lỏng, không có cục',
    description: 'Toàn bộ là nước lỏng, không có phân khuôn (Tiêu chảy nặng).',
    category: 'Tiêu chảy nặng',
    iconColor: 'bg-red-700 text-white',
  },
};

/**
 * Kiểm tra giá trị xét nghiệm có bất thường không
 */
export function checkLabStatus(key: string, value?: number): {
  status: 'normal' | 'high' | 'low' | 'none';
  label: string;
  color: string;
} {
  if (value === undefined || value === null || isNaN(value)) {
    return { status: 'none', label: '-', color: 'text-slate-400' };
  }
  const ref = LAB_REFERENCE_RANGES[key];
  if (!ref) return { status: 'normal', label: `${value}`, color: 'text-slate-700' };

  if (value > ref.max) {
    const isCritical = value > ref.max * 2.5;
    return {
      status: 'high',
      label: `Cao (>${ref.max})`,
      color: isCritical ? 'text-rose-700 bg-rose-50 font-semibold' : 'text-amber-700 bg-amber-50',
    };
  } else if (value < ref.min) {
    return {
      status: 'low',
      label: `Thấp (<${ref.min})`,
      color: 'text-blue-700 bg-blue-50',
    };
  }
  return {
    status: 'normal',
    label: 'Bình thường',
    color: 'text-emerald-700 bg-emerald-50',
  };
}
