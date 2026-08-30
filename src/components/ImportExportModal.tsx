import React, { useState, useRef } from 'react';
import { PatientRecord } from '../types';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  CheckCircle, 
  AlertTriangle,
  Database
} from 'lucide-react';
import { 
  exportPatientsToCSV, 
  exportPatientsToJSON, 
  importPatientsFromJSON 
} from '../utils/storage';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientRecord[];
  onImportSuccess: (importedData: PatientRecord[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  patients,
  onImportSuccess,
}) => {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importPatientsFromJSON(content);
      if (res.success && res.data) {
        setImportStatus({
          type: 'success',
          message: `Đã nhập thành công ${res.data.length} hồ sơ bệnh nhân từ tệp sao lưu!`,
        });
        onImportSuccess(res.data);
      } else {
        setImportStatus({
          type: 'error',
          message: res.error || 'Có lỗi xảy ra khi nhập dữ liệu.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight">
              Sao Lưu, Xuất & Khôi Phục Dữ Liệu
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status feedback */}
          {importStatus.type && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
              importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {importStatus.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Section 1: Export */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Download className="h-4 w-4 text-indigo-600" />
              <span>1. Xuất Dữ Liệu Báo Cáo ({patients.length} bệnh nhân)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Xuất toàn bộ cơ sở dữ liệu bệnh nhân kèm kết quả xét nghiệm Gan, IBD, IBS ra máy tính để lưu trữ lâu dài hoặc làm nghiên cứu khoa học.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="btn-export-csv"
                onClick={() => exportPatientsToCSV(patients)}
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs transition shadow-xs"
              >
                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                <span>Xuất File Excel / CSV (UTF-8)</span>
              </button>

              <button
                id="btn-export-json"
                onClick={() => exportPatientsToJSON(patients)}
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition shadow-xs"
              >
                <FileJson className="h-4 w-4 text-slate-600" />
                <span>Sao Lưu File JSON (Dự phòng)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Import */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-600" />
              <span>2. Khôi Phục Dữ Liệu Từ File JSON</span>
            </h4>
            <p className="text-xs text-slate-400">
              Chọn tệp tin JSON đã sao lưu trước đó để khôi phục hoặc đồng bộ danh sách bệnh nhân.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              id="btn-trigger-import"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
            >
              <Upload className="h-4 w-4 text-slate-500" />
              <span>Chọn Tệp Tin .JSON Để Khôi Phục</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
