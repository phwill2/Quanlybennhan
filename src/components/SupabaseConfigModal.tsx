import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  KeyRound, 
  Server,
  Code2
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshConnection: () => Promise<void>;
  patientCount: number;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onRefreshConnection,
  patientCount,
}) => {
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const isConnected = isSupabaseConfigured();
  const currentUrl = import.meta.env.VITE_SUPABASE_URL || '';

  const sqlDDL = `-- 1. Tạo bảng patients trên Supabase PostgreSQL
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    medical_record_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    age INTEGER,
    gender TEXT DEFAULT 'male',
    phone TEXT,
    address TEXT,
    diagnosis TEXT,
    admission_date DATE DEFAULT CURRENT_DATE,
    discharge_date DATE,
    primary_category TEXT DEFAULT 'liver',
    specific_diagnosis TEXT,
    secondary_diagnosis TEXT,
    doctor_in_charge TEXT DEFAULT 'Bác sĩ Đỗ Trung Hiếu',
    liver_labs JSONB DEFAULT '{}'::jsonb,
    ibd_labs JSONB DEFAULT '{}'::jsonb,
    ibs_labs JSONB DEFAULT '{}'::jsonb,
    treatment_notes TEXT,
    medications JSONB DEFAULT '[]'::jsonb,
    dietary_plan TEXT,
    follow_up_date DATE,
    notes TEXT,
    visits JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Thiết lập Row Level Security (RLS) cho phép đọc ghi dữ liệu bệnh nhân
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon full access" ON public.patients;
CREATE POLICY "Allow anon full access" ON public.patients
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Tạo Index tối ưu hóa truy vấn nhanh theo mã bệnh án và ngày nhập viện
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON public.patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_patients_admission ON public.patients(admission_date DESC);`;

  const envSample = `VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlDDL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshConnection();
    setIsRefreshing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Kết Nối Supabase PostgreSQL</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {isConnected ? 'Đã kết nối PostgreSQL' : 'Cần cấu hình biến môi trường'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảng lưu trữ chính: <code className="text-emerald-300 font-mono">public.patients</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Box */}
          <div className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
            isConnected 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-start gap-3">
              {isConnected ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  {isConnected 
                    ? `Kết nối Supabase PostgreSQL đang hoạt động!` 
                    : 'Chưa phát hiện biến môi trường Supabase hợp lệ'}
                </p>
                <p className="text-xs text-slate-600">
                  {isConnected 
                    ? `Ứng dụng đang đọc & ghi dữ liệu trực tiếp vào Supabase (${patientCount} hồ sơ bệnh nhân trong CSDL). Mọi thao tác Thêm (INSERT), Sửa (UPDATE), Xoá (DELETE) đều lưu vào PostgreSQL.`
                    : 'Để kết nối với database Supabase của bạn, hãy thiết lập 2 biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.'}
                </p>
                {isConnected && currentUrl && (
                  <p className="text-[11px] font-mono text-emerald-800 break-all pt-1">
                    Host: {currentUrl}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shrink-0 shadow-xs transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Kiểm tra lại</span>
            </button>
          </div>

          {/* Step 1: Environment Variables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-600" />
                <span>1. Biến Môi Trường (Environment Variables)</span>
              </h4>
              <button
                onClick={handleCopyEnv}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                {copiedEnv ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedEnv ? 'Đã sao chép' : 'Sao chép mẫu'}</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Mở bảng điều khiển <strong>Project Settings → API</strong> trên Supabase để lấy <strong>Project URL</strong> và <strong>anon / public API key</strong>, sau đó điền vào cấu hình:
            </p>

            <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
              <div className="text-slate-400 select-none mb-1"># File .env / Secrets Configuration</div>
              <div className="text-emerald-400">VITE_SUPABASE_URL<span className="text-slate-400">=</span><span className="text-amber-300">"https://your-project-id.supabase.co"</span></div>
              <div className="text-emerald-400">VITE_SUPABASE_ANON_KEY<span className="text-slate-400">=</span><span className="text-amber-300">"your-supabase-anon-key"</span></div>
            </div>
          </div>

          {/* Step 2: SQL DDL Schema */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-600" />
                <span>2. Script Khởi Tạo Bảng <code className="text-emerald-700">patients</code> (SQL Editor)</span>
              </h4>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                {copiedSQL ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSQL ? 'Đã sao chép SQL' : 'Sao chép toàn bộ SQL'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Đăng nhập vào Supabase Dashboard, vào mục <strong>SQL Editor</strong>, dán đoạn script bên dưới và bấm <strong>Run</strong> để tạo bảng dữ liệu chuẩn:
            </p>

            <div className="relative">
              <pre className="bg-slate-900 rounded-2xl p-4 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 max-h-56 leading-relaxed">
                <code>{sqlDDL}</code>
              </pre>
            </div>
          </div>

          {/* Step 3: Architecture notes */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-slate-700" />
              <span>Cơ chế đồng bộ thời gian thực:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-500">
              <li><strong>SELECT:</strong> Khi tải hoặc làm mới trang, ứng dụng tự động truy vấn dữ liệu từ Supabase PostgreSQL.</li>
              <li><strong>INSERT:</strong> Tạo mới bệnh nhân sẽ đẩy bản ghi trực tiếp vào bảng <code className="font-mono text-slate-700">patients</code>.</li>
              <li><strong>UPDATE:</strong> Chỉnh sửa hồ sơ hoặc ghi nhận đợt tái khám sẽ cập nhật dòng tương ứng.</li>
              <li><strong>DELETE:</strong> Xóa bệnh nhân sẽ thực thi lệnh DELETE khỏi database Supabase.</li>
              <li>Không sử dụng localStorage làm nguồn dữ liệu chính.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            <span>Mở Supabase Dashboard</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
