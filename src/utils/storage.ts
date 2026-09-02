import { PatientRecord } from '../types';

export function generateNextPatientCode(patients: PatientRecord[]): string {
  const currentYear = new Date().getFullYear();
  let maxNum = 0;
  
  patients.forEach(p => {
    const match = p.patientCode?.match(/BN-(\d{4})-(\d+)/);
    if (match && match[1] === String(currentYear)) {
      const num = parseInt(match[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, '0');
  return `BN-${currentYear}-${padded}`;
}

export function exportPatientsToJSON(patients: PatientRecord[]): void {
  const dataStr = JSON.stringify(patients, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `DS_BenhNhan_Gan_IBD_IBS_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportPatientsToCSV(patients: PatientRecord[]): void {
  const headers = [
    'Mã Bệnh Nhân',
    'Họ Và Tên',
    'Tuổi',
    'Giới Tính',
    'Số Điện Thoại',
    'Địa Chỉ',
    'Ngày Khám',
    'Nhóm Bệnh',
    'Chẩn Đoán Chi Tiết',
    'Bác Sĩ Phụ Trách',
    // Xét nghiệm Gan
    'AST (U/L)',
    'ALT (U/L)',
    'GGT (U/L)',
    'Bilirubin TP (mg/dL)',
    'Albumin (g/dL)',
    'Tiểu cầu (x10^9/L)',
    'INR',
    'AFP (ng/mL)',
    'FibroScan kPa',
    'FIB-4 Score',
    'FIB-4 Phân loại',
    // Xét nghiệm IBD
    'Calprotectin Phân (µg/g)',
    'CRP (mg/L)',
    'Lắng máu ESR (mm/h)',
    'Hemoglobin Hb (g/dL)',
    'Hoạt tính IBD',
    'Vị trí tổn thương',
    // Xét nghiệm IBS
    'Thể IBS (Rome IV)',
    'Thang phân Bristol',
    'Tần suất đi ngoài/ngày',
    'Số ngày đau bụng/tháng',
    'Điểm IBS-SSS',
    'Ghi Chú Điều Trị'
  ];

  const escapeCSV = (val: unknown) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = patients.map(p => {
    const categoryMap: Record<string, string> = {
      liver: 'Bệnh Gan Mật',
      ibd: 'Bệnh Viêm Ruột (IBD)',
      ibs: 'Hội Chứng Ruột Kích Thích (IBS)',
      mixed: 'Bệnh Phối Hợp'
    };
    const genderMap: Record<string, string> = {
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác'
    };

    return [
      escapeCSV(p.patientCode),
      escapeCSV(p.fullName),
      escapeCSV(p.age),
      escapeCSV(genderMap[p.gender] || p.gender),
      escapeCSV(p.phone || ''),
      escapeCSV(p.address || ''),
      escapeCSV(p.admissionDate),
      escapeCSV(categoryMap[p.primaryCategory] || p.primaryCategory),
      escapeCSV(p.specificDiagnosis),
      escapeCSV(p.doctorInCharge || ''),
      // Gan
      escapeCSV(p.liverLabs?.ast),
      escapeCSV(p.liverLabs?.alt),
      escapeCSV(p.liverLabs?.ggt),
      escapeCSV(p.liverLabs?.bilirubinTotal),
      escapeCSV(p.liverLabs?.albumin),
      escapeCSV(p.liverLabs?.platelets),
      escapeCSV(p.liverLabs?.inr),
      escapeCSV(p.liverLabs?.afp),
      escapeCSV(p.liverLabs?.fibroscanKpa),
      escapeCSV(p.liverLabs?.fib4Score),
      escapeCSV(p.liverLabs?.fib4Category),
      // IBD
      escapeCSV(p.ibdLabs?.fecalCalprotectin),
      escapeCSV(p.ibdLabs?.crp),
      escapeCSV(p.ibdLabs?.esr),
      escapeCSV(p.ibdLabs?.hemoglobin),
      escapeCSV(p.ibdLabs?.diseaseActivity),
      escapeCSV(p.ibdLabs?.affectedArea),
      // IBS
      escapeCSV(p.ibsLabs?.romeIVSubtype),
      escapeCSV(p.ibsLabs?.bristolStoolScale ? `Type ${p.ibsLabs.bristolStoolScale}` : ''),
      escapeCSV(p.ibsLabs?.stoolFrequencyPerDay),
      escapeCSV(p.ibsLabs?.abdominalPainDaysPerMonth),
      escapeCSV(p.ibsLabs?.ibssScore),
      escapeCSV(p.treatmentNotes || '')
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) for Excel compatibility with Vietnamese characters
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `BaoCao_BenhNhan_Gan_IBD_IBS_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const LOCAL_STORAGE_KEY = 'gi_track_patients_v1';
export const LOCAL_STORAGE_BACKUP_KEY = 'gi_track_patients_backup';

export function getLocalCachedPatients(): PatientRecord[] {
  try {
    const keys = [LOCAL_STORAGE_KEY, LOCAL_STORAGE_BACKUP_KEY, 'gi_track_patients', 'patients'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalBackup(patients: PatientRecord[]): void {
  try {
    if (patients && patients.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(patients));
    }
  } catch {
    // ignore
  }
}

export function importPatientsFromJSON(jsonString: string): { success: boolean; data?: PatientRecord[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'Tệp tin không chứa danh sách bệnh nhân hợp lệ (cần là định dạng mảng JSON).' };
    }
    if (parsed.length === 0) {
      return { success: false, error: 'Tệp tin rỗng không có bản ghi nào.' };
    }
    // Basic validation
    const isValid = parsed.every(p => p.id && p.fullName && p.primaryCategory);
    if (!isValid) {
      return { success: false, error: 'Dữ liệu không đúng cấu trúc bệnh nhân (thiếu Họ tên hoặc Nhóm bệnh).' };
    }
    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, error: `Lỗi đọc file JSON: ${(err as Error).message}` };
  }
}
